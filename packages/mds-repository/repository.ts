/**
 * Copyright 2019 City of Los Angeles
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { pluralize, tail } from '@mds-core/mds-utils'
import { bool, cleanEnv } from 'envalid'
import { Connection, ConnectionOptions } from 'typeorm'
import { ConnectionManager, ConnectionManagerCliOptions, ConnectionManagerOptions, ConnectionMode } from './connection'
import { RepositoryLogger } from './logger'
import { RepositoryMigrations } from './migrations'

export type RepositoryOptions = Pick<ConnectionManagerOptions, 'entities' | 'migrations'>

export type ManagedConnection = Omit<Connection, 'connect' | 'close'>

const runAllMigrationsUsingConnection = async (connection: ManagedConnection): Promise<void> => {
  const {
    options: { migrationsTableName }
  } = connection
  if (migrationsTableName) {
    if (connection.migrations.length > 0) {
      const migrations = await connection.runMigrations({ transaction: 'all' })
      RepositoryLogger.info(
        `Ran ${migrations.length || 'no'} ${pluralize(
          migrations.length,
          'migration',
          'migrations'
        )} (${migrationsTableName})${
          migrations.length ? `: ${migrations.map(migration => migration.name).join(', ')}` : ''
        }`
      )
      RepositoryLogger.info(`Schema version (${migrationsTableName}): ${tail(connection.migrations).name}`)
    } else {
      RepositoryLogger.info(`No migrations defined (${migrationsTableName})`)
    }
  }
}

const revertAllMigrationsUsingConnection = async (connection: ManagedConnection): Promise<void> => {
  const {
    options: { migrationsTableName }
  } = connection
  if (migrationsTableName) {
    const { migrations } = connection
    await migrations.reduce(p => p.then(() => connection.undoLastMigration()), Promise.resolve())
    RepositoryLogger.info(
      `Reverted ${migrations.length || 'no'} ${pluralize(
        migrations.length,
        'migration',
        'migrations'
      )} (${migrationsTableName})${
        migrations.length ? `: ${migrations.map(migration => migration.name).join(', ')}` : ''
      }`
    )
  }
}

const asChunksForInsert = <TEntity>(entities: TEntity[], size = 4_000) => {
  const chunks =
    entities.length > size
      ? entities.reduce<Array<Array<TEntity>>>((reduced, t, index) => {
          const chunk = Math.floor(index / size)
          if (!reduced[chunk]) {
            reduced.push([])
          }
          reduced[chunk].push(t)
          return reduced
        }, [])
      : [entities]

  if (chunks.length > 1) {
    RepositoryLogger.info(`Splitting ${entities.length} records into ${chunks.length} chunks for insert`)
  }
  return chunks
}

export interface RepositoryPublicMethods {
  initialize: () => Promise<void>
  shutdown: () => Promise<void>
}

export type ReadOnlyRepositoryProtectedMethods = Pick<ConnectionManager<'ro'>, 'connect' | 'disconnect'>

export type ReadOnlyRepositoryPublicMethods<T> = T & RepositoryPublicMethods

export const ReadOnlyRepository = {
  Create: <T extends {}>(
    name: string,
    { entities }: Omit<Required<RepositoryOptions>, 'migrations'>,
    methods: (repository: ReadOnlyRepositoryProtectedMethods) => T
  ): ReadOnlyRepositoryPublicMethods<T> => {
    const { connect, disconnect } = new ConnectionManager<'ro'>(name, { entities })

    return {
      initialize: async () => {
        RepositoryLogger.info(`Initializing R/O repository: ${name}`)
        await connect('ro')
      },
      shutdown: async () => {
        RepositoryLogger.info(`Terminating R/O repository: ${name}`)
        await disconnect('ro')
      },
      ...methods({ connect, disconnect })
    }
  }
}

export type ReadWriteRepositoryProtectedMethods = Pick<ConnectionManager<'ro' | 'rw'>, 'connect' | 'disconnect'> & {
  asChunksForInsert: <TEntity>(entities: TEntity[], size?: number) => Array<TEntity[]>
}

export type ReadWriteRepositoryPublicMethods<T extends {}> = T &
  RepositoryPublicMethods & {
    cli: (options?: ConnectionManagerCliOptions) => ConnectionOptions
    runAllMigrations: () => Promise<void>
    revertAllMigrations: () => Promise<void>
  }

const CreateReadWriteRepository = <T>(
  name: string,
  { entities, migrations }: Required<RepositoryOptions>,
  methods: (repository: ReadWriteRepositoryProtectedMethods) => T
): ReadWriteRepositoryPublicMethods<T> => {
  const migrationsTableName = `${name}-migrations`

  const { connect, disconnect, ormconfig } = new ConnectionManager<'ro' | 'rw'>(name, {
    migrationsTableName,
    entities,
    migrations: migrations.length === 0 ? [] : RepositoryMigrations(migrationsTableName).concat(migrations)
  })

  const cli = (options?: ConnectionManagerCliOptions) => ormconfig('rw')

  const runAllMigrations = async (): Promise<void> => runAllMigrationsUsingConnection(await connect('rw'))

  const revertAllMigrations = async (): Promise<void> => revertAllMigrationsUsingConnection(await connect('rw'))

  const initialize = async () => {
    RepositoryLogger.info(`Initializing R/W repository: ${name}`)
    await Promise.all([connect('ro'), connect('rw')])

    // Enable migrations by default
    const { PG_MIGRATIONS } = cleanEnv(process.env, { PG_MIGRATIONS: bool({ default: true }) })
    if (PG_MIGRATIONS) {
      await runAllMigrations()
    }
  }

  const shutdown = async () => {
    RepositoryLogger.info(`Terminating R/W repository: ${name}`)
    await Promise.all([disconnect('ro'), disconnect('rw')])
  }

  return {
    initialize,
    shutdown,
    cli,
    runAllMigrations,
    revertAllMigrations,
    ...methods({ connect, disconnect, asChunksForInsert })
  }
}

/**
 * The following classes are being deprecated in favor of using the composition functions above.
 *
 * When ReadWriteRepository is eventually removed, it should be replaced with a const object that
 * mimics the static method (see the pattern implemented by ReadOnlyRepository):
 *
 * export const ReadWriteRepository = { Create: CreateReadWriteRepository }
 */

export abstract class BaseRepository<TConnectionMode extends ConnectionMode> {
  private readonly manager: ConnectionManager<TConnectionMode>

  protected ormconfig = (mode: TConnectionMode, options?: ConnectionManagerCliOptions): ConnectionOptions =>
    this.manager.ormconfig(mode, options)

  protected connect = async (mode: TConnectionMode): Promise<ManagedConnection> => this.manager.connect(mode)

  protected disconnect = async (mode: TConnectionMode): Promise<void> => this.manager.disconnect(mode)

  public abstract initialize: () => Promise<void>

  public abstract shutdown: () => Promise<void>

  constructor(public readonly name: string, { entities, migrations }: Required<RepositoryOptions>) {
    const migrationsTableName = `${name}-migrations`
    const metadataTableName = `${name}-migration-metadata`
    this.manager = new ConnectionManager(name, {
      migrationsTableName,
      metadataTableName,
      entities,
      migrations: migrations.length === 0 ? [] : RepositoryMigrations(migrationsTableName).concat(migrations)
    })
  }
}

export abstract class ReadWriteRepository extends BaseRepository<'ro' | 'rw'> {
  static Create = CreateReadWriteRepository

  public runAllMigrations = async (): Promise<void> => runAllMigrationsUsingConnection(await this.connect('rw'))

  public revertAllMigrations = async (): Promise<void> => revertAllMigrationsUsingConnection(await this.connect('rw'))

  public initialize = async (): Promise<void> => {
    RepositoryLogger.info(`Initializing R/W repository: ${this.name}`)
    await Promise.all([this.connect('ro'), this.connect('rw')])

    // Enable migrations by default
    const { PG_MIGRATIONS } = cleanEnv(process.env, { PG_MIGRATIONS: bool({ default: true }) })
    if (PG_MIGRATIONS) {
      await this.runAllMigrations()
    }
  }

  public shutdown = async (): Promise<void> => {
    RepositoryLogger.info(`Terminating R/W repository: ${this.name}`)
    await Promise.all([this.disconnect('ro'), this.disconnect('rw')])
  }

  public cli = (options?: ConnectionManagerCliOptions) => this.ormconfig('rw', options)

  protected asChunksForInsert = <TEntity>(entities: TEntity[], size?: number) => asChunksForInsert(entities, size)

  /**
   * @deprecated Use ReadWriteRepository.Create(...) instead of extending ReadWriteRepository and using new(...)
   */
  constructor(name: string, { entities = [], migrations = [] }: RepositoryOptions = {}) {
    super(name, { entities, migrations })
  }
}

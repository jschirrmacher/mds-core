/**
 * Copyright 2021 City of Los Angeles
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

import type { InsertReturning } from '@mds-core/mds-repository'
import { ReadWriteRepository, RepositoryError } from '@mds-core/mds-repository'
import { NotFoundError } from '@mds-core/mds-utils'
import type {
  CollectorMessageDomainCreateModel,
  CollectorMessageDomainModel,
  CollectorSchemaDomainCreateModel,
  CollectorSchemaDomainModel
} from '../@types'
import type { CollectorMessageEntityModel } from './entities/collector-message-entity'
import { CollectorMessageEntity } from './entities/collector-message-entity'
import type { CollectorSchemaEntityModel } from './entities/collector-schema-entity'
import { CollectorSchemaEntity } from './entities/collector-schema-entity'
import {
  CollectorMessageDomainToEntityCreate,
  CollectorMessageEntityToDomain,
  CollectorSchemaDomainToEntityCreate,
  CollectorSchemaEntityToDomain
} from './mappers'
import migrations from './migrations'

interface InsertCollectorMessagesOptions {
  beforeCommit: () => Promise<void>
}

export const CollectorRepository = ReadWriteRepository.Create(
  'collector',
  { entities: [CollectorSchemaEntity, CollectorMessageEntity], migrations },
  repository => {
    return {
      insertCollectorSchema: async (schema: CollectorSchemaDomainCreateModel): Promise<CollectorSchemaDomainModel> => {
        try {
          const connection = await repository.connect('rw')
          const {
            raw: [entity]
          }: InsertReturning<CollectorSchemaEntityModel> = await connection
            .getRepository(CollectorSchemaEntity)
            .createQueryBuilder()
            .insert()
            .values([CollectorSchemaDomainToEntityCreate.map(schema)])
            .returning('*')
            .onConflict('("schema_id") DO UPDATE SET "schema" = EXCLUDED."schema", "recorded" = EXCLUDED."recorded"')
            .execute()

          if (!entity) {
            throw new Error('Failed to insert schema')
          }

          return CollectorSchemaEntityToDomain.map(entity)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getCollectorSchema: async (
        schema_id: CollectorSchemaDomainModel['schema_id']
      ): Promise<CollectorSchemaDomainModel> => {
        try {
          const connection = await repository.connect('ro')
          const entity = await connection.getRepository(CollectorSchemaEntity).findOne({ where: { schema_id } })
          if (!entity) {
            throw new NotFoundError(`Schema ${schema_id} not found`)
          }
          return entity
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      insertCollectorMessages: async (
        messages: CollectorMessageDomainCreateModel[],
        options: Partial<InsertCollectorMessagesOptions> = {}
      ): Promise<CollectorMessageDomainModel[]> => {
        try {
          const { beforeCommit = async () => undefined } = options
          const connection = await repository.connect('rw')

          const chunks = repository.asChunksForInsert(
            messages.map(CollectorMessageDomainToEntityCreate.mapper({ recorded: Date.now() }))
          )

          const results: Array<InsertReturning<CollectorMessageEntityModel>> = await connection.transaction(
            async manager => {
              const committed = await Promise.all(
                chunks.map(chunk =>
                  manager
                    .getRepository(CollectorMessageEntity)
                    .createQueryBuilder()
                    .insert()
                    .values(messages.map(CollectorMessageDomainToEntityCreate.mapper()))
                    .returning('*')
                    .execute()
                )
              )
              await beforeCommit()
              return committed
            }
          )

          return results
            .reduce<Array<CollectorMessageEntity>>((entities, { raw: chunk = [] }) => entities.concat(chunk), [])
            .map(CollectorMessageEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      }
    }
  }
)

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

import { InsertReturning, ReadWriteRepository, RepositoryError } from '@mds-core/mds-repository'
import { UUID } from '@mds-core/mds-types'
import { isDefined, NotFoundError, now, testEnvSafeguard } from '@mds-core/mds-utils'
import { EntityManager, getManager } from 'typeorm'
import {
  ComplianceSnapshotDomainModel,
  ComplianceViolationDomainModel,
  ComplianceViolationPeriodEntityModel,
  GetComplianceSnapshotOptions,
  GetComplianceSnapshotsByTimeIntervalOptions,
  GetComplianceViolationOptions,
  GetComplianceViolationPeriodsOptions,
  GetComplianceViolationsByTimeIntervalOptions
} from '../@types'
import { ComplianceSnapshotEntity } from './entities/compliance-snapshot-entity'
import { ComplianceSnapshotFailureEntity } from './entities/compliance-snapshot-failure'
import { ComplianceViolationEntity } from './entities/compliance-violation-entity'
import {
  ComplianceSnapshotDomainToEntityCreate,
  ComplianceSnapshotEntityToDomain,
  ComplianceViolationDomainToEntityCreate,
  ComplianceViolationEntityToDomain
} from './mappers'
import migrations from './migrations'

export class SqlVals {
  public vals: (string | number | string[])[]

  private index: number

  public constructor() {
    this.vals = []
    this.index = 1
  }

  public add(value: string | number | string[]): string | number {
    this.vals.push(value)
    const literal = `$${this.index}`
    this.index += 1
    return literal
  }

  public values(): (string | number | string[])[] {
    return this.vals
  }
}

export const ComplianceRepository = ReadWriteRepository.Create(
  'compliance',
  {
    entities: [ComplianceSnapshotEntity, ComplianceViolationEntity, ComplianceSnapshotFailureEntity],
    migrations
  },
  repository => {
    return {
      getComplianceSnapshot: async (options: GetComplianceSnapshotOptions): Promise<ComplianceSnapshotDomainModel> => {
        // TODO look for cleaner solution
        const isComplianceIdOption = (option: unknown): option is { compliance_snapshot_id: UUID } =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (option as any).compliance_snapshot_id

        try {
          const connection = await repository.connect('ro')
          if (isComplianceIdOption(options)) {
            const { compliance_snapshot_id } = options
            const entity = await connection.getRepository(ComplianceSnapshotEntity).findOne({
              where: {
                compliance_snapshot_id
              }
            })
            if (!entity) {
              throw new NotFoundError(`ComplianceSnapshot ${compliance_snapshot_id} not found`)
            }
            return ComplianceSnapshotEntityToDomain.map(entity)
          }
          const { provider_id, policy_id, compliance_as_of = now() } = options
          if (!isDefined(provider_id) || !isDefined(policy_id)) {
            throw RepositoryError('provider_id and policy_id must be given if compliance_snapshot_id is not given')
          }

          const query = connection
            .getRepository(ComplianceSnapshotEntity)
            .createQueryBuilder()
            .where('provider_id = :provider_id', { provider_id })
            .andWhere('policy_id = :policy_id', { policy_id })
            .andWhere('compliance_as_of >= :compliance_as_of', { compliance_as_of })
            .orderBy('compliance_as_of')

          const entity = await query.getOne()
          if (!entity) {
            throw new NotFoundError(
              `ComplianceSnapshot not found with params ${JSON.stringify({
                policy_id,
                provider_id,
                compliance_as_of
              })}`
            )
          }
          return ComplianceSnapshotEntityToDomain.map(entity)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getComplianceSnapshotsByTimeInterval: async ({
        start_time,
        end_time = now(),
        provider_ids,
        policy_ids
      }: GetComplianceSnapshotsByTimeIntervalOptions): Promise<ComplianceSnapshotDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')
          const query = connection
            .getRepository(ComplianceSnapshotEntity)
            .createQueryBuilder()
            .where('compliance_as_of >= :start_time', { start_time })
            .andWhere('compliance_as_of <= :end_time', { end_time })
          if (isDefined(provider_ids)) {
            query.andWhere('provider_id IN (:...provider_ids)', { provider_ids })
          }
          if (isDefined(policy_ids)) {
            query.andWhere('policy_id IN (:...policy_ids)', { policy_ids })
          }

          query.orderBy('compliance_as_of')
          const entities = await query.getMany()
          return entities.map(ComplianceSnapshotEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getComplianceSnapshotsByIDs: async (ids: UUID[]): Promise<ComplianceSnapshotDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')
          const entities = connection
            .getRepository(ComplianceSnapshotEntity)
            .createQueryBuilder()
            .where('compliance_snapshot_id IN (:...ids)', { ids })
            .getMany()
          return (await entities).map(ComplianceSnapshotEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createComplianceSnapshot: async (
        complianceSnapshot: ComplianceSnapshotDomainModel,
        beforeCommit: (domain: ComplianceSnapshotDomainModel) => Promise<void>
      ): Promise<ComplianceSnapshotDomainModel> => {
        try {
          const connection = await repository.connect('rw')
          return connection.transaction(async (trans: EntityManager) => {
            const {
              raw: [entity]
            }: InsertReturning<ComplianceSnapshotEntity> = await trans
              .getRepository(ComplianceSnapshotEntity)
              .createQueryBuilder()
              .insert()
              .values([ComplianceSnapshotDomainToEntityCreate.map(complianceSnapshot)])
              .returning('*')
              .execute()

            if (!entity) {
              throw new Error('Failed to create compliance snapshot')
            }

            const domain = ComplianceSnapshotEntityToDomain.map(entity)

            // if there's an exception, it blows up and aborts the commit
            if (beforeCommit) {
              await beforeCommit(domain)
            }

            return domain
          })
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createComplianceSnapshots: async (
        ComplianceSnapshots: ComplianceSnapshotDomainModel[],
        beforeCommit: (domains: ComplianceSnapshotDomainModel[]) => Promise<void>
      ): Promise<ComplianceSnapshotDomainModel[]> => {
        if (ComplianceSnapshots.length === 0) return []
        try {
          const connection = await repository.connect('rw')
          return connection.transaction(async (trans: EntityManager) => {
            const { raw: entities }: InsertReturning<ComplianceSnapshotEntity> = await trans
              .getRepository(ComplianceSnapshotEntity)
              .createQueryBuilder()
              .insert()
              .values(ComplianceSnapshots.map(ComplianceSnapshotDomainToEntityCreate.mapper()))
              .returning('*')
              .execute()
            const domains = entities.map(ComplianceSnapshotEntityToDomain.mapper())

            // submit to kafka or whatever - but if there's an exception, it blows up and aborts the commit
            if (beforeCommit) {
              await beforeCommit(domains)
            }

            return domains
          })
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      /**
       * The complex SQL query has three parts:
       * 1. s1 iterates through the compliance_snapshots rows in the window of time of interest to get
       * contiguous rows where total_violations > 0.
       * 2. s2 sorts through the results of s1 to group snapshots by policy_id and provider_id.
       * 3. In s3, for each provider_id/policy_id, it gets all the violation periods, the start_time for each
       * violation period, and the snapshot ids for each violation period.
       * 4. Finally, for each violation period, it sets the end_time for each violation period (real_end_time),
       * by looking ahead to the next snapshot, which has no violations, and getting the timestamp of that snapshot.
       *
       * @param options Gets the periods of time for which a provider was in violation of a policy.
       */
      getComplianceViolationPeriods: async (
        options: GetComplianceViolationPeriodsOptions
      ): Promise<ComplianceViolationPeriodEntityModel[]> => {
        const { start_time, end_time = now(), policy_ids = [], provider_ids = [] } = options
        try {
          const connection = await repository.connect('ro')
          const entityManager = getManager(connection.name)
          const mainQueryPart1 = `select
          provider_id, policy_id,
          start_time,
          end_time,
          LEAD(end_time, 1, NULL) OVER (partition by provider_id, policy_id order by start_time) as real_end_time,
          compliance_snapshot_ids,
          sum_total_violations
          from (
            select
              provider_id, policy_id,
              min(compliance_as_of) as start_time,
              max(compliance_as_of) as end_time,
              array_agg(compliance_snapshot_id) as compliance_snapshot_ids,
              sum(total_violations) as sum_total_violations
              from (
                select
                provider_id, policy_id,
                max(group_number) OVER (partition BY provider_id, policy_id order by compliance_as_of) as group_number,
                compliance_as_of, compliance_snapshot_id, total_violations
                from (
                    select
                    provider_id, policy_id, compliance_as_of, compliance_snapshot_id, total_violations,
                    CASE WHEN
                    LAG(total_violations) OVER (partition BY provider_id, policy_id order by compliance_as_of) > 0
                      AND total_violations > 0
                      THEN NULL
                    ELSE
                      row_number() OVER (partition BY provider_id, policy_id order by compliance_as_of)
                    END group_number
                    from ${entityManager.getRepository(ComplianceSnapshotEntity).metadata.tableName}
                    where
                      `
          const mainQueryPart2 = `
                    order by provider_id, policy_id, compliance_as_of
                ) s1
              ) s2
              group by provider_id, policy_id, group_number
            ) s3; `

          const vals = new SqlVals()
          const queryPolicyIDs = policy_ids.length > 0
          const queryProviderIDs = provider_ids.length > 0
          const queryArray = [mainQueryPart1]

          queryArray.push(`compliance_as_of >= ${vals.add(start_time)}`)
          queryArray.push(`and compliance_as_of <= ${vals.add(end_time)}`)

          if (queryPolicyIDs) {
            queryArray.push(`and policy_id = ANY(${vals.add(policy_ids)})`)
          }

          if (queryProviderIDs) {
            queryArray.push(`and provider_id = ANY(${vals.add(provider_ids)})`)
          }
          queryArray.push(mainQueryPart2)

          return await entityManager.query(queryArray.join('\n'), vals.values())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getComplianceViolation: async (
        options: GetComplianceViolationOptions
      ): Promise<ComplianceViolationDomainModel> => {
        // TODO look for cleaner solution
        const isViolationIdOption = (option: unknown): option is { violation_id: UUID } =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (option as any).violation_id

        try {
          const connection = await repository.connect('ro')
          if (isViolationIdOption(options)) {
            const { violation_id } = options
            const entity = await connection.getRepository(ComplianceViolationEntity).findOne({
              where: {
                violation_id
              }
            })
            if (!entity) {
              throw new NotFoundError(`ComplianceViolation ${violation_id} not found`)
            }
            return ComplianceViolationEntityToDomain.map(entity)
          }

          const { event_timestamp, device_id, trip_id } = options
          if (!isDefined(event_timestamp) || !isDefined(device_id)) {
            throw RepositoryError('event_timestamp and device_id must be given if violation_id is not')
          }
          const query = connection
            .getRepository(ComplianceViolationEntity)
            .createQueryBuilder()
            .where('event_timestamp = :event_timestamp', { event_timestamp })
            .andWhere('device_id = :device_id', { device_id })
          if (isDefined(trip_id)) {
            query.andWhere('trip_id = :trip_id', { trip_id })
          }
          query.orderBy('event_timestamp')
          // FIXME what if multiple violations against same device with same timestamp?
          const entity = await query.getOne()
          if (!entity) {
            throw new NotFoundError(
              `ComplianceViolation not found with params ${JSON.stringify({
                event_timestamp,
                device_id,
                trip_id
              })}`
            )
          }
          return ComplianceViolationEntityToDomain.map(entity)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getComplianceViolationsByTimeInterval: async ({
        start_time,
        end_time = now(),
        provider_ids,
        policy_ids
      }: GetComplianceViolationsByTimeIntervalOptions): Promise<ComplianceViolationDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')
          const query = connection
            .getRepository(ComplianceViolationEntity)
            .createQueryBuilder()
            .where('timestamp >= :start_time', { start_time })
            .andWhere('timestamp <= :end_time', { end_time })
          if (isDefined(provider_ids)) {
            query.andWhere('provider_id = ANY(:provider_ids)', { provider_ids })
          }
          if (isDefined(policy_ids)) {
            query.andWhere('policy_id = ANY(:policy_ids)', { policy_ids })
          }
          query.orderBy('timestamp')
          const entities = await query.getMany()
          return entities.map(ComplianceViolationEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createComplianceViolation: async (
        complianceViolation: ComplianceViolationDomainModel
      ): Promise<ComplianceViolationDomainModel> => {
        try {
          const connection = await repository.connect('rw')
          const {
            raw: [entity]
          }: InsertReturning<ComplianceViolationEntity> = await connection
            .getRepository(ComplianceViolationEntity)
            .createQueryBuilder()
            .insert()
            .values([ComplianceViolationDomainToEntityCreate.map(complianceViolation)])
            .returning('*')
            .execute()

          if (!entity) {
            throw new Error('Failed to create compliance violation')
          }

          return ComplianceViolationEntityToDomain.map(entity)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createComplianceViolations: async (
        complianceViolations: ComplianceViolationDomainModel[]
      ): Promise<ComplianceViolationDomainModel[]> => {
        try {
          const connection = await repository.connect('rw')
          const { raw: entities }: InsertReturning<ComplianceViolationEntity> = await connection
            .getRepository(ComplianceViolationEntity)
            .createQueryBuilder()
            .insert()
            .values(complianceViolations.map(ComplianceViolationDomainToEntityCreate.mapper()))
            .returning('*')
            .execute()
          return entities.map(ComplianceViolationEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      writeComplianceSnapshotFailures: async (compliance_snapshot_ids: UUID[]): Promise<void> => {
        // I just want to write the current timestamp and the IDs
        const timestamp = Date.now()
        try {
          const connection = await repository.connect('rw')
          await connection
            .getRepository(ComplianceSnapshotFailureEntity)
            .createQueryBuilder()
            .insert()
            .values(compliance_snapshot_ids.map(compliance_snapshot_id => ({ compliance_snapshot_id, timestamp })))
            .execute()
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      deleteAll: async () => {
        testEnvSafeguard()
        try {
          const connection = await repository.connect('rw')
          await connection
            .getRepository(ComplianceSnapshotEntity)
            .query('TRUNCATE "compliance_snapshots", "compliance_violations" RESTART IDENTITY')
        } catch (error) {
          throw RepositoryError(error)
        }
      }
    }
  }
)

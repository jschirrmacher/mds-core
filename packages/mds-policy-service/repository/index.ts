/**
 * Copyright 2020 City of Los Angeles
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
import type { Timestamp, UUID } from '@mds-core/mds-types'
import { ConflictError, hasAtLeastOneEntry, NotFoundError, now, testEnvSafeguard } from '@mds-core/mds-utils'
import { buildPaginator } from 'typeorm-cursor-pagination'
import type {
  FILTER_POLICY_STATUS,
  PolicyDomainCreateModel,
  PolicyDomainModel,
  PolicyMetadataDomainModel,
  POLICY_STATUS,
  PresentationOptions,
  ReadPoliciesResponse,
  ReadPolicyQueryParams
} from '../@types'
import entities from './entities'
import { PolicyEntity } from './entities/policy-entity'
import { PolicyMetadataEntity } from './entities/policy-metadata-entity'
import {
  PolicyDomainToEntityCreate,
  PolicyEntityToDomain,
  PolicyMetadataDomainToEntityCreate,
  PolicyMetadataEntityToDomain
} from './mappers'
import migrations from './migrations'

export const PolicyRepository = ReadWriteRepository.Create('policies', { entities, migrations }, repository => {
  const readPolicies = async (
    params: ReadPolicyQueryParams = {},
    presentationOptions: PresentationOptions = {},
    timestamp: Timestamp = now()
  ) => {
    const {
      policy_ids,
      rule_id,
      get_unpublished,
      get_published,
      start_date,
      geography_ids,
      statuses = [],
      active_on,
      limit,
      beforeCursor,
      afterCursor,
      sort = 'status',
      direction
    } = params
    const statusFilters = (() => {
      const filters: FILTER_POLICY_STATUS[] = []
      if (get_unpublished) filters.push('draft')
      if (get_published) filters.push('active', 'pending', 'expired')
      if (filters.length) return filters
      return statuses
    })()

    /** Turns statuses into expressions with params */
    const DELIMITER = ' AND '
    const PUBLISHED = 'publish_date IS NOT NULL'
    const NOT_PUBLISHED = 'publish_date IS NULL'
    const START_DATE_IN_PAST = 'start_date IS NOT NULL AND start_date <= :now'
    const START_DATE_IN_FUTURE = 'start_date IS NOT NULL AND start_date > :now'
    const END_DATE_IN_PAST = 'end_date IS NOT NULL AND end_date <= :now'
    const END_DATE_NULL_OR_IN_FUTURE = '(end_date IS NULL OR end_date > :now)'
    const SUPERSEDED = [
      'superseded_by IS NOT NULL',
      'array_length(superseded_by, 1) >= 1',
      '(select min(x) from unnest(superseded_at) x) < extract(epoch from now())*1000'
    ].join(DELIMITER)
    const NOT_SUPERSEDED =
      '(superseded_by IS NULL) OR ' +
      [
        'superseded_by IS NOT NULL',
        'array_length(superseded_by, 1) >= 1',
        '(select max(x) from unnest(superseded_at) x) > extract(epoch from now())*1000'
      ].join(DELIMITER)

    const STATUS_ORDER = `CASE
      WHEN ${[NOT_PUBLISHED].join(DELIMITER)} THEN 5
      WHEN ${[SUPERSEDED].join(DELIMITER)} THEN 4
      WHEN ${[PUBLISHED, END_DATE_IN_PAST, NOT_SUPERSEDED].join(DELIMITER)} THEN 3
      WHEN ${[PUBLISHED, START_DATE_IN_FUTURE, NOT_SUPERSEDED].join(DELIMITER)} THEN 2
      WHEN ${[PUBLISHED, START_DATE_IN_PAST, END_DATE_NULL_OR_IN_FUTURE, NOT_SUPERSEDED].join(DELIMITER)} THEN 1
      ELSE 6
    END`

    const ALIAS = 'pe'

    try {
      const connection = await repository.connect('ro')
      const query = connection.getRepository(PolicyEntity).createQueryBuilder(ALIAS)

      const pager = (() => {
        if (limit) {
          const keys: (keyof PolicyEntity)[] = ['id']
          if (sort === 'start_date') {
            keys.push('start_date')
          }
          return buildPaginator({
            entity: PolicyEntity,
            alias: ALIAS,
            paginationKeys: keys,
            query: {
              limit: limit,
              order: direction,
              afterCursor: afterCursor ?? undefined,
              beforeCursor: beforeCursor ?? undefined
            }
          })
        } else if (sort === 'status') {
          query.addOrderBy(`(${STATUS_ORDER})`, direction)
          query.setParameter('now', timestamp)
        } else {
          query.addOrderBy(sort, direction)
        }
      })()

      if (policy_ids) {
        query.andWhere('policy_id = ANY(:policy_ids)', { policy_ids })
      }

      if (rule_id) {
        query.andWhere(
          "EXISTS(SELECT FROM json_array_elements(policy_json->'rules') elem WHERE (elem->'rule_id')::jsonb ? :rule_id)",
          { rule_id }
        )
      }

      if (active_on) {
        query.andWhere('(:stop >= start_date AND (end_date IS NULL OR end_date >= :start))', active_on)
      }

      if (start_date) {
        query.andWhere('start_date >= :start_date', { start_date })
      }

      if (geography_ids) {
        query.andWhere(
          `array( select json_array_elements_text(json_array_elements(policy_json->'rules')->'geographies')) && :geography_ids`,
          { geography_ids }
        )
      }

      if (statusFilters && statusFilters.length > 0) {
        const statusToExpressionWithParams: {
          [key in FILTER_POLICY_STATUS]: { expression: string; params?: object }
        } = {
          draft: {
            expression: [NOT_PUBLISHED].join(DELIMITER)
          },
          deactivated: {
            expression: [SUPERSEDED].join(DELIMITER)
          },
          expired: {
            expression: [PUBLISHED, END_DATE_IN_PAST, NOT_SUPERSEDED].join(DELIMITER),
            params: { now: timestamp }
          },
          pending: {
            expression: [PUBLISHED, START_DATE_IN_FUTURE, NOT_SUPERSEDED].join(DELIMITER),
            params: { now: timestamp }
          },
          active: {
            expression: [PUBLISHED, START_DATE_IN_PAST, END_DATE_NULL_OR_IN_FUTURE, NOT_SUPERSEDED].join(DELIMITER),
            params: { now: timestamp }
          }
        }

        const expressionsWithParams = statusFilters.map(status => statusToExpressionWithParams[status])

        if (expressionsWithParams.length === 1 && hasAtLeastOneEntry(expressionsWithParams)) {
          // the hasAtLeastOneEntry check is a bit redundant, but serves as a type guard so we can safely access the first element
          const [{ expression, params }] = expressionsWithParams
          query.andWhere(expression, params)
        } else {
          const { expressions, params } = expressionsWithParams.reduce<{ expressions: string[]; params: object }>(
            ({ expressions, params: paramsList }, { expression, params }) => {
              return { expressions: [...expressions, expression], params: { ...paramsList, ...params } }
            },
            { expressions: [], params: {} }
          )
          query.andWhere(`(${expressions.join(' OR ')})`, params)
        }
      }
      if (pager) {
        const { data, cursor } = await pager.paginate(query)
        const result: ReadPoliciesResponse = {
          policies: data.map(entity => PolicyEntityToDomain.map(entity, presentationOptions))
        }
        if (cursor.afterCursor || cursor.beforeCursor) {
          result.cursor = {
            next: cursor.afterCursor,
            prev: cursor.beforeCursor
          }
        }
        return {
          policies: data.map(entity => PolicyEntityToDomain.map(entity, presentationOptions)),
          cursor: {
            next: cursor.afterCursor,
            prev: cursor.beforeCursor
          }
        }
      }
      return { policies: (await query.getMany()).map(entity => PolicyEntityToDomain.map(entity, presentationOptions)) }
    } catch (error) {
      throw RepositoryError(error)
    }
  }

  const throwIfRulesAlreadyExist = async (policy: PolicyDomainCreateModel) => {
    const policies = await Promise.all(
      policy.rules.map(async ({ rule_id }) => {
        const { policies } = await readPolicies({ rule_id })
        return policies
      })
    )
    const policyIds = policies.flat().map(({ policy_id }) => policy_id)

    if (policyIds.some(policy_id => policy_id !== policy.policy_id)) {
      throw new ConflictError(`Policies containing rules with the same id or ids already exist`)
    }
  }

  const isPolicyPublished = async (policy_id: UUID) => {
    try {
      const connection = await repository.connect('ro')
      const entity = await connection.getRepository(PolicyEntity).findOneOrFail({ policy_id })
      if (!entity) {
        return false
      }
      return Boolean(PolicyEntityToDomain.map(entity).publish_date)
    } catch (error) {
      if (error instanceof Error && error.name === 'EntityNotFoundError') {
        throw new NotFoundError(error)
      }
      throw RepositoryError(error)
    }
  }

  const readSinglePolicyMetadata = async (policy_id: UUID) => {
    try {
      const connection = await repository.connect('ro')
      const entity = await connection.getRepository(PolicyMetadataEntity).findOneOrFail({ policy_id })
      return PolicyMetadataEntityToDomain.map(entity)
    } catch (error) {
      if (error instanceof Error && error.name === 'EntityNotFoundError') {
        throw new NotFoundError(error)
      }
      throw RepositoryError(error)
    }
  }

  return {
    readPolicies,

    readActivePolicies: async (timestamp: Timestamp = now()) => {
      try {
        const { policies } = await readPolicies({ statuses: ['active'] }, { withStatus: true }, timestamp)
        return policies as (Omit<PolicyDomainModel, 'status'> & Required<{ status: POLICY_STATUS }>)[]
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    readBulkPolicyMetadata: async <M>(params: ReadPolicyQueryParams = {}) => {
      const { policies } = await readPolicies(params)

      if (policies.length === 0) {
        return []
      }

      const connection = await repository.connect('ro')
      const entities = await connection
        .getRepository(PolicyMetadataEntity)
        .createQueryBuilder()
        .andWhere('policy_id = ANY(:policy_ids)', { policy_ids: policies.map(p => p.policy_id) })
        .getMany()

      return entities.map(PolicyMetadataEntityToDomain.map) as PolicyMetadataDomainModel<M>[]
    },

    readSinglePolicyMetadata,

    readPolicy: async (policy_id: UUID, presentationOptions: PresentationOptions = {}) => {
      try {
        const connection = await repository.connect('ro')
        const entity = await connection.getRepository(PolicyEntity).findOneOrFail({ policy_id })
        return PolicyEntityToDomain.map(entity, presentationOptions)
      } catch (error) {
        if (error instanceof Error && error.name === 'EntityNotFoundError') {
          throw new NotFoundError(error)
        }
        throw RepositoryError(error)
      }
    },

    writePolicy: async (policy: PolicyDomainCreateModel): Promise<PolicyDomainModel> => {
      await throwIfRulesAlreadyExist(policy)
      try {
        const connection = await repository.connect('rw')
        const {
          raw: [entity]
        }: InsertReturning<PolicyEntity> = await connection
          .getRepository(PolicyEntity)
          .createQueryBuilder()
          .insert()
          .values(PolicyDomainToEntityCreate.map(policy))
          .returning('*')
          .execute()

        if (!entity) {
          throw new Error('Failed to write policy')
        }

        return PolicyEntityToDomain.map(entity)
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    isPolicyPublished,

    editPolicy: async (policy: PolicyDomainCreateModel) => {
      const { policy_id } = policy

      if (await isPolicyPublished(policy_id)) {
        throw new ConflictError('Cannot edit published policy')
      }

      const { policies } = await readPolicies({
        policy_ids: [policy_id],
        get_unpublished: true,
        get_published: false
      })
      if (policies.length === 0) {
        throw new NotFoundError(`no policy of id ${policy_id} was found`)
      }
      await throwIfRulesAlreadyExist(policy)
      const { start_date, end_date, publish_date } = policy
      try {
        const connection = await repository.connect('rw')
        const {
          raw: [updated]
        } = await connection
          .getRepository(PolicyEntity)
          .createQueryBuilder()
          .update()
          .set({ start_date, end_date, publish_date, policy_json: { ...policy } })
          .where('policy_id = :policy_id', { policy_id })
          .andWhere('publish_date IS NULL')
          .returning('*')
          .execute()
        return PolicyEntityToDomain.map(updated)
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    deletePolicy: async (policy_id: UUID) => {
      if (await isPolicyPublished(policy_id)) {
        throw new ConflictError('Cannot edit published Policy')
      }

      try {
        const connection = await repository.connect('rw')
        const {
          raw: [deleted]
        } = await connection
          .getRepository(PolicyEntity)
          .createQueryBuilder()
          .delete()
          .where('policy_id = :policy_id', { policy_id })
          .andWhere('publish_date IS NULL')
          .returning('*')
          .execute()
        return PolicyEntityToDomain.map(deleted).policy_id
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    /* Only publish the policy if the geographies are successfully published first */
    publishPolicy: async (
      policy_id: UUID,
      publish_date = now(),
      options: { beforeCommit?: (pendingPolicy: PolicyDomainModel) => Promise<void> } = {}
    ) => {
      try {
        const { beforeCommit = async () => undefined } = options

        if (await isPolicyPublished(policy_id)) {
          throw new ConflictError('Cannot re-publish existing policy')
        }

        const {
          policies: [policy]
        } = await readPolicies({ policy_ids: [policy_id], get_unpublished: true, get_published: null })

        if (!policy) {
          throw new NotFoundError('cannot publish nonexistent policy')
        }

        if (policy.start_date < publish_date) {
          throw new ConflictError('Policies cannot be published after their start_date')
        }

        try {
          const connection = await repository.connect('rw')
          const publishedPolicy = await connection.transaction(async manager => {
            const {
              raw: [updated]
            } = await manager
              .getRepository(PolicyEntity)
              .createQueryBuilder()
              .update()
              .set({ publish_date })
              .where('policy_id = :policy_id', { policy_id })
              .andWhere('publish_date IS NULL')
              .returning('*')
              .execute()
            const mappedPolicy = PolicyEntityToDomain.map(updated)
            await beforeCommit(mappedPolicy)

            return mappedPolicy
          })

          return publishedPolicy
        } catch (error) {
          throw RepositoryError(error)
        }
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    writePolicyMetadata: async (policy_metadata: PolicyMetadataDomainModel) => {
      try {
        const connection = await repository.connect('rw')
        const {
          raw: [entity]
        }: InsertReturning<PolicyMetadataEntity> = await connection
          .getRepository(PolicyMetadataEntity)
          .createQueryBuilder()
          .insert()
          .values(PolicyMetadataDomainToEntityCreate.map(policy_metadata))
          .returning('*')
          .execute()

        if (!entity) {
          throw new Error('Failed to write policy metadata')
        }

        return PolicyMetadataEntityToDomain.map(entity)
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    updatePolicyMetadata: async <M>(metadata: PolicyMetadataDomainModel<M>) => {
      try {
        const { policy_id, policy_metadata } = metadata
        await readSinglePolicyMetadata(policy_id)

        const connection = await repository.connect('rw')
        const {
          raw: [updated]
        } = await connection
          .getRepository(PolicyMetadataEntity)
          .createQueryBuilder()
          .update()
          .set({ policy_metadata })
          .where('policy_id = :policy_id', { policy_id })
          .returning('*')
          .execute()
        return PolicyMetadataEntityToDomain.map(updated) as PolicyMetadataDomainModel<M>
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    readRule: async (rule_id: UUID) => {
      try {
        const connection = await repository.connect('rw')
        const policy = await connection
          .getRepository(PolicyEntity)
          .createQueryBuilder()
          .select()
          .where(
            "EXISTS (SELECT FROM json_array_elements(policy_json->'rules') elem WHERE (elem->'rule_id')::jsonb ? :rule_id) ",
            { rule_id }
          )
          .getOneOrFail()
        return PolicyEntityToDomain.map(policy).rules.filter(r => r.rule_id === rule_id)
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    /**
     * @param {UUID} policy_id policy_id which is being superseded
     * @param {UUID} superseding_policy_id policy_id which is superseding the original policy_id
     */
    updatePolicySupersededBy: async (policy_id: UUID, superseding_policy_id: UUID, policy_superseded_at: Timestamp) => {
      try {
        const connection = await repository.connect('rw')

        const { superseded_by, superseded_at } = await connection
          .getRepository(PolicyEntity)
          .findOneOrFail({ policy_id })

        const updatedSupersededBy = superseded_by ? [...superseded_by, superseding_policy_id] : [superseding_policy_id]
        const updatedSupersededAt = superseded_at ? [...superseded_at, policy_superseded_at] : [policy_superseded_at]

        const {
          raw: [updated]
        } = await connection
          .getRepository(PolicyEntity)
          .createQueryBuilder()
          .update()
          .set({ superseded_by: updatedSupersededBy, superseded_at: updatedSupersededAt })
          .where('policy_id = :policy_id', { policy_id })
          .returning('*')
          .execute()

        return PolicyEntityToDomain.map(updated)
      } catch (error) {
        throw RepositoryError(error)
      }
    },

    deleteAll: async () => {
      testEnvSafeguard()
      try {
        const connection = await repository.connect('rw')
        await connection.getRepository(PolicyEntity).query('TRUNCATE "policies", "policy_metadata" RESTART IDENTITY')
      } catch (error) {
        throw RepositoryError(error)
      }
    }
  }
})

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

import { InsertReturning, ReadWriteRepository, RepositoryError } from '@mds-core/mds-repository'
import { UUID } from '@mds-core/mds-types'
import { NotFoundError } from '@mds-core/mds-utils'
import { Between, Brackets, FindOperator, In, LessThan, MoreThan } from 'typeorm'
import { buildPaginator, Cursor } from 'typeorm-cursor-pagination'
import {
  TransactionDomainModel,
  TransactionOperationDomainModel,
  TransactionSearchParams,
  TransactionStatusDomainModel
} from '../@types'
import { validateTransactionSearchParams } from '../service/validators'
import { TransactionOperationEntity } from './entities/operation-entity'
import { TransactionStatusEntity } from './entities/status-entity'
import { TransactionEntity } from './entities/transaction-entity'
import {
  TransactionDomainToEntityCreate,
  TransactionEntityToDomain,
  TransactionOperationDomainToEntityCreate,
  TransactionOperationEntityToDomain,
  TransactionStatusDomainToEntityCreate,
  TransactionStatusEntityToDomain
} from './mappers'
import migrations from './migrations'

/**
 * Aborts execution if not running under a test environment.
 */
const testEnvSafeguard = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(`This method is only supported when executing tests`)
  }
}

interface InsertTransactionOptions {
  beforeCommit: (pendingTransaction: TransactionDomainModel) => Promise<void>
}

interface InsertTransactionsOptions {
  beforeCommit: (pendingTransactions: TransactionDomainModel[]) => Promise<void>
}

export const TransactionRepository = ReadWriteRepository.Create(
  'transactions',
  {
    entities: [TransactionEntity, TransactionOperationEntity, TransactionStatusEntity],
    migrations
  },
  repository => {
    return {
      getTransaction: async (transaction_id: UUID): Promise<TransactionDomainModel> => {
        try {
          const connection = await repository.connect('ro')
          const entity = await connection.getRepository(TransactionEntity).findOne({
            where: {
              transaction_id
            }
          })
          if (!entity) {
            throw new NotFoundError(`Transaction ${transaction_id} not found`)
          }
          return TransactionEntityToDomain.map(entity)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getTransactions: async (
        search: TransactionSearchParams
      ): Promise<{ transactions: TransactionDomainModel[]; cursor: Cursor }> => {
        const {
          provider_id,
          start_timestamp,
          end_timestamp,
          search_text,
          start_amount,
          end_amount,
          fee_type,
          before,
          after,
          limit,
          order
        } = validateTransactionSearchParams(search)

        const resolveTimeBounds = (): { timestamp?: FindOperator<number> } => {
          if (start_timestamp && end_timestamp) {
            return { timestamp: Between(start_timestamp, end_timestamp) }
          }
          if (start_timestamp) {
            return { timestamp: MoreThan(start_timestamp) }
          }
          if (end_timestamp) {
            return { timestamp: LessThan(end_timestamp) }
          }
          return {}
        }

        const jsonSearch = (alias: string) => {
          /**
           * 'simple' means no word-stemming, all words are indexed and searchable.
           * ['string','numeric','boolean'] means all values of the JSONB column are being searched as text
           */
          return search_text
            ? new Brackets(qb =>
                qb.where(
                  `jsonb_to_tsvector('simple',${alias}.receipt,'["string","numeric","boolean"]') @@ to_tsquery(:search_text)`,
                  {
                    search_text: search_text + ':*'
                  }
                )
              )
            : []
        }

        const resolveProviderId = (): { provider_id?: UUID } => (provider_id ? { provider_id } : {})

        const resolveConditions = (alias: string) => {
          const clauses = [
            start_amount ? new Brackets(qb => qb.where(`amount > :start_amount`, { start_amount })) : [],
            end_amount ? new Brackets(qb => qb.where(`amount < :end_amount`, { end_amount })) : [],
            fee_type ? new Brackets(qb => qb.where({ fee_type })) : [],
            jsonSearch(alias)
          ]

          return clauses.flat().reduce((acc, clause) => {
            return new Brackets(qb => qb.andWhere(acc).andWhere(clause))
          }, new Brackets(qb => qb.where('1=1')))
        }

        try {
          const connection = await repository.connect('ro')

          /**
           * Need to generate a shared alias due to the different aliasing methods in TypeORM & TypeORM Cursor Paginator
           * depending on debug vs production environments.
           */
          const alias = 'transactionentity'

          const queryBuilder = connection
            .getRepository(TransactionEntity)
            .createQueryBuilder(alias)
            .where({ ...resolveProviderId(), ...resolveTimeBounds() })
            .andWhere(resolveConditions(alias))

          const { data, cursor } = await buildPaginator({
            alias,
            entity: TransactionEntity,
            query: {
              limit,
              order: order?.direction ?? 'ASC',
              afterCursor: after,
              beforeCursor: after ? undefined : before
            },
            paginationKeys: [order?.column ?? 'id']
          }).paginate(queryBuilder)
          return { transactions: data.map(TransactionEntityToDomain.mapper()), cursor }
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createTransaction: async (
        transaction: TransactionDomainModel,
        options: Partial<InsertTransactionOptions>
      ): Promise<TransactionDomainModel> => {
        const { beforeCommit = async () => undefined } = options
        try {
          const connection = await repository.connect('rw')
          const result = await connection.transaction(async manager => {
            const {
              raw: [entity]
            }: InsertReturning<TransactionEntity> = await manager
              .getRepository(TransactionEntity)
              .createQueryBuilder()
              .insert()
              .values([TransactionDomainToEntityCreate.map(transaction)])
              .returning('*')
              .execute()

            if (!entity) {
              throw new Error('Failed to create transaction')
            }

            const pendingTransaction = TransactionEntityToDomain.map(entity)
            await beforeCommit(pendingTransaction)
            return pendingTransaction
          })
          return result
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createTransactions: async (
        transactions: TransactionDomainModel[],
        options: Partial<InsertTransactionsOptions>
      ): Promise<TransactionDomainModel[]> => {
        const { beforeCommit = async () => undefined } = options
        try {
          const connection = await repository.connect('rw')
          const result = await connection.transaction(async manager => {
            const { raw: entities }: InsertReturning<TransactionEntity> = await manager
              .getRepository(TransactionEntity)
              .createQueryBuilder()
              .insert()
              .values(transactions.map(TransactionDomainToEntityCreate.mapper()))
              .returning('*')
              .execute()
            const pendingTransactions = entities.map(TransactionEntityToDomain.map)
            await beforeCommit(pendingTransactions)
            return pendingTransactions
          })
          return result
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      addTransactionOperation: async (
        transactionOperation: TransactionOperationDomainModel
      ): Promise<TransactionOperationDomainModel> => {
        try {
          const connection = await repository.connect('rw')
          const {
            raw: [entity]
          }: InsertReturning<TransactionOperationEntity> = await connection
            .getRepository(TransactionOperationEntity)
            .createQueryBuilder()
            .insert()
            .values([TransactionOperationDomainToEntityCreate.map(transactionOperation)])
            .returning('*')
            .execute()

          if (!entity) {
            throw new Error('Failed to create transaction operation')
          }
          return TransactionOperationEntityToDomain.map(entity)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      // TODO search criteria, paging
      getTransactionOperations: async (transaction_id: UUID): Promise<TransactionOperationDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')
          const entities = await connection
            .getRepository(TransactionOperationEntity)
            .find({ where: { transaction_id } })
          return entities.map(TransactionOperationEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      setTransactionStatus: async (
        transactionStatus: TransactionStatusDomainModel
      ): Promise<TransactionStatusDomainModel> => {
        try {
          const connection = await repository.connect('rw')
          const {
            raw: [entity]
          }: InsertReturning<TransactionStatusEntity> = await connection
            .getRepository(TransactionStatusEntity)
            .createQueryBuilder()
            .insert()
            .values([TransactionStatusDomainToEntityCreate.map(transactionStatus)])
            .returning('*')
            .execute()

          if (!entity) {
            throw new Error('Failed to create transaction status')
          }

          return TransactionStatusEntityToDomain.map(entity)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      // TODO search criteria, paging
      getTransactionStatuses: async (transaction_id: UUID): Promise<TransactionStatusDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')
          const entities = await connection.getRepository(TransactionStatusEntity).find({ where: { transaction_id } })
          return entities.map(TransactionStatusEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getTransactionsStatuses: async (
        transaction_ids: UUID[]
      ): Promise<Record<UUID, TransactionStatusDomainModel[]>> => {
        try {
          const connection = await repository.connect('ro')
          const entities: { transaction_id: UUID; statuses: TransactionStatusEntity[] }[] = await connection
            .getRepository(TransactionStatusEntity)
            .createQueryBuilder()
            .select('transaction_id, ARRAY_AGG(row_to_json("TransactionStatusEntity".*)) as statuses')
            .where({ transaction_id: In(transaction_ids) })
            .groupBy(`transaction_id`)
            .execute()

          // Map the statuses within the object to their domain models
          return entities.reduce<Record<UUID, TransactionStatusDomainModel[]>>((acc, { transaction_id, statuses }) => {
            const mappedStatuses = statuses.map(TransactionStatusEntityToDomain.mapper())
            return { ...acc, [transaction_id]: mappedStatuses }
          }, {})
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      /**
       * @deprecated
       * **WARNING: This should ONLY be used during tests! Hence adding the deprecated flag.**
       * Deletes all transactions from the DB.
       */
      deleteAllTransactions: async () => {
        testEnvSafeguard()
        try {
          const connection = await repository.connect('rw')

          await connection.getRepository(TransactionEntity).query('TRUNCATE "transactions" RESTART IDENTITY')
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      /**
       * @deprecated
       * **WARNING: This should ONLY be used during tests! Hence adding the deprecated flag.**
       * Deletes all transaction operations from the DB.
       */
      deleteAllTransactionOperations: async () => {
        testEnvSafeguard()
        try {
          const connection = await repository.connect('rw')
          await connection
            .getRepository(TransactionOperationEntity)
            .query('TRUNCATE "transaction_operations" RESTART IDENTITY')
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      /**
       * @deprecated
       * **WARNING: This should ONLY be used during tests! Hence adding the deprecated flag.**
       * Deletes all transaction statuses from the DB.
       */
      deleteAllTransactionStatuses: async () => {
        testEnvSafeguard()
        try {
          const connection = await repository.connect('rw')
          await connection
            .getRepository(TransactionStatusEntity)
            .query('TRUNCATE "transaction_statuses" RESTART IDENTITY')
        } catch (error) {
          throw RepositoryError(error)
        }
      }
    }
  }
)

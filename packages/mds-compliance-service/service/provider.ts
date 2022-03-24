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

import { providerName } from '@mds-core/mds-providers'
import type { ProcessController, ServiceProvider } from '@mds-core/mds-service-helpers'
import { ServiceException, ServiceResult } from '@mds-core/mds-service-helpers'
import { isDefined } from '@mds-core/mds-utils'
import type {
  ComplianceAggregateDomainModel,
  ComplianceService,
  ComplianceServiceRequestContext,
  ComplianceViolationPeriodDomainModel
} from '../@types'
import { ComplianceServiceLogger } from '../logger'
import { ComplianceRepository } from '../repository'
import { ComplianceViolationPeriodEntityToDomainCreate } from '../repository/mappers'
import { ComplianceSnapshotStreamKafka } from './stream'
import {
  validateComplianceSnapshotDomainModel,
  validateComplianceViolationDomainModel,
  validateGetComplianceSnapshotsByTimeIntervalOptions
} from './validators'

const serviceErrorWrapper = async <T>(method: string, exec: () => Promise<T>) => {
  try {
    return ServiceResult(await exec())
  } catch (error) {
    const exception = ServiceException(`Error Compliance:${method}`, error)
    ComplianceServiceLogger.error(`${method} error`, { exception, error })
    return exception
  }
}

export const ComplianceServiceProvider: ServiceProvider<ComplianceService, ComplianceServiceRequestContext> &
  ProcessController = {
  start: async () => {
    await Promise.all([ComplianceRepository.initialize(), ComplianceSnapshotStreamKafka.initialize()])
  },
  stop: async () => {
    await Promise.all([ComplianceRepository.shutdown(), ComplianceSnapshotStreamKafka.shutdown()])
  },
  createComplianceSnapshot: async (context, complianceSnapshot) => {
    try {
      const snapshot = await ComplianceRepository.createComplianceSnapshot(
        validateComplianceSnapshotDomainModel(complianceSnapshot),
        async snapshot => {
          // send to Kafka
          const { vehicles_found, violating_vehicles, ...kafkaSnapshot } = snapshot
          try {
            await ComplianceSnapshotStreamKafka.write(kafkaSnapshot)
          } catch (err) {
            // write to db table TODO
            await ComplianceRepository.writeComplianceSnapshotFailures([snapshot.compliance_snapshot_id])
          }
        }
      )
      return ServiceResult(snapshot)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Creating ComplianceSnapshot', error)
      ComplianceServiceLogger.error('createComplianceSnapshot error', { exception, error })
      return exception
    }
  },
  createComplianceSnapshots: async (context, complianceSnapshots) => {
    try {
      const snapshots = await ComplianceRepository.createComplianceSnapshots(
        complianceSnapshots.map(validateComplianceSnapshotDomainModel),
        async snapshots => {
          // send to Kafka
          const kafkaSnapshots = snapshots.map(snapshot => {
            const { vehicles_found, violating_vehicles, ...kafkaSnapshot } = snapshot
            return kafkaSnapshot
          })
          try {
            await ComplianceSnapshotStreamKafka.write(kafkaSnapshots)
          } catch (err) {
            // write to db table TODO
            await ComplianceRepository.writeComplianceSnapshotFailures(
              snapshots.map(snapshot => snapshot.compliance_snapshot_id)
            )
          }
        }
      )
      return ServiceResult(snapshots)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Creating ComplianceSnapshots', error)
      ComplianceServiceLogger.error('createComplianceSnapshots error', { exception, error })
      return exception
    }
  },
  createComplianceViolation: async (context, complianceViolation) =>
    serviceErrorWrapper('createComplianceViolation', () =>
      ComplianceRepository.createComplianceViolation(validateComplianceViolationDomainModel(complianceViolation))
    ),
  createComplianceViolations: async (context, complianceViolations) =>
    serviceErrorWrapper('createComplianceViolations', () =>
      ComplianceRepository.createComplianceViolations(complianceViolations.map(validateComplianceViolationDomainModel))
    ),
  getComplianceSnapshot: async (context, options) => {
    try {
      return ServiceResult(await ComplianceRepository.getComplianceSnapshot(options))
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException(
        `Error Getting ComplianceSnapshot with these options: ${JSON.stringify(options)}`,
        error
      )
      ComplianceServiceLogger.error('getComplianceSnapshot error', { exception, error })
      return exception
    }
  },
  getComplianceSnapshotsByTimeInterval: async (context, options) => {
    try {
      return ServiceResult(
        await ComplianceRepository.getComplianceSnapshotsByTimeInterval(
          validateGetComplianceSnapshotsByTimeIntervalOptions(options)
        )
      )
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Getting ComplianceSnapshots', error)
      ComplianceServiceLogger.error('getComplianceSnapshotsByTimeInterval error', { exception, error })
      return exception
    }
  },
  getComplianceSnapshotsByIDs: async (context, ids) => {
    try {
      return ServiceResult(await ComplianceRepository.getComplianceSnapshotsByIDs(ids))
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Getting ComplianceSnapshots', error)
      ComplianceServiceLogger.error('getComplianceSnapshotsByIDs error', { exception, error })
      return exception
    }
  },

  getComplianceViolation: async (context, options) =>
    serviceErrorWrapper('getComplianceViolation', () => ComplianceRepository.getComplianceViolation(options)),

  getComplianceViolationsByTimeInterval: (context, options) =>
    serviceErrorWrapper('getComplianceViolationsByTimeInterval', () =>
      ComplianceRepository.getComplianceViolationsByTimeInterval(options)
    ),

  getComplianceViolationPeriods: async (context, options) => {
    try {
      const violationPeriodEntities = await ComplianceRepository.getComplianceViolationPeriods(options)
      const complianceAggregateMap = violationPeriodEntities.reduce<{
        [k: string]: ComplianceViolationPeriodDomainModel[]
      }>((acc, violationPeriodEntity) => {
        const { provider_id, policy_id } = violationPeriodEntity
        const key = `${provider_id}:${policy_id}`

        if (!isDefined(acc[key])) {
          // eslint-disable-next-line no-param-reassign
          acc[key] = []
        }
        if (violationPeriodEntity.sum_total_violations > 0) {
          const arr = acc[key] ?? []
          arr.push(ComplianceViolationPeriodEntityToDomainCreate.map(violationPeriodEntity))
          acc[key] = arr
        }
        return acc
      }, {})

      const results: ComplianceAggregateDomainModel[] = await Promise.all(
        Object.entries(complianceAggregateMap).map(async ([key, violation_periods]) => {
          const [provider_id, policy_id] = key.split(':')
          if (!provider_id || !policy_id) {
            throw new Error('Invalid key')
          }
          const provider_name = await providerName(provider_id)
          return {
            provider_id,
            policy_id,
            provider_name,
            violation_periods
          }
        })
      )

      return ServiceResult(results)
    } catch (error) {
      const exception = ServiceException('Error Getting Compliance Violation Periods', error)
      ComplianceServiceLogger.error('getComplianceViolationPeriods error', { exception, error })
      return exception
    }
  }
}

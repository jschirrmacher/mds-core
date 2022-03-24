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

import type { UUID } from '@mds-core/mds-types'
import { now, uuid, yesterday } from '@mds-core/mds-utils'
import type { ComplianceViolationDomainModel } from '../@types'
import { ComplianceServiceClient } from '../client'
import { ComplianceRepository } from '../repository'
import { ComplianceServiceManager } from '../service/manager'
import { ComplianceViolationFactory } from '../test-fixtures'

const ComplianceServer = ComplianceServiceManager.controller()

describe('Test CRUD', () => {
  beforeAll(async () => {
    await ComplianceServer.start()
  })
  beforeEach(async () => {
    await ComplianceRepository.deleteAll()
  })
  afterAll(async () => {
    await ComplianceServer.stop()
  })
  it('Creates a ComplianceViolation', async () => {
    const violation = ComplianceViolationFactory()
    const recordedViolation = await ComplianceServiceClient.createComplianceViolation(violation)
    expect(recordedViolation).toMatchObject(violation)

    const gottenViolation = await ComplianceServiceClient.getComplianceViolation({
      violation_id: violation.violation_id
    })
    expect(gottenViolation).toStrictEqual(recordedViolation)
  })

  it('Finds a ComplianceViolation', async () => {
    const violation = ComplianceViolationFactory({
      violation_details: { event_timestamp: now(), device_id: uuid(), trip_id: uuid() }
    })
    await ComplianceServiceClient.createComplianceViolation(violation)

    const { event_timestamp, device_id, trip_id } = violation.violation_details
    const gottenViolation = await ComplianceServiceClient.getComplianceViolation({
      event_timestamp,
      device_id,
      trip_id: trip_id as UUID
    })
    expect(gottenViolation).toMatchObject(violation)
  })

  it('Finds matching ComplianceViolations', async () => {
    const yesterdayViolations = [...Array(10)].map(() => ComplianceViolationFactory({ timestamp: yesterday() }))
    const nowViolations = [...Array(10)].map(() => ComplianceViolationFactory())

    await ComplianceServiceClient.createComplianceViolations(yesterdayViolations)
    await ComplianceServiceClient.createComplianceViolations(nowViolations)

    const foundViolations = await ComplianceServiceClient.getComplianceViolationsByTimeInterval({
      start_time: yesterday() + 1
    })
    const sortByViolationId = (v1: ComplianceViolationDomainModel, v2: ComplianceViolationDomainModel) => {
      if (v1.violation_id > v2.violation_id) {
        return 1
      }
      if (v1.violation_id < v2.violation_id) {
        return -1
      }
      return 0
    }

    expect(foundViolations.sort(sortByViolationId)).toMatchObject(nowViolations.sort(sortByViolationId))

    const fiveViolations = nowViolations.slice(5)
    const policy_ids = fiveViolations.map(violation => violation.policy_id)
    const provider_ids = fiveViolations.map(violation => violation.provider_id)

    const foundViolationsByPolicy = await ComplianceServiceClient.getComplianceViolationsByTimeInterval({
      start_time: yesterday() - 1,
      policy_ids
    })

    expect(foundViolationsByPolicy.sort(sortByViolationId)).toMatchObject(fiveViolations.sort(sortByViolationId))

    const foundViolationsByProvider = await ComplianceServiceClient.getComplianceViolationsByTimeInterval({
      start_time: yesterday() - 1,
      provider_ids
    })

    expect(foundViolationsByProvider.sort(sortByViolationId)).toMatchObject(fiveViolations.sort(sortByViolationId))

    const foundViolationsByPolicyAndProvider = await ComplianceServiceClient.getComplianceViolationsByTimeInterval({
      start_time: yesterday() - 1,
      policy_ids,
      provider_ids
    })

    expect(foundViolationsByPolicyAndProvider.sort(sortByViolationId)).toMatchObject(
      fiveViolations.sort(sortByViolationId)
    )
  })
})

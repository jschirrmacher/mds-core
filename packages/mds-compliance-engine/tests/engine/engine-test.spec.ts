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

import type { ComplianceSnapshotDomainModel } from '@mds-core/mds-compliance-service/@types'
import db from '@mds-core/mds-db'
import type { GeographyDomainModel } from '@mds-core/mds-geography-service'
import type { DeviceDomainModel } from '@mds-core/mds-ingest-service'
import { IngestServiceManager } from '@mds-core/mds-ingest-service'
import type { PolicyDomainModel } from '@mds-core/mds-policy-service'
import { LA_CITY_BOUNDARY, makeDevices, makeEventsWithTelemetry, TEST1_PROVIDER_ID } from '@mds-core/mds-test-data'
import type { VehicleEvent } from '@mds-core/mds-types'
import { RuntimeError } from '@mds-core/mds-utils'
import type { FeatureCollection } from 'geojson'
import type { VehicleEventWithTelemetry } from '../../@types'
import { filterEvents, getAllInputs, getSupersedingPolicies } from '../../engine/helpers'
import { processPolicy } from '../../engine/mds-compliance-engine'
import {
  ARBITRARY_EVENT_TYPES_POLICY,
  COUNT_POLICY_JSON,
  EXPIRED_POLICY,
  LOW_COUNT_POLICY
} from '../../test_data/fixtures'
import { readJson } from './helpers'

let policies: Required<PolicyDomainModel>[] = []

const CITY_OF_LA = '1f943d59-ccc9-4d91-b6e2-0c5e771cbc49'

const geographies = [
  { name: 'la', geography_id: CITY_OF_LA, geography_json: LA_CITY_BOUNDARY as FeatureCollection }
] as GeographyDomainModel[]

process.env.TIMEZONE = 'America/Los_Angeles'

function now(): number {
  return Date.now()
}

const IngestServer = IngestServiceManager.controller()

describe('Tests General Compliance Engine Functionality', () => {
  beforeAll(async () => {
    policies = (await readJson('test_data/policies.json')) as Required<PolicyDomainModel>[]
    await IngestServer.start()
  })

  afterAll(async () => {
    await IngestServer.stop()
  })

  beforeEach(async () => {
    await db.reinitialize()
  })

  it('Verifies not considering events older than 48 hours', async () => {
    const TWO_DAYS_IN_MS = 172800000
    const curTime = now()
    const devices = makeDevices(40, curTime)
    const events = makeEventsWithTelemetry(devices, curTime - TWO_DAYS_IN_MS, CITY_OF_LA, {
      event_types: ['trip_end'],
      vehicle_state: 'available',
      speed: 0
    })

    await db.seed({ devices, events, telemetry: events.map(({ telemetry }) => telemetry) })

    // make sure this helper works
    const recentEvents = filterEvents(events) as VehicleEventWithTelemetry[]
    expect(recentEvents.length).toStrictEqual(0)
    // Mimic what we do in the real world to get inputs to feed into the compliance engine.
    const supersedingPolicies = getSupersedingPolicies(policies)
    const inputs = await getAllInputs()
    const policyResults = await Promise.all(
      supersedingPolicies.map(policy => processPolicy(policy, geographies, inputs))
    )
    policyResults.forEach(complianceSnapshots => {
      complianceSnapshots.forEach(complianceSnapshot => {
        expect(complianceSnapshot?.vehicles_found.length).toStrictEqual(0)
      })
    })
  })

  it('does not run inactive policies', async () => {
    const devices = makeDevices(6, now())
    const start_time = now() - 10000000
    const events = devices.reduce((events_acc: VehicleEvent[], device: DeviceDomainModel, current_index) => {
      const device_events = makeEventsWithTelemetry([device], start_time - current_index * 10, CITY_OF_LA, {
        event_types: ['trip_start'],
        vehicle_state: 'on_trip',
        speed: 0
      })
      events_acc.push(...device_events)
      return events_acc
    }, []) as VehicleEventWithTelemetry[]
    await db.seed({ devices, events, telemetry: events.map(({ telemetry }) => telemetry) })
    const inputs = await getAllInputs()
    const result = await processPolicy(EXPIRED_POLICY, geographies, inputs)
    expect(result).toStrictEqual([])
  })
})

describe('Verifies compliance engine processes by vehicle most recent event', () => {
  beforeAll(async () => {
    await IngestServer.start()
  })
  afterAll(async () => {
    await IngestServer.stop()
  })
  beforeEach(async () => {
    await db.reinitialize()
  })

  beforeAll(async () => {
    await IngestServer.start()
  })

  afterAll(async () => {
    await IngestServer.stop()
  })

  it('should process count violation vehicles with the most recent event last', async () => {
    const devices = makeDevices(6, now())
    const start_time = now() - 10000000
    const latest_device: DeviceDomainModel = devices[0]
    const events = devices.reduce((events_acc: VehicleEvent[], device: DeviceDomainModel, current_index) => {
      const device_events = makeEventsWithTelemetry([device], start_time - current_index * 10, CITY_OF_LA, {
        event_types: ['trip_start'],
        vehicle_state: 'on_trip',
        speed: 0
      })
      events_acc.push(...device_events)
      return events_acc
    }, []) as VehicleEventWithTelemetry[]
    await db.seed({ devices, events, telemetry: events.map(({ telemetry }) => telemetry) })
    const inputs = await getAllInputs()
    const complianceResults = await processPolicy(LOW_COUNT_POLICY, geographies, inputs)
    const { 0: result } = complianceResults.filter(
      complianceResult => complianceResult?.provider_id === TEST1_PROVIDER_ID
    ) as ComplianceSnapshotDomainModel[]
    expect(result?.total_violations).toStrictEqual(1)
    const [device] =
      result?.vehicles_found.filter(vehicle => {
        return !vehicle.rule_applied
      }) ?? []
    expect(latest_device.device_id).toStrictEqual(device?.device_id)
  })

  it('Verifies arbitrary event_types can be set for a state in a rule', async () => {
    const devices = makeDevices(6, now())
    const start_time = now() - 10000000
    const events = devices.reduce((events_acc: VehicleEvent[], device: DeviceDomainModel, current_index) => {
      const device_events = makeEventsWithTelemetry([device], start_time - current_index * 10, CITY_OF_LA, {
        event_types: ['battery_low'],
        vehicle_state: 'available',
        speed: 0
      })
      events_acc.push(...device_events)
      return events_acc
    }, []) as VehicleEventWithTelemetry[]
    await db.seed({ devices, events, telemetry: events.map(({ telemetry }) => telemetry) })
    const inputs = await getAllInputs()
    const complianceResults = await processPolicy(ARBITRARY_EVENT_TYPES_POLICY, geographies, inputs)
    const { 0: result } = complianceResults.filter(
      complianceResult => complianceResult?.provider_id === TEST1_PROVIDER_ID
    ) as ComplianceSnapshotDomainModel[]
    expect(result?.total_violations).toStrictEqual(1)
  })

  it('Verifies no match when event types do not match policy', async () => {
    const devices = makeDevices(6, now())
    const start_time = now() - 10000000
    const events = devices.reduce((events_acc: VehicleEvent[], device: DeviceDomainModel, current_index) => {
      const device_events = makeEventsWithTelemetry([device], start_time - current_index * 10, CITY_OF_LA, {
        event_types: ['reservation_cancel'],
        vehicle_state: 'available',
        speed: 0
      })
      events_acc.push(...device_events)
      return events_acc
    }, []) as VehicleEventWithTelemetry[]
    await db.seed({ devices, events, telemetry: events.map(({ telemetry }) => telemetry) })
    const inputs = await getAllInputs()
    const complianceResults = await processPolicy(ARBITRARY_EVENT_TYPES_POLICY, geographies, inputs)
    const { 0: result } = complianceResults.filter(
      complianceResult => complianceResult?.provider_id === TEST1_PROVIDER_ID
    )
    expect(result?.total_violations).toStrictEqual(0)
  })

  it('Verifies state wildcard matching works', async () => {
    const devices = makeDevices(11, now())
    const start_time = now() - 10000000
    const events = devices.reduce((events_acc: VehicleEvent[], device: DeviceDomainModel, current_index) => {
      const device_events = makeEventsWithTelemetry([device], start_time - current_index * 10, CITY_OF_LA, {
        event_types: ['battery_low'],
        vehicle_state: 'available',
        speed: 0
      })
      events_acc.push(...device_events)
      return events_acc
    }, []) as VehicleEventWithTelemetry[]
    await db.seed({ devices, events, telemetry: events.map(({ telemetry }) => telemetry) })
    const inputs = await getAllInputs()
    const complianceResults = await processPolicy(COUNT_POLICY_JSON, geographies, inputs)
    const { 0: result } = complianceResults.filter(
      complianceResult => complianceResult?.provider_id === TEST1_PROVIDER_ID
    ) as ComplianceSnapshotDomainModel[]
    expect(result?.total_violations).toStrictEqual(1)
  })
})

describe('Verifies errors are being properly thrown', () => {
  beforeAll(async () => {
    await IngestServer.start()
  })
  afterAll(async () => {
    await IngestServer.stop()
  })

  it('Verifies RuntimeErrors are being thrown with an invalid TIMEZONE env_var', async () => {
    const oldTimezone = process.env.TIMEZONE
    process.env.TIMEZONE = 'Pluto/Potato_Land'
    const devices = makeDevices(1, now())
    const events = makeEventsWithTelemetry(devices, now(), CITY_OF_LA, {
      event_types: ['trip_end'],
      vehicle_state: 'available',
      speed: 0
    })

    await db.seed({ devices, events, telemetry: events.map(({ telemetry }) => telemetry) })

    await expect(async () => {
      const inputs = await getAllInputs()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await processPolicy(policies[0]!, geographies, inputs)
    }).rejects.toThrowError(RuntimeError)

    process.env.TIMEZONE = oldTimezone
  })
})

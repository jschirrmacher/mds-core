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

import assert from 'assert'
/* eslint-reason extends object.prototype */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import should from 'should'
import test from 'unit.js'

import { FeatureCollection } from 'geojson'
import {
  Telemetry,
  Recorded,
  VehicleEvent,
  Device,
  VEHICLE_EVENTS,
  Geography,
  VEHICLE_TYPES,
  VEHICLE_TYPE,
  PROPULSION_TYPE,
  PROPULSION_TYPES,
  UUID,
  VEHICLE_STATUS,
  VEHICLE_STATUSES,
  VEHICLE_EVENT
} from '@mds-core/mds-types'
import {
  JUMP_TEST_DEVICE_1,
  makeDevices,
  makeEventsWithTelemetry,
  makeEvents,
  JUMP_PROVIDER_ID,
  POLICY_JSON,
  POLICY2_JSON,
  POLICY3_JSON,
  GEOGRAPHY_UUID,
  GEOGRAPHY2_UUID,
  LA_CITY_BOUNDARY,
  DISTRICT_SEVEN,
  START_ONE_MONTH_AGO,
  POLICY_WITH_DUPE_RULE,
  PUBLISHED_POLICY,
  PUBLISH_DATE_VALIDATION_JSON,
  START_ONE_MONTH_FROM_NOW,
  DELETEABLE_POLICY
} from '@mds-core/mds-test-data'
import { now, clone, NotFoundError, rangeRandomInt, uuid, ConflictError, yesterday, days } from '@mds-core/mds-utils'
import { isNullOrUndefined } from 'util'
import { AttachmentRepository } from '@mds-core/mds-attachment-service'
import { AuditRepository } from '@mds-core/mds-audit-service'
import { GeographyRepository } from '@mds-core/mds-geography-service'
import { IngestRepository } from '@mds-core/mds-ingest-service'
import { PolicyRepository } from '@mds-core/mds-policy-service'
import MDSDBPostgres from '../index'
import { dropTables, createTables } from '../migration'
import { Trip } from '../types'
import { PGInfo } from '../sql-utils'
import { LIME_PROVIDER_ID } from '@mds-core/mds-providers'
import { GROUPING_TYPE } from '../events'

const { env } = process
const ACTIVE_POLICY_JSON = { ...POLICY_JSON, publish_date: yesterday(), start_date: yesterday() }

const pg_info: PGInfo = {
  database: env.PG_NAME,
  host: env.PG_HOST || 'localhost',
  user: env.PG_USER,
  password: env.PG_PASS,
  port: Number(env.PG_PORT) || 5432
}

const startTime = now() - 200
const shapeUUID = 'e3ed0a0e-61d3-4887-8b6a-4af4f3769c14'
const LAGeography: Geography = {
  name: 'Los Angeles',
  geography_id: GEOGRAPHY_UUID,
  geography_json: LA_CITY_BOUNDARY
}
const DistrictSeven: Geography = {
  name: 'District Seven',
  geography_id: GEOGRAPHY2_UUID,
  geography_json: DISTRICT_SEVEN
}

function makeTrip(device: Device): Trip {
  return {
    provider_id: device.provider_id,
    provider_name: device.provider_id,
    device_id: device.device_id,
    vehicle_id: device.vehicle_id,
    vehicle_type: device.type,
    propulsion_type: device.propulsion,
    provider_trip_id: uuid(),
    trip_duration: rangeRandomInt(5),
    trip_distance: rangeRandomInt(5),
    route: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            timestamp: now()
          },
          geometry: {
            type: 'Point',
            coordinates: [Math.random() * 10, Math.random() * 10]
          }
        }
      ]
    },
    accuracy: Math.random() * 3,
    trip_start: now() - 1000 * Math.random(),
    trip_end: now(),
    parking_verification_url: 'http://iamverified.com',
    standard_cost: rangeRandomInt(5),
    actual_cost: rangeRandomInt(5),
    recorded: now()
  }
}

/* You'll need postgres running and the env variable PG_NAME
 * to be set to run these tests.
 */
/* istanbul ignore next */

async function seedDB() {
  await MDSDBPostgres.reinitialize()
  const devices: Device[] = makeDevices(9, startTime, JUMP_PROVIDER_ID) as Device[]
  devices.push(JUMP_TEST_DEVICE_1 as Device)
  const deregisterEvents: VehicleEvent[] = makeEventsWithTelemetry(
    devices.slice(0, 9),
    startTime + 10,
    shapeUUID,
    VEHICLE_EVENTS.deregister,
    rangeRandomInt(10)
  )
  const tripEndEvent: VehicleEvent[] = makeEventsWithTelemetry(
    devices.slice(9, 10),
    startTime + 10,
    shapeUUID,
    'trip_end'
  )
  const telemetry: Telemetry[] = []
  const events: VehicleEvent[] = deregisterEvents.concat(tripEndEvent)
  events.map(event => {
    if (event.telemetry) {
      telemetry.push(event.telemetry)
    }
  })

  await MDSDBPostgres.seed({ devices, events, telemetry })
}

/**
 * @param reinit wipe the data first
 */
async function seedTripEvents(reinit = true) {
  reinit ? await MDSDBPostgres.reinitialize() : null

  const devices: Device[] = makeDevices(9, startTime, JUMP_PROVIDER_ID) as Device[]
  const trip_id = uuid()
  const tripStartEvents: VehicleEvent[] = makeEventsWithTelemetry(
    devices.slice(0, 9),
    startTime + 10,
    shapeUUID,
    VEHICLE_EVENTS.trip_start,
    rangeRandomInt(10),
    trip_id
  )
  const tripEndEvents: VehicleEvent[] = makeEventsWithTelemetry(
    devices.slice(9, 10),
    startTime + 10,
    shapeUUID,
    VEHICLE_EVENTS.trip_end,
    rangeRandomInt(10),
    trip_id
  )
  const telemetry: Telemetry[] = []
  const events: VehicleEvent[] = tripStartEvents.concat(tripEndEvents)
  events.map(event => {
    if (event.telemetry) {
      telemetry.push(event.telemetry)
    }
  })

  await MDSDBPostgres.seed({ devices, events, telemetry })
}

/**
 * @param reinit wipe the data first
 */
async function seedTripEventsForDevices(reinit = true, device_count = 10) {
  reinit ? await MDSDBPostgres.reinitialize() : null

  const devices: Device[] = makeDevices(device_count, startTime, JUMP_PROVIDER_ID) as Device[]
  const trip_id = uuid()
  const tripStartEvents: VehicleEvent[] = makeEventsWithTelemetry(
    devices,
    startTime + 10,
    shapeUUID,
    VEHICLE_EVENTS.trip_start,
    rangeRandomInt(10),
    trip_id
  )
  const tripEndEvents: VehicleEvent[] = makeEventsWithTelemetry(
    devices,
    startTime + 15,
    shapeUUID,
    VEHICLE_EVENTS.trip_end,
    rangeRandomInt(10),
    trip_id
  )
  const telemetry: Telemetry[] = []
  const events: VehicleEvent[] = tripStartEvents.concat(tripEndEvents)
  events.map(event => {
    if (event.telemetry) {
      telemetry.push(event.telemetry)
    }
  })

  await MDSDBPostgres.seed({ devices, events, telemetry })
}

async function initializeDB() {
  await Promise.all(
    [AttachmentRepository, AuditRepository, GeographyRepository, IngestRepository, PolicyRepository].map(repository =>
      repository.initialize()
    )
  )
  await dropTables()
  await createTables()
}

async function shutdownDB() {
  await MDSDBPostgres.shutdown()
  await Promise.all(
    [AttachmentRepository, AuditRepository, GeographyRepository, IngestRepository, PolicyRepository].map(repository =>
      repository.shutdown()
    )
  )
}

if (pg_info.database) {
  describe('Test mds-db-postgres', () => {
    describe('test reads and writes', () => {
      beforeEach(async () => {
        await initializeDB()
      })

      afterEach(async () => {
        await shutdownDB()
      })

      // This is incredibly stupid and makes 0 sense, but if we don't import (and use) unit.js, should.js breaks...
      it('Nonsensical test', () => {
        // eslint-disable-next-line no-self-compare
        test.assert(true === true)
      })

      it('can make successful writes', async () => {
        await MDSDBPostgres.reinitialize()
        await MDSDBPostgres.writeDevice(JUMP_TEST_DEVICE_1)
        const device: Device = await MDSDBPostgres.readDevice(JUMP_TEST_DEVICE_1.device_id, JUMP_PROVIDER_ID)
        assert.deepEqual(device.device_id, JUMP_TEST_DEVICE_1.device_id)
      })

      it('can make a successful read query after shutting down a DB client', async () => {
        await shutdownDB()
        await MDSDBPostgres.writeDevice(JUMP_TEST_DEVICE_1)
        await shutdownDB()
        const device: Device = await MDSDBPostgres.readDevice(JUMP_TEST_DEVICE_1.device_id, JUMP_PROVIDER_ID)
        assert.deepEqual(device.device_id, JUMP_TEST_DEVICE_1.device_id)
      })

      it('can read and write Devices, VehicleEvents, and Telemetry', async () => {
        await seedDB()

        const devicesResult: Device[] = (await MDSDBPostgres.readDeviceIds(JUMP_PROVIDER_ID, 0, 20)) as Device[]
        assert.deepEqual(devicesResult.length, 10)
        const vehicleEventsResult = await MDSDBPostgres.readEvents({
          start_time: String(startTime)
        })
        assert.deepEqual(vehicleEventsResult.count, 10)

        const telemetryResults: Recorded<Telemetry>[] = await MDSDBPostgres.readTelemetry(
          devicesResult[0].device_id,
          startTime,
          now()
        )

        assert(telemetryResults.length > 0)
      })

      it('can read VehicleEvents and Telemetry as collections of trips', async () => {
        await seedTripEvents()
        await seedTripEvents(false)

        const devicesResult: Device[] = (await MDSDBPostgres.readDeviceIds(JUMP_PROVIDER_ID, 0, 18)) as Device[]
        assert.deepEqual(devicesResult.length, 18)

        const vehicleEventsResult = await MDSDBPostgres.readEvents({
          start_time: String(startTime)
        })
        const trip_ids = vehicleEventsResult.events.reduce((acc, event) => acc.add(event.trip_id), new Set())

        const tripEventsResult = await MDSDBPostgres.readTripEvents({
          start_time: String(startTime)
        })
        assert.deepStrictEqual(tripEventsResult.tripCount, trip_ids.size)

        // there should be X trips
        assert.deepStrictEqual(Object.keys(tripEventsResult.trips).length, trip_ids.size)

        // telemetry on each event should not be undefined
        Object.values(tripEventsResult.trips).forEach(trip => {
          trip.forEach(event => {
            assert.notStrictEqual(event.telemetry, undefined)
          })
        })
      })

      it('can wipe a device', async () => {
        await seedDB()
        const result = await MDSDBPostgres.wipeDevice(JUMP_PROVIDER_ID)
        assert(result !== undefined)
      })
    })

    describe('unit test read only functions', () => {
      beforeEach(async () => {
        await initializeDB()
        await seedDB()
      })

      afterEach(async () => {
        await shutdownDB()
      })

      it('can get vehicle counts by provider', async () => {
        const result = await MDSDBPostgres.getVehicleCountsPerProvider()
        assert.deepEqual(result[0].count, 10)
      })

      it('.getEventCountsPerProviderSince', async () => {
        const result = await MDSDBPostgres.getEventCountsPerProviderSince()
        assert.deepEqual(result[0].provider_id, JUMP_PROVIDER_ID)
        assert.deepEqual(result[0].event_type, VEHICLE_EVENTS.deregister)
        assert.deepEqual(result[0].count, 9)
        assert.deepEqual(result[1].provider_id, JUMP_PROVIDER_ID)
        assert.deepEqual(result[1].event_type, VEHICLE_EVENTS.trip_end)
        assert.deepEqual(result[1].count, 1)
      })

      it('.getEventsLast24HoursPerProvider', async () => {
        const result = await MDSDBPostgres.getEventsLast24HoursPerProvider()
        assert.deepEqual(result.length, 10)
        const firstResult = result[0]
        assert(firstResult.provider_id)
        assert(firstResult.device_id)
        assert(firstResult.event_type)
        assert(firstResult.recorded)
        assert(firstResult.timestamp)
      })

      it('.getTelemetryCountsPerProviderSince', async () => {
        const result = await MDSDBPostgres.getTelemetryCountsPerProviderSince()
        assert.deepEqual(result.length, 1)
      })

      it('.getTripCountsPerProviderSince', async () => {
        const result = await MDSDBPostgres.getTripCountsPerProviderSince()
        assert.deepEqual(result[0].count, 1)
      })

      it('.getVehicleCountsPerProvider', async () => {
        const result = await MDSDBPostgres.getVehicleCountsPerProvider()
        assert.deepEqual(result[0].count, 10)
      })

      it('.getNumVehiclesRegisteredLast24HoursByProvider', async () => {
        const result = await MDSDBPostgres.getNumVehiclesRegisteredLast24HoursByProvider()
        assert.deepEqual(result[0].count, 10)
      })

      it('.getNumEventsLast24HoursByProvider', async () => {
        const result = await MDSDBPostgres.getNumEventsLast24HoursByProvider()
        assert.deepEqual(result[0].count, 10)
      })

      it('.getTripEventsLast24HoursByProvider', async () => {
        const trip1: Trip = makeTrip(JUMP_TEST_DEVICE_1)
        const trip2: Trip = makeTrip(JUMP_TEST_DEVICE_1)
        const event1: VehicleEvent = makeEvents([JUMP_TEST_DEVICE_1], now() - 5)[0]
        const event2: VehicleEvent = makeEvents([JUMP_TEST_DEVICE_1], now())[0]
        event1.trip_id = trip1.provider_trip_id
        event2.trip_id = trip2.provider_trip_id
        await MDSDBPostgres.writeEvent(event1)
        await MDSDBPostgres.writeEvent(event2)
        const result = await MDSDBPostgres.getTripEventsLast24HoursByProvider()
        assert.deepEqual(result.length, 2)
      })

      it('.getMostRecentEventByProvider', async () => {
        const result = await MDSDBPostgres.getMostRecentEventByProvider()
        assert.deepEqual(result.length, 1)
      })

      it('.health', async () => {
        const result = await MDSDBPostgres.health()
        assert(result.using === 'postgres')
        assert(!isNullOrUndefined(result.stats.current_running_queries))
      })

      const testCases: { grouping_type: GROUPING_TYPE; expected: number; expected_event_type: VEHICLE_EVENT }[] = [
        { grouping_type: 'latest_per_vehicle', expected: 2, expected_event_type: VEHICLE_EVENTS.trip_end },
        { grouping_type: 'latest_per_trip', expected: 2, expected_event_type: VEHICLE_EVENTS.trip_end },
        { grouping_type: 'all_events', expected: 4, expected_event_type: VEHICLE_EVENTS.trip_start }
      ]

      testCases.forEach(({ grouping_type, expected, expected_event_type }) => {
        describe(`getLatestEventPerVehicle: ${grouping_type}`, async () => {
          beforeEach(async () => await seedTripEventsForDevices(true, 2))
          it('reads events, with telemetry attached', async () => {
            const start = startTime
            const end = startTime + 200
            const result = await MDSDBPostgres.getLatestEventPerVehicle({ grouping_type, time_range: { start, end } })
            assert.deepStrictEqual(result.length, expected)
            assert.deepStrictEqual(result[0].event_type, expected_event_type)
            assert.notStrictEqual(result[0].telemetry, null)
            assert.deepStrictEqual(result[1].event_type, expected_event_type)
            assert.notStrictEqual(result[1].telemetry, null)
          })
          it('reads events, filters on vehicle types', async () => {
            const start = startTime
            const end = startTime + 200
            let vehicle_types: VEHICLE_TYPE[] = [VEHICLE_TYPES.bicycle, VEHICLE_TYPES.scooter]
            const resultSome = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              vehicle_types,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultSome.length, expected)
            vehicle_types = [VEHICLE_TYPES.car, VEHICLE_TYPES.moped]
            const resultNone = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              vehicle_types,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultNone.length, 0)
          })
          it('reads events, filters on propulsion types', async () => {
            const start = startTime
            const end = startTime + 200
            let propulsion_types: PROPULSION_TYPE[] = [PROPULSION_TYPES.electric, PROPULSION_TYPES.human]
            const resultSome = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              propulsion_types,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultSome.length, expected)
            propulsion_types = [PROPULSION_TYPES.hybrid, PROPULSION_TYPES.combustion]
            const resultNone = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              propulsion_types,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultNone.length, 0)
          })
          it('reads events, filters on provider_ids', async () => {
            const start = startTime
            const end = startTime + 200
            let provider_ids: UUID[] = [JUMP_PROVIDER_ID]
            const resultSome = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              provider_ids,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultSome.length, expected)
            provider_ids = [LIME_PROVIDER_ID]
            const resultNone = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              provider_ids,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultNone.length, 0)
          })
          it('reads events, filters on vehicle_statuses', async () => {
            const start = startTime
            const end = startTime + 200
            const vehicle_statuses: VEHICLE_STATUS[] = [VEHICLE_STATUSES.unavailable] //trip_end
            const resultSome = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              vehicle_statuses,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultSome.length, 0)
          })
          it('reads events, filters on device_or_vehicle_id', async () => {
            const start = startTime
            const end = startTime + 200
            const device_ids = await MDSDBPostgres.readDeviceIds(JUMP_PROVIDER_ID)
            let device_or_vehicle_id: string = device_ids[0].device_id
            const resultSome = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              device_or_vehicle_id,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultSome.length, expected / 2)
            const device = await MDSDBPostgres.readDevice(device_ids[0].device_id)
            device_or_vehicle_id = device.vehicle_id
            const resultNone = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              device_or_vehicle_id,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultNone.length, expected / 2)
          })
          it('reads events, filters on device_ids', async () => {
            const start = startTime
            const end = startTime + 200
            const device_ids = await MDSDBPostgres.readDeviceIds(JUMP_PROVIDER_ID)
            const resultSome = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              device_ids: device_ids.map(d => d.device_id),
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultSome.length, expected)
            const resultNone = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              device_ids: [uuid()],
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultNone.length, 0)
          })
          it('reads events, filters on event_types', async () => {
            const start = startTime
            const end = startTime + 200
            const event_types: VEHICLE_EVENT[] = [VEHICLE_EVENTS.trip_end]
            const resultSome = await MDSDBPostgres.getLatestEventPerVehicle({
              grouping_type,
              event_types,
              time_range: { start, end }
            })
            assert.deepStrictEqual(resultSome.length, 2)
          })
        })
      })
    })

    describe('unit test policy functions', () => {
      before(async () => {
        await initializeDB()
      })

      after(async () => {
        await shutdownDB()
      })

      it('can delete an unpublished Policy', async () => {
        const { policy_id } = DELETEABLE_POLICY
        await MDSDBPostgres.writePolicy(DELETEABLE_POLICY)
        assert(!(await MDSDBPostgres.isPolicyPublished(policy_id)))
        await MDSDBPostgres.deletePolicy(policy_id)
        const policy_result = await MDSDBPostgres.readPolicies({
          policy_id,
          get_published: null,
          get_unpublished: null
        })
        assert.deepEqual(policy_result, [])
      })

      it('can write, read, and publish a Policy', async () => {
        await MDSDBPostgres.writeGeography(LAGeography)
        await MDSDBPostgres.publishGeography({ geography_id: LAGeography.geography_id })
        // This one already has a publish_date. Not quite kosher, but publishing it the normal way through using
        // .publishPolicy would require setting a future start_date, which means it wouldn't qualify as an active
        // policy during future tests.
        await MDSDBPostgres.writePolicy(ACTIVE_POLICY_JSON)
        await MDSDBPostgres.writePolicy(POLICY2_JSON)
        await MDSDBPostgres.writePolicy(POLICY3_JSON)

        // Read all policies, no matter whether published or not.
        const policies = await MDSDBPostgres.readPolicies()
        assert.deepEqual(policies.length, 3)
        const unpublishedPolicies = await MDSDBPostgres.readPolicies({ get_unpublished: true, get_published: null })
        assert.deepEqual(unpublishedPolicies.length, 2)
        const publishedPolicies = await MDSDBPostgres.readPolicies({ get_published: true, get_unpublished: null })
        assert.deepEqual(publishedPolicies.length, 1)
      })

      it('throws a ConflictError when writing a policy that already exists', async () => {
        await MDSDBPostgres.writePolicy(ACTIVE_POLICY_JSON).should.be.rejectedWith(ConflictError)
      })

      it('can retrieve Policies that were active at a particular date', async () => {
        await MDSDBPostgres.writePolicy(PUBLISHED_POLICY)
        const monthAgoPolicies = await MDSDBPostgres.readActivePolicies(START_ONE_MONTH_AGO)
        assert.deepEqual(monthAgoPolicies.length, 1)

        const currentlyActivePolicies = await MDSDBPostgres.readActivePolicies()
        assert.deepEqual(currentlyActivePolicies.length, 2)
      })

      it('can read a single Policy', async () => {
        const policy = await MDSDBPostgres.readPolicy(ACTIVE_POLICY_JSON.policy_id)
        assert.deepEqual(policy.policy_id, ACTIVE_POLICY_JSON.policy_id)
        assert.deepEqual(policy.name, ACTIVE_POLICY_JSON.name)
      })

      it('can find Policies by rule id', async () => {
        const rule_id = '7ea0d16e-ad15-4337-9722-9924e3af9146'
        const policies = await MDSDBPostgres.readPolicies({ rule_id })
        assert(policies[0].rules.map(rule => rule.rule_id).includes(rule_id))
      })

      it('ensures rules are unique when writing new policy', async () => {
        await MDSDBPostgres.writePolicy(POLICY_WITH_DUPE_RULE).should.be.rejectedWith(ConflictError)
      })

      it('cannot find a nonexistent Policy', async () => {
        await MDSDBPostgres.readPolicy('incrediblefailure').should.be.rejected()
      })

      it('can tell a Policy is published', async () => {
        const publishedResult = await MDSDBPostgres.isPolicyPublished(ACTIVE_POLICY_JSON.policy_id)
        assert.deepEqual(publishedResult, true)
        const unpublishedResult = await MDSDBPostgres.isPolicyPublished(POLICY3_JSON.policy_id)
        assert.deepEqual(unpublishedResult, false)
      })

      it('can edit a Policy', async () => {
        const policy = clone(POLICY3_JSON)
        policy.name = 'a shiny new name'
        await MDSDBPostgres.editPolicy(policy)
        const result = await MDSDBPostgres.readPolicies({
          policy_id: POLICY3_JSON.policy_id,
          get_unpublished: true,
          get_published: null
        })
        assert.deepEqual(result[0].name, 'a shiny new name')
      })

      it('cannot add a rule that already exists in some other policy', async () => {
        const policy = clone(POLICY3_JSON)
        policy.rules[0].rule_id = ACTIVE_POLICY_JSON.rules[0].rule_id
        await MDSDBPostgres.editPolicy(policy).should.be.rejectedWith(ConflictError)
      })

      it('ensures the publish_date >= start_date', async () => {
        await MDSDBPostgres.writePolicy(PUBLISH_DATE_VALIDATION_JSON)
        await MDSDBPostgres.publishPolicy(PUBLISH_DATE_VALIDATION_JSON.policy_id).should.be.rejectedWith(ConflictError)
        const validPolicy = clone(PUBLISH_DATE_VALIDATION_JSON)
        validPolicy.start_date = START_ONE_MONTH_FROM_NOW
        await MDSDBPostgres.editPolicy(validPolicy)
        await MDSDBPostgres.publishPolicy(validPolicy.policy_id).should.not.rejected()
      })

      it('will not edit or delete a published Policy', async () => {
        const publishedPolicy = clone(ACTIVE_POLICY_JSON)
        publishedPolicy.name = 'a shiny new name'
        await MDSDBPostgres.editPolicy(publishedPolicy).should.be.rejected()
        await MDSDBPostgres.deletePolicy(publishedPolicy.policy_id).should.be.rejected()
      })

      it('will throw an error if attempting to edit a nonexistent Policy', async () => {
        const policy = clone(POLICY2_JSON)
        policy.policy_id = '28218022-d333-41be-bda5-1dc4288516d2'
        await MDSDBPostgres.editPolicy(policy).should.be.rejectedWith(NotFoundError)
      })
    })

    describe('unit test PolicyMetadata functions', () => {
      before(async () => {
        await initializeDB()
      })

      after(async () => {
        await shutdownDB()
      })

      it('.readBulkPolicyMetadata', async () => {
        await MDSDBPostgres.writePolicy(ACTIVE_POLICY_JSON)
        await MDSDBPostgres.writePolicy(POLICY2_JSON)
        await MDSDBPostgres.writePolicy(POLICY3_JSON)

        await MDSDBPostgres.writePolicyMetadata({
          policy_id: ACTIVE_POLICY_JSON.policy_id,
          policy_metadata: { name: 'policy_json' }
        })
        await MDSDBPostgres.writePolicyMetadata({
          policy_id: POLICY2_JSON.policy_id,
          policy_metadata: { name: 'policy2_json' }
        })
        await MDSDBPostgres.writePolicyMetadata({
          policy_id: POLICY3_JSON.policy_id,
          policy_metadata: { name: 'policy3_json' }
        })

        const noParamsResult = await MDSDBPostgres.readBulkPolicyMetadata()
        assert.deepEqual(noParamsResult.length, 3)
        const withStartDateResult = await MDSDBPostgres.readBulkPolicyMetadata({
          start_date: now(),
          get_published: null,
          get_unpublished: null
        })
        assert.deepEqual(withStartDateResult.length, 1)
        assert.deepEqual(withStartDateResult[0].policy_metadata.name, 'policy3_json')
      })
    })

    describe('unit test geography functions', () => {
      before(async () => {
        await initializeDB()
      })

      after(async () => {
        await shutdownDB()
      })

      it('can delete an unpublished Geography', async () => {
        await MDSDBPostgres.writeGeography(LAGeography)
        assert(!(await MDSDBPostgres.isGeographyPublished(LAGeography.geography_id)))
        await MDSDBPostgres.deleteGeography(LAGeography.geography_id)
        await MDSDBPostgres.readSingleGeography(LAGeography.geography_id).should.be.rejected()

        await MDSDBPostgres.writeGeography(LAGeography)
        await MDSDBPostgres.deleteGeography(LAGeography.geography_id)
        await MDSDBPostgres.readSingleGeography(LAGeography.geography_id).should.be.rejected()
      })

      it('can write, read, and publish a Geography', async () => {
        await MDSDBPostgres.writeGeography(LAGeography)
        const result = await MDSDBPostgres.readSingleGeography(LAGeography.geography_id)
        assert.deepEqual(result.geography_json, LAGeography.geography_json)
        assert.deepEqual(result.geography_id, LAGeography.geography_id)

        const noGeos = await MDSDBPostgres.readGeographies({ get_published: true })
        assert.deepEqual(noGeos.length, 0)

        await MDSDBPostgres.publishGeography({
          geography_id: LAGeography.geography_id,
          publish_date: now()
        })
        const writeableGeographies = await MDSDBPostgres.readGeographies({ get_published: false })
        assert.deepEqual(writeableGeographies.length, 1)
      })

      it('can read published geographies, filter by date published', async () => {
        const allPublishedGeographies = await MDSDBPostgres.readPublishedGeographies()
        assert.deepEqual(allPublishedGeographies.length, 1)

        const publishTimePastGeographies = await MDSDBPostgres.readPublishedGeographies(START_ONE_MONTH_AGO)
        assert.deepEqual(publishTimePastGeographies.length, 1)

        const ONE_MONTH_FROM_NOW = now() + days(30)
        const publishTimeFutureGeographies = await MDSDBPostgres.readPublishedGeographies(ONE_MONTH_FROM_NOW)

        assert.deepEqual(publishTimeFutureGeographies.length, 0)
      })

      it('does not write a geography if one with the same id already exists', async () => {
        await MDSDBPostgres.writeGeography(LAGeography).should.be.rejectedWith(ConflictError)
      })

      it('can tell a Geography is published', async () => {
        await MDSDBPostgres.writeGeography(DistrictSeven)
        const publishedResult = await MDSDBPostgres.isGeographyPublished(LAGeography.geography_id)
        assert.deepEqual(publishedResult, true)
        const unpublishedResult = await MDSDBPostgres.isGeographyPublished(DistrictSeven.geography_id)
        assert.deepEqual(unpublishedResult, false)
      })

      it('.readGeographies understands all its parameters', async () => {
        const publishedResult = await MDSDBPostgres.readGeographies({ get_published: true })
        assert.deepEqual(publishedResult.length, 1)
        assert.deepEqual(!!publishedResult[0].publish_date, true)
        const unpublishedResult = await MDSDBPostgres.readGeographies({ get_unpublished: true })
        assert.deepEqual(unpublishedResult.length, 1)
        assert.deepEqual(!!unpublishedResult[0].publish_date, false)
        const withIDsResult = await MDSDBPostgres.readGeographies({ geography_ids: [LAGeography.geography_id] })
        assert.deepEqual(withIDsResult.length, 1)
        assert.deepEqual(withIDsResult[0].geography_id, LAGeography.geography_id)
      })

      it('can edit a Geography', async () => {
        const geography_json = clone(DistrictSeven.geography_json)
        const numFeatures = geography_json.features.length
        geography_json.features = []
        await MDSDBPostgres.editGeography({
          name: 'District Seven Updated Name',
          geography_id: DistrictSeven.geography_id,
          geography_json
        })
        const result = await MDSDBPostgres.readSingleGeography(GEOGRAPHY2_UUID)
        assert.notEqual(result.geography_json.features.length, numFeatures)
        assert.equal(result.name, 'District Seven Updated Name')
        assert.equal(result.geography_json.features.length, 0)
      })

      it('will not edit or delete a published Geography', async () => {
        const publishedGeographyJSON = clone(LAGeography.geography_json) as FeatureCollection
        publishedGeographyJSON.features = []
        await MDSDBPostgres.editGeography({
          name: 'Los Angeles',
          geography_id: LAGeography.geography_id,
          geography_json: publishedGeographyJSON
        }).should.be.rejected()
        await MDSDBPostgres.deleteGeography(LAGeography.geography_id).should.be.rejected()
      })

      it('understands the summary parameter', async () => {
        const geographiesWithoutGeoJSON = await MDSDBPostgres.readGeographies()
        geographiesWithoutGeoJSON.forEach(geography => assert(geography.geography_json))
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const geographiesWithGeoJSON = (await MDSDBPostgres.readGeographySummaries()) as any[]
        geographiesWithGeoJSON.forEach(geography => assert.deepEqual(!!geography.geography_json, false))
      })
    })

    describe('test Geography Policy interaction', () => {
      before(async () => {
        await initializeDB()
      })

      after(async () => {
        await shutdownDB()
      })

      it('will throw an error if an attempt is made to publish a Policy but the Geography is unpublished', async () => {
        await MDSDBPostgres.writeGeography(LAGeography)
        await MDSDBPostgres.writeGeography(DistrictSeven)
        assert(!(await MDSDBPostgres.isGeographyPublished(DistrictSeven.geography_id)))
        assert(!(await MDSDBPostgres.isGeographyPublished(LAGeography.geography_id)))
        await MDSDBPostgres.writePolicy(POLICY3_JSON)

        await assert.rejects(
          async () => {
            await MDSDBPostgres.publishPolicy(POLICY3_JSON.policy_id)
          },
          { name: 'DependencyMissingError' }
        )
      })

      it('can find policies using geographies by geography ID', async () => {
        const policies = await MDSDBPostgres.findPoliciesByGeographyID(LAGeography.geography_id)
        assert.deepEqual(policies[0].policy_id, POLICY3_JSON.policy_id)
      })

      it('throws if both get_published and get_unpublished are true for bulk geo reads', async () => {
        await assert.rejects(
          async () => {
            await MDSDBPostgres.readGeographies({ get_published: true, get_unpublished: true })
          },
          { name: 'BadParamsError' }
        )
      })
    })

    describe('Geography metadata', () => {
      before(async () => {
        await initializeDB()
      })

      after(async () => {
        await shutdownDB()
      })

      it('should write a GeographyMetadata only if there is a Geography in the DB', async () => {
        const geographyMetadata = {
          geography_id: GEOGRAPHY_UUID,
          geography_metadata: { foo: 'afoo' }
        }
        await assert.rejects(
          async () => {
            await MDSDBPostgres.writeGeographyMetadata(geographyMetadata)
          },
          { name: 'DependencyMissingError' }
        )
        await MDSDBPostgres.writeGeography(LAGeography)
        await MDSDBPostgres.writeGeographyMetadata(geographyMetadata)
        const geographyMetadataResult = await MDSDBPostgres.readSingleGeographyMetadata(GEOGRAPHY_UUID)
        assert.deepEqual(geographyMetadataResult, geographyMetadata)
      })

      it('can do bulk GeographyMetadata reads', async () => {
        const all = await MDSDBPostgres.readBulkGeographyMetadata()
        assert.deepEqual(all.length, 1)
        const readOnlyResult = await MDSDBPostgres.readBulkGeographyMetadata({
          get_published: true,
          get_unpublished: false
        })
        assert.deepEqual(readOnlyResult.length, 0)
        const notReadOnlyResult = await MDSDBPostgres.readBulkGeographyMetadata({
          get_published: null,
          get_unpublished: null
        })
        assert.deepEqual(notReadOnlyResult.length, 1)
      })

      it('updates GeographyMetadata', async () => {
        const geographyMetadata = {
          geography_id: GEOGRAPHY_UUID,
          geography_metadata: { foo: 'notafoo' }
        }
        const res = await MDSDBPostgres.updateGeographyMetadata(geographyMetadata)
        assert.deepEqual(res.geography_metadata.foo, 'notafoo')
      })

      it('deletes GeographyMetadata', async () => {
        await MDSDBPostgres.deleteGeographyMetadata(GEOGRAPHY_UUID)
        await assert.rejects(
          async () => {
            await MDSDBPostgres.readSingleGeographyMetadata(GEOGRAPHY_UUID)
          },
          { name: 'NotFoundError' }
        )
      })
    })
  })
}

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

// eslint directives:
/* eslint-disable no-plusplus */
/* eslint-disable no-useless-concat */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable promise/always-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import cache from '@mds-core/mds-agency-cache'
import { ApiServer } from '@mds-core/mds-api-server'
import db from '@mds-core/mds-db'
import type { DeviceDomainModel } from '@mds-core/mds-ingest-service'
import { IngestServiceManager, IngestStream } from '@mds-core/mds-ingest-service'
import {
  JUMP_TEST_DEVICE_1,
  makeDevices,
  makeEventsWithTelemetry,
  makeTelemetry,
  TEST1_PROVIDER_ID,
  TEST2_PROVIDER_ID
} from '@mds-core/mds-test-data'
import type { TAXI_VEHICLE_EVENT, Timestamp, TripMetadata, TRIP_STATE, VehicleEvent } from '@mds-core/mds-types'
import {
  MICRO_MOBILITY_EVENT_STATES_MAP,
  MICRO_MOBILITY_VEHICLE_EVENTS,
  TAXI_EVENT_STATES_MAP,
  TAXI_VEHICLE_EVENTS,
  TNC_EVENT_STATES_MAP,
  TNC_VEHICLE_EVENT,
  TRIP_STATES
} from '@mds-core/mds-types'
import { pathPrefix, uuid } from '@mds-core/mds-utils'
import supertest from 'supertest'
import { api } from '../api'

const request = supertest(ApiServer(api))

function now(): Timestamp {
  return Date.now()
}

const APP_JSON = 'application/vnd.mds.agency+json; charset=utf-8; version=0.4'

const PROVIDER_SCOPES = 'admin:all'
const DEVICE_UUID = 'ec551174-f324-4251-bfed-28d9f3f473fc'
const TRIP_UUID = '1f981864-cc17-40cf-aea3-70fd985e2ea7'
const TEST_TELEMETRY = {
  device_id: DEVICE_UUID,
  gps: {
    lat: 37.3382,
    lng: -121.8863,
    speed: 0,
    hdop: 1,
    heading: 180,
    accuracy: null,
    altitude: null,
    charge: null
  },
  charge: 0.5,
  timestamp: now()
}
const TEST_TELEMETRY2 = {
  device_id: DEVICE_UUID,
  gps: {
    lat: 37.3382,
    lng: -121.8863,
    speed: 0,
    hdop: 1,
    heading: 180,
    satellites: 10
  },
  charge: 0.5,
  timestamp: now() + 1000
}

const TEST_BICYCLE: Omit<DeviceDomainModel, 'recorded' | 'accessibility_options'> = {
  device_id: DEVICE_UUID,
  provider_id: TEST1_PROVIDER_ID,
  vehicle_id: 'test-id-1',
  vehicle_type: 'bicycle',
  propulsion_types: ['human'],
  year: 2018,
  mfgr: 'Schwinn',
  modality: 'micromobility',
  model: 'Mantaray'
}

const TEST_TAXI: Omit<DeviceDomainModel, 'recorded'> = {
  accessibility_options: ['wheelchair_accessible'],
  device_id: uuid(),
  provider_id: TEST1_PROVIDER_ID,
  vehicle_id: 'test-id-1',
  vehicle_type: 'car',
  propulsion_types: ['electric'],
  year: 2018,
  mfgr: 'Schwinn',
  modality: 'taxi',
  model: 'Mantaray'
}

const TEST_TNC: Omit<DeviceDomainModel, 'recorded'> = {
  accessibility_options: ['wheelchair_accessible'],
  device_id: uuid(),
  provider_id: TEST1_PROVIDER_ID,
  vehicle_id: 'test-id-1',
  vehicle_type: 'car',
  propulsion_types: ['electric'],
  year: 2018,
  mfgr: 'Schwinn',
  modality: 'tnc',
  model: 'Mantaray'
}

let testTimestamp = now()

const test_event: Omit<VehicleEvent, 'recorded' | 'provider_id'> = {
  device_id: DEVICE_UUID,
  event_types: ['decommissioned'],
  vehicle_state: 'removed',
  trip_state: null,
  timestamp: testTimestamp,
  telemetry_timestamp: testTimestamp,
  telemetry: makeTelemetry([TEST_BICYCLE as DeviceDomainModel], testTimestamp)[0]
}

testTimestamp += 1

const JUMP_TEST_DEVICE_1_ID = JUMP_TEST_DEVICE_1.device_id

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// TODO Inherit all of these from mds-test-data
const AUTH = `basic ${Buffer.from(`${TEST1_PROVIDER_ID}|${PROVIDER_SCOPES}`).toString('base64')}`
const AUTH2 = `basic ${Buffer.from(`${TEST2_PROVIDER_ID}|${PROVIDER_SCOPES}`).toString('base64')}`

const SAN_FERNANDO_VALLEY = 'e3ed0a0e-61d3-4887-8b6a-4af4f3769c14'
const IngestServer = IngestServiceManager.controller()

describe('Agency Tests', () => {
  beforeAll(async () => {
    await Promise.all([db.reinitialize(), cache.reinitialize()])
    await IngestServer.start()
  })

  afterAll(async () => {
    await Promise.all([db.shutdown(), cache.shutdown(), IngestStream.shutdown()])
    await IngestServer.stop()
  })

  describe('Tests API', () => {
    it('verifies post device failure nothing in body', async () => {
      const result = await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).expect(400)

      expect(result.body.error).toContain('missing')
      expect(result.body.error_description).toContain('missing')
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies get non-existent device', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}`))
        .set('Authorization', AUTH)
        .expect(404)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies get non-existent device from cache', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}?cached=true`))
        .set('Authorization', AUTH)
        .expect(404)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies post device bad device id', async () => {
      const badDeviceIdErr = {
        error: 'bad_param',
        error_description: 'A validation error occurred.',
        error_details: [
          {
            property: 'device_id',
            message: 'must match format "uuid"'
          }
        ]
      }

      const badVehicle = deepCopy(TEST_BICYCLE)
      badVehicle.device_id = 'bad'
      const result = await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(badVehicle).expect(400)

      expect(result.body).toMatchObject(badDeviceIdErr)
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('verifies post device missing propulsion_types', async () => {
      const { propulsion_types, ...badVehicle } = deepCopy(TEST_BICYCLE)

      const result = await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(badVehicle).expect(400)

      expect(result.body.error_description).toContain('missing')
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('verifies post device bad propulsion_types', async () => {
      const badPropulsionErr = {
        error: 'bad_param',
        error_description: 'A validation error occurred.',
        error_details: [
          {
            property: 'propulsion_types',
            message: 'must be equal to one of the allowed values'
          }
        ]
      }
      const badVehicle = deepCopy(TEST_BICYCLE)
      // @ts-ignore: Spoofing garbage data
      badVehicle.propulsion_types = ['hamster']
      const result = await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(badVehicle).expect(400)

      expect(result.body).toMatchObject(badPropulsionErr)
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('verifies post device bad year', async () => {
      const badYearErr = {
        error: 'bad_param',
        error_description: 'A validation error occurred.',
        error_details: [
          {
            property: 'year',
            message: 'must be integer'
          }
        ]
      }

      const badVehicle = deepCopy(TEST_BICYCLE)
      // @ts-ignore: Spoofing garbage data
      badVehicle.year = 'hamster'
      const result = await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(badVehicle).expect(400)

      expect(result.body).toMatchObject(badYearErr)
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies post device missing vehicle_type', async () => {
      const { vehicle_type, ...badVehicle } = deepCopy(TEST_BICYCLE)

      const result = await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(badVehicle).expect(400)

      expect(result.body.error_description).toContain('missing')
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies post device bad vehicle_type', async () => {
      const badVehicleTypeErr = {
        error: 'bad_param',
        error_description: 'A validation error occurred.',
        error_details: [
          {
            property: 'vehicle_type',
            message: 'must be equal to one of the allowed values'
          }
        ]
      }
      const badVehicle = deepCopy(TEST_BICYCLE)
      // @ts-ignore: Spoofing garbage data
      badVehicle.vehicle_type = 'hamster'
      const result = await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(badVehicle).expect(400)

      expect(result.body).toMatchObject(badVehicleTypeErr)
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('verifies post device success', async () => {
      const result = await request
        .post(pathPrefix('/vehicles'))
        .set('Authorization', AUTH)
        .send(TEST_BICYCLE)
        .expect(201)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies read back all devices from db', async () => {
      const result = await request.get(pathPrefix('/vehicles')).set('Authorization', AUTH).expect(200)

      expect(result.body.vehicles[0].vehicle_id).toEqual('test-id-1')
      expect(result.body.vehicles[0].state).toEqual('removed')
      expect(result.body.links.first).toContain('http')
      expect(result.body.links.last).toContain('http')
      expect(result.body.links.prev).toEqual(null)
    })
    it('verifies get device readback success (database)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}`))
        .set('Authorization', AUTH)
        .expect(200)

      expect(result.body).toMatchObject({ device_id: DEVICE_UUID })
      expect(result.body).toMatchObject({ provider_id: TEST1_PROVIDER_ID })
      expect(result.body).toMatchObject({ state: 'removed' })
      expect(!result.body.hasOwnProperty('migrated_from_source')).toBeTruthy()
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies get device readback success (cache)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}?cached=true`))
        .set('Authorization', AUTH)
        .expect(200)

      expect(result.body).toMatchObject({ device_id: DEVICE_UUID })
      expect(result.body).toMatchObject({ provider_id: TEST1_PROVIDER_ID })
      expect(result.body).toMatchObject({ state: 'removed' })
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies get device readback failure (provider mismatch database)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}`))
        .set('Authorization', AUTH2)
        .expect(404)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies get device readback failure (provider mismatch cache)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}?cached=true`))
        .set('Authorization', AUTH2)
        .expect(404)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies post same device fails as expected', async () => {
      const result = await request
        .post(pathPrefix('/vehicles'))
        .set('Authorization', AUTH)
        .send(TEST_BICYCLE)
        .expect(409)

      expect(result.body.error_description).toContain('already registered')
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    const NEW_VEHICLE_ID = 'new-vehicle-id'
    it('verifies put update success', async () => {
      const result = await request
        .put(pathPrefix(`/vehicles/${TEST_BICYCLE.device_id}`))
        .set('Authorization', AUTH)
        .send({
          vehicle_id: NEW_VEHICLE_ID
        })
        .expect(201)

      // expect(result.body.error).toContain('already_registered')
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies put update failure (provider mismatch)', async () => {
      const result = await request
        .put(pathPrefix(`/vehicles/${TEST_BICYCLE.device_id}`))
        .set('Authorization', AUTH2)
        .send({
          vehicle_id: NEW_VEHICLE_ID
        })
        .expect(404)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies get device readback success after update (database)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}`))
        .set('Authorization', AUTH)
        .expect(200)

      expect(result.body).toMatchObject({ vehicle_id: NEW_VEHICLE_ID })
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies get device readback success after update (cache)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}?cached=true`))
        .set('Authorization', AUTH)
        .expect(200)

      expect(result.body).toMatchObject({ vehicle_id: NEW_VEHICLE_ID })
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies put bogus device_id fail', async () => {
      const result = await request
        .put(pathPrefix('/vehicles/' + 'hamster'))
        .set('Authorization', AUTH)
        .send({
          vehicle_id: 'new-vehicle-id'
        })
        .expect(400)

      // expect(result.body.error).toContain('already_registered')
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
    it('verifies put non-existent device_id fail', async () => {
      const result = await request
        .put(pathPrefix(`/vehicles/${TRIP_UUID}`))
        .set('Authorization', AUTH)
        .send({
          vehicle_id: 'new-vehicle-id'
        })
        .expect(404)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('resets the cache', async () => {
      await cache.reset()
    })

    it('shuts down the db to verify that it will come back up', async () => {
      await db.shutdown()
    })

    it('verifies on_hours success', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['on_hours'],
          vehicle_state: 'available',
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp + 10000
        })
        .expect(201)

      testTimestamp += 20000
      expect(result.body.state).toEqual('available')
    })

    it('verifies read back all devices from db', async () => {
      const result = await request.get(pathPrefix('/vehicles')).set('Authorization', AUTH).expect(200)

      expect(result.body.vehicles[0].vehicle_id).toEqual('new-vehicle-id')
      expect(result.body.vehicles[0].state).toEqual('available')
      expect(result.body.links.first).toContain('http')
      expect(result.body.links.last).toContain('http')
    })

    // status
    it('verifies post device status deregister success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send(test_event)
        .expect(201)
    })

    it('verifies read-back of post device status decomissioned success (db)', async () => {
      const event = await db.readEvent(DEVICE_UUID, test_event.timestamp)
      expect(event.event_types[0] === 'decommissioned').toBeTruthy()
      expect(event.device_id === DEVICE_UUID).toBeTruthy()
    })

    it('verifies post device status bogus event', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['BOGUS'],
          vehicle_state: 'foo',
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(400)

      expect(result.body.error_description).toContain('A validation error occurred.')
    })
    it('verifies post device status bogus DEVICE_UUID', async () => {
      const result = await request
        .post(pathPrefix('/vehicles/' + 'bogus' + '/event'))
        .set('Authorization', AUTH)
        .send({
          event_types: ['maintenance_pick_up'],
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(400)

      expect(result.body.error_description).toContain('A validation error occurred.')
    })
    it('verifies post device status provider mismatch', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH2)
        .send({
          event_types: ['maintenance_pick_up'],
          vehicle_state: 'removed',
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(400)

      expect(result.body.error_description).toContain('The specified device_id has not been registered')
    })
    it('verifies post device status missing timestamp', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['maintenance_pick_up'],
          vehicle_state: 'removed',
          telemetry: TEST_TELEMETRY
        })
        .expect(400)

      expect(result.body.error).toContain('missing')
      expect(result.body.error_description).toContain('missing')
    })
    it('verifies post device status bad timestamp', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['provider_drop_off'],
          vehicle_state: 'available',
          telemetry: TEST_TELEMETRY,
          timestamp: 'hamster'
        })
        .expect(400)

      expect(result.body.error).toContain('bad')
      expect(result.body.error_description).toContain('A validation error occurred.')
    })
    it('verifies post event bad heading', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['provider_drop_off'],
          vehicle_state: 'available',
          telemetry: { ...TEST_TELEMETRY, gps: { ...TEST_TELEMETRY.gps, heading: -1 } },
          timestamp: testTimestamp
        })
        .expect(400)

      expect(result.body.error).toContain('bad')
      expect(result.body.error_description).toContain('A validation error occurred.')
    })
    it('verifies post device maintenance event', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['maintenance_pick_up'],
          vehicle_state: 'removed',
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(201)
    })
    it('verifies post duplicate event fails as expected', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['maintenance_pick_up'],
          vehicle_state: 'removed',
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp - 1
        })
        .expect(400)

      expect(result.body.error_description).toContain(
        'An event with this device_id and timestamp has already been received'
      )
    })
    it('verifies post event to non-existent vehicle fails as expected', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${TRIP_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['maintenance_pick_up'],
          vehicle_state: 'removed',
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp
        })
        .expect(400)

      expect(result.body.error_description).toContain('The specified device_id has not been registered')
    })

    // start_trip
    it('verifies post start trip success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_start'],
          vehicle_state: 'on_trip',
          trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(201)
    })
    it('verifies post start trip without trip-id fails', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_start'],
          vehicle_state: 'on_trip',
          // trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(400)

      expect(result.body.error).toContain('missing')
    })
    it('verifies post trip leave success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_leave_jurisdiction'],
          vehicle_state: 'elsewhere',
          trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(201)
    })
    it('verifies post trip enter success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_enter_jurisdiction'],
          vehicle_state: 'on_trip',
          trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(201)
    })
    it('verifies post end trip success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(201)
    })

    it('verifies post trip end readback telemetry', async () => {
      const { device_id, timestamp } = TEST_TELEMETRY
      const [telemetry] = await db.readTelemetry(device_id, timestamp, timestamp)
      expect(telemetry?.device_id).toEqual(TEST_TELEMETRY.device_id)
    })

    it('verifies post reserve success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['reservation_start'],
          vehicle_state: 'reserved',
          trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(201)
    })
    it('verifies post reserve cancellation success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['reservation_cancel'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(201)
    })

    it('verifies post start trip missing event', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          vehicle_state: 'on_trip',
          trip_id: TRIP_UUID,
          telemetry: TEST_TELEMETRY,
          timestamp: testTimestamp++
        })
        .expect(400)

      expect(result.body.error).toContain('missing')
      expect(result.body.error_description).toContain('missing')
    })

    const { gps, ...telemetry_without_location } = deepCopy(TEST_TELEMETRY)

    it('verifies post trip start missing location fails', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_start'],
          vehicle_state: 'on_trip',
          trip_id: TRIP_UUID,
          timestamp: testTimestamp++
        })
        .expect(400)
    })

    it('verifies post trip end fail bad trip_id', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: 'BOGUS',
          timestamp: testTimestamp++,
          telemetry: TEST_TELEMETRY
        })
        .expect(400)

      expect(result.body.error).toContain('bad_param')
      expect(result.body.error_description).toContain('A validation error occurred.')
    })
    const telemetry_with_bad_lat = deepCopy(TEST_TELEMETRY)
    // @ts-ignore: Spoofing garbage data
    telemetry_with_bad_lat.gps.lat = 'hamster'

    it('verifies post trip end fail bad latitude', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          timestamp: testTimestamp++,
          telemetry: telemetry_with_bad_lat
        })
        .expect(400)

      expect(result.body.error).toContain('bad_param')
      expect(result.body.error_description).toContain('A validation error occurred')
      expect(result.body.error_details[0].property).toContain('lat')
    })
    const telemetry_with_bad_alt = deepCopy(TEST_TELEMETRY)
    // @ts-ignore: Spoofing garbage data
    telemetry_with_bad_alt.gps.altitude = 'hamster'

    it('verifies post trip end fail bad altitude', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          timestamp: testTimestamp++,
          telemetry: telemetry_with_bad_alt
        })
        .expect(400)

      expect(result.body.error).toContain('bad_param')
      expect(result.body.error_description).toContain('A validation error occurred')
      expect(result.body.error_details[0].property).toContain('altitude')
    })
    const telemetry_with_bad_accuracy = deepCopy(TEST_TELEMETRY)
    // @ts-ignore: Spoofing garbage data
    telemetry_with_bad_accuracy.gps.accuracy = 'potato'

    it('verifies post trip end fail bad accuracy', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          timestamp: testTimestamp++,
          telemetry: telemetry_with_bad_accuracy
        })
        .expect(400)

      expect(result.body.error).toContain('bad_param')
      expect(result.body.error_description).toContain('A validation error occurred')
      expect(result.body.error_details[0].property).toContain('accuracy')
    })
    const telemetry_with_bad_speed = deepCopy(TEST_TELEMETRY)
    // @ts-ignore: Spoofing garbage data
    telemetry_with_bad_speed.gps.speed = 'potato'

    it('verifies post trip end fail bad speed', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          timestamp: testTimestamp++,
          telemetry: telemetry_with_bad_speed
        })
        .expect(400)

      expect(result.body.error).toContain('bad_param')
      expect(result.body.error_description).toContain('A validation error occurred')
      expect(result.body.error_details[0].property).toContain('speed')
    })
    const telemetry_with_bad_satellites = deepCopy(TEST_TELEMETRY)
    // @ts-ignore: Spoofing garbage data
    telemetry_with_bad_satellites.gps.satellites = 'potato'

    it('verifies post trip end fail bad satellites', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          timestamp: testTimestamp++,
          telemetry: telemetry_with_bad_satellites
        })
        .expect(400)

      expect(result.body.error).toContain('bad_param')
      expect(result.body.error_description).toContain('A validation error occurred')
      expect(result.body.error_details[0].property).toContain('satellites')
    })
    it('verifies post end trip missing location', async () => {
      const result = await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['trip_end'],
          vehicle_state: 'available',
          trip_id: TRIP_UUID,
          timestamp: testTimestamp++,
          TEST_TELEMETRY: telemetry_without_location
        })
        .expect(400)

      expect(result.body.error).toContain('missing')
      expect(result.body.error_description).toContain('missing')
    })

    // post some event in past
    // make sure it's ok to do so
    const lateTimestamp = testTimestamp - 200000 // 2000s before

    it('verifies late-event off-hours success', async () => {
      await request
        .post(pathPrefix(`/vehicles/${DEVICE_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['off_hours'],
          vehicle_state: 'non_operational',
          telemetry: TEST_TELEMETRY,
          timestamp: lateTimestamp
        })
        .expect(201)
    })

    // read back posted event (cache should not work; it should only have latest)
    it('verifies late-event read-back of off-hours success (db)', async () => {
      const timestamp = lateTimestamp

      const event = await db.readEvent(DEVICE_UUID, timestamp)
      expect(event.event_types[0]).toEqual('off_hours')
    })

    // make sure we read back the latest event, not the past event
    it('verifies out-of-order event reads back latest (cache)', async () => {
      const event = await db.readEvent(DEVICE_UUID, 0)
      expect(event.event_types[0] === 'reservation_cancel').toBeTruthy()
    })

    const WEIRD_UUID = '034e1c90-9f84-4292-a750-e8f395e4869d'
    // tests this particular uuid
    it('verifies wierd uuid', async () => {
      await request
        .post(pathPrefix(`/vehicles/${WEIRD_UUID}/event`))
        .set('Authorization', AUTH)
        .send({
          event_types: ['off_hours'],
          vehicle_state: 'non_operational',
          telemetry: TEST_TELEMETRY,
          timestamp: lateTimestamp
        })
        .expect(400)
    })

    it('verifies post telemetry', async () => {
      await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [TEST_TELEMETRY, TEST_TELEMETRY2]
        })
        .expect(200)
    })
    it('verifies post telemetry handling of empty data payload fails', async () => {
      const result = await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({})
        .expect(400)

      expect(result.body.error).toContain('missing_param')
      expect(result.body.error_description).toContain('A required parameter is missing.')
      expect(result.body.error_details[0]).toContain('data')
    })
    it('verifies posting the same telemetry does not break things', async () => {
      const result = await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [TEST_TELEMETRY, TEST_TELEMETRY2]
        })
        .expect(400)

      expect(result.body.error_description).toContain('None of the provided data was valid')
    })
    it('verifies read-back posted telemetry', async () => {
      const { device_id, timestamp } = TEST_TELEMETRY
      const [telemetry] = await db.readTelemetry(device_id, timestamp, timestamp)
      expect(telemetry?.device_id).toEqual(TEST_TELEMETRY.device_id)
    })
    it('verifies fail read-back telemetry with bad timestamp', async () => {
      const { device_id } = TEST_TELEMETRY
      const [telemetry] = await db.readTelemetry(device_id, 0, 0)
      expect(!telemetry).toBeTruthy()
    })

    it('verifies post telemetry with bad device_id', async () => {
      const badTelemetry = deepCopy(TEST_TELEMETRY)
      // @ts-ignore: Spoofing garbage data
      badTelemetry.device_id = 'bogus'
      await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [badTelemetry]
        })
        .expect(400)
    })
    it('verifies post telemetry with bad gps.lat', async () => {
      const badTelemetry = deepCopy(TEST_TELEMETRY)
      // @ts-ignore: Spoofing garbage data
      badTelemetry.gps.lat = 'bogus'

      const result = await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [badTelemetry]
        })
        .expect(400)

      expect(result.body.error_details.length).toEqual(1)
    })
    it('verifies post telemetry with bad gps.lng', async () => {
      const badTelemetry = deepCopy(TEST_TELEMETRY)
      // @ts-ignore: Spoofing garbage data
      badTelemetry.gps.lng = 'bogus'

      const result = await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [badTelemetry]
        })
        .expect(400)

      expect(result.body.error_details.length).toEqual(1)
    })
    it('verifies post telemetry with bad charge', async () => {
      const badTelemetry = deepCopy(TEST_TELEMETRY)
      // @ts-ignore: Spoofing garbage data
      badTelemetry.charge = 'bogus'

      await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [badTelemetry]
        })
        .expect(400)
    })
    it('verifies post telemetry with bad gps.lng', async () => {
      const badTelemetry = deepCopy(TEST_TELEMETRY)
      // @ts-ignore: Spoofing garbage data
      badTelemetry.timestamp = 'bogus'

      await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [badTelemetry]
        })
        .expect(400)
    })
    it('verifies post telemetry with mismatched provider', async () => {
      await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH2)
        .send({
          data: [TEST_TELEMETRY]
        })
        .expect(400)
    })
    it('verifies post telemetry with unregistered device', async () => {
      const telemetry = { ...TEST_TELEMETRY, device_id: uuid() } // randomly generate a new uuid, obviously not registered
      await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: [telemetry]
        })
        .expect(400)
    })
    it('verifies post telemetry bulk with unregistered devices fails', async () => {
      const telemetry = [
        { ...TEST_TELEMETRY, device_id: uuid() },
        { ...TEST_TELEMETRY, device_id: uuid() }
      ]

      await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: telemetry
        })
        .expect(400)
    })
    it('verifies post telemetry bulk with one unregistered device partially succeeds', async () => {
      const devices = [...makeDevices(1, now(), TEST1_PROVIDER_ID), ...makeDevices(1, now(), TEST2_PROVIDER_ID)]
      const telemetry = makeTelemetry(devices, now())

      const [deviceToRegister] = devices

      if (!deviceToRegister) {
        throw new Error('Expected device to register')
      }

      await Promise.all([
        db.seed({ devices: [deviceToRegister] }),
        cache.seed({ devices: [deviceToRegister], telemetry: [], events: [] })
      ])

      const result = await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: telemetry
        })
        .expect(200)

      expect(result.body.failures.length).toEqual(1)
    })
    it('verifies post telemetry with one registered device and one device registered to another provider partially succeeds', async () => {
      const devices = [...makeDevices(1, now(), TEST1_PROVIDER_ID), ...makeDevices(1, now(), TEST2_PROVIDER_ID)]
      const telemetry = makeTelemetry(devices, now())

      await Promise.all([db.seed({ devices }), cache.seed({ devices, telemetry: [], events: [] })])

      const result = await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: telemetry
        })
        .expect(200)

      expect(result.body.failures.length).toEqual(1)
    })
    it('verifies post telemetry with one schema-valid and one not schema-valid succeeds', async () => {
      const devices = makeDevices(1, now(), TEST1_PROVIDER_ID)
      const telemetry = [...makeTelemetry(devices, now()), { device_id: uuid(), spider: 'I am itsy-bitsy 🕷' }]

      await Promise.all([db.seed({ devices }), cache.seed({ devices, telemetry: [], events: [] })])

      const result = await request
        .post(pathPrefix('/vehicles/telemetry'))
        .set('Authorization', AUTH)
        .send({
          data: telemetry
        })
        .expect(200)

      expect(result.body.failures.length).toEqual(1)
    })
    it('verifies get device readback w/telemetry success (database)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}`))
        .set('Authorization', AUTH)
        .expect(200)

      const deviceA = result.body
      expect(deviceA.device_id).toEqual(DEVICE_UUID)
      expect(deviceA.provider_id).toEqual(TEST1_PROVIDER_ID)
      expect(deviceA.gps.lat).toEqual(TEST_TELEMETRY.gps.lat)
      expect(deviceA.state).toEqual('available')
      expect(JSON.stringify(deviceA.prev_events)).toEqual(JSON.stringify(['reservation_cancel']))
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('verifies get device readback w/telemetry success (cache)', async () => {
      const result = await request
        .get(pathPrefix(`/vehicles/${DEVICE_UUID}?cached=true`))
        .set('Authorization', AUTH)
        .expect(200)

      const deviceB = result.body
      expect(deviceB.device_id).toEqual(DEVICE_UUID)
      expect(deviceB.provider_id).toEqual(TEST1_PROVIDER_ID)
      expect(deviceB.gps.lat).toEqual(TEST_TELEMETRY.gps.lat)
      expect(deviceB.state).toEqual('available')
      expect(JSON.stringify(deviceB.prev_events)).toEqual(JSON.stringify(['reservation_cancel']))
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('verifies get device defaults to `deregister` if cache misses reads for associated events', async () => {
      await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(JUMP_TEST_DEVICE_1).expect(201)

      const [telemetry] = makeTelemetry([JUMP_TEST_DEVICE_1], now())
      await request
        .post(pathPrefix(`/vehicles/${JUMP_TEST_DEVICE_1_ID}/event`))
        .set('Authorization', AUTH)
        .send({
          device_id: JUMP_TEST_DEVICE_1,
          timestamp: now(),
          event_types: ['decommissioned'],
          vehicle_state: 'removed',
          telemetry
        })
        .expect(201)

      const result = await request
        .get(pathPrefix(`/vehicles/${JUMP_TEST_DEVICE_1_ID}`))
        .set('Authorization', AUTH)
        .expect(200)
      expect(result.body.state === 'removed').toBeTruthy()
      expect(JSON.stringify(result.body.prev_events) === JSON.stringify(['decommissioned'])).toBeTruthy()
    })

    it('verifies can make const result = await request for foreign provider_id', async () => {
      const provider_id = uuid()
      const AUTH = `basic ${Buffer.from(`${provider_id}|${PROVIDER_SCOPES}`).toString('base64')}`

      const [device] = makeDevices(1, now(), provider_id)

      await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(device).expect(201)
    })

    it('get multiple devices endpoint has vehicle status default to `inactive` if event is missing for a device', async () => {
      const result = await request.get(pathPrefix(`/vehicles/`)).set('Authorization', AUTH).expect(200)
      const ids = result.body.vehicles.map((device: { device_id: unknown }) => device.device_id)
      expect(ids.includes(JUMP_TEST_DEVICE_1_ID)).toBeTruthy()
      result.body.vehicles.map((device: { device_id: string; state: string }) => {
        if (device.device_id === JUMP_TEST_DEVICE_1_ID) {
          expect(device.state === 'removed').toBeTruthy()
        }
      })
    })

    it('gets cache info', async () => {
      const result = await request.get(pathPrefix('/admin/cache/info')).set('Authorization', AUTH).expect(200)

      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })
  })

  describe('Tests pagination', () => {
    beforeAll(async () => {
      const devices = makeDevices(100, now())
      const events = makeEventsWithTelemetry(devices, now(), SAN_FERNANDO_VALLEY)
      const seedData = { devices, events, telemetry: [] }
      await Promise.all([db.reinitialize(), cache.reinitialize()])
      await Promise.all([cache.seed(seedData), db.seed(seedData)])
    })

    it('verifies paging links when read back all devices from db', async () => {
      const result = await request
        .get(pathPrefix('/vehicles?skip=2&take=5&foo=bar'))
        .set('Authorization', AUTH)
        .expect(200)

      expect(result.body.vehicles.length === 5).toBeTruthy()
      expect(result.body.links.first).toContain('http')
      expect(result.body.links.last).toContain('http')
      expect(result.body.links.next).toContain('skip=7')
      expect(result.body.links.next).toContain('take=5')
      expect(result.body.links.next).toContain('foo=bar')
    })

    it('verifies reading past the end of the vehicles', async () => {
      const result = await request.get(pathPrefix('/vehicles?skip=20000&take=5')).set('Authorization', AUTH).expect(200)

      expect(result.body.links.first).toContain('http')
      expect(result.body.links.last).toContain('http')
      expect(result.body.links.next).toEqual(null)
    })

    it('verifies vehicles access for all providers with vehicles:read scope', async () => {
      const VEHICLES_READ_AUTH = `basic ${Buffer.from(`${TEST2_PROVIDER_ID}|vehicles:read`).toString('base64')}`
      const result = await request
        .get(pathPrefix(`/vehicles?provider_id=${TEST1_PROVIDER_ID}`))
        .set('Authorization', VEHICLES_READ_AUTH)
        .expect(200)

      expect(result.body.total === 100).toBeTruthy()
      expect(result.body.links.first).toContain('http')
      expect(result.body.links.last).toContain('http')
    })

    it('verifies no vehicles access for all providers without vehicles:read scope', async () => {
      const VEHICLES_READ_AUTH = `basic ${Buffer.from(`${TEST2_PROVIDER_ID}|${PROVIDER_SCOPES}`).toString('base64')}`
      const result = await request
        .get(pathPrefix(`/vehicles?provider_id=${TEST1_PROVIDER_ID}`))
        .set('Authorization', VEHICLES_READ_AUTH)
        .expect(200)

      expect(result.body.total === 0).toBeTruthy()
      expect(result.body.links.first).toContain('http')
      expect(result.body.links.last).toContain('http')
    })
  })

  describe('Tests for taxi modality', () => {
    beforeAll(async () => {
      await Promise.all([db.reinitialize()])
    })

    it('verifies post taxi success', async () => {
      await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(TEST_TAXI).expect(201)
    })

    for (const taxiEvent of TAXI_VEHICLE_EVENTS) {
      const validStates = TAXI_EVENT_STATES_MAP[taxiEvent]
      for (const vehicle_state of validStates) {
        it(`verifies ${taxiEvent} success`, async () => {
          const { device_id } = TEST_TAXI
          const body = {
            event_types: [taxiEvent],
            vehicle_state,
            telemetry: TEST_TELEMETRY,
            timestamp: now(),
            ...(taxiEvent.startsWith('trip_') ? { trip_id: '1f943d59-ccc9-4d91-b6e2-0c5e771cbc6b' } : {}),
            ...(TRIP_STATES.includes(vehicle_state as TRIP_STATE) ? { trip_state: vehicle_state as TRIP_STATE } : {})
          }
          await request
            .post(pathPrefix(`/vehicles/${device_id}/event`))
            .set('Authorization', AUTH)
            .send(body)
            .expect(201)
        })
      }
    }

    /* We want to test for all micromobility events which
     * are not included in the valid Taxi events.
     */
    const MICRO_MOBILITY_EVENTS_NOT_IN_TAXI_EVENTS = MICRO_MOBILITY_VEHICLE_EVENTS.filter(
      item => !TAXI_VEHICLE_EVENTS.includes(item as TAXI_VEHICLE_EVENT)
    )

    for (const microEvent of MICRO_MOBILITY_EVENTS_NOT_IN_TAXI_EVENTS) {
      const validStates = MICRO_MOBILITY_EVENT_STATES_MAP[microEvent]
      for (const vehicle_state of validStates) {
        it(`verifies cannot send micromobility type event: ${microEvent} for a taxi`, async () => {
          const { device_id } = TEST_TAXI
          const result = await request
            .post(pathPrefix(`/vehicles/${device_id}/event`))
            .set('Authorization', AUTH)
            .send({
              event_types: [microEvent],
              vehicle_state,
              telemetry: TEST_TELEMETRY,
              timestamp: now(),
              ...(microEvent.startsWith('trip_') ? { trip_id: '1f943d59-ccc9-4d91-b6e2-0c5e771cbc6b' } : {}),
              ...(TRIP_STATES.includes(vehicle_state as TRIP_STATE) ? { trip_state: vehicle_state as TRIP_STATE } : {})
            })
            .expect(400)

          expect(result.body.error).toContain('bad_param')
          expect(result.body.error_description).toContain('invalid event_type')
        })
      }
    }
  })

  describe('Tests for tnc modality', () => {
    beforeAll(async () => {
      await Promise.all([db.reinitialize()])
    })

    it('verifies post tnc success', async () => {
      await request.post(pathPrefix('/vehicles')).set('Authorization', AUTH).send(TEST_TNC).expect(201)
    })

    for (const tncEvent of TNC_VEHICLE_EVENT) {
      const validStates = TNC_EVENT_STATES_MAP[tncEvent]
      for (const vehicle_state of validStates) {
        it(`verifies ${tncEvent} success`, async () => {
          const { device_id } = TEST_TNC
          const body = {
            event_types: [tncEvent],
            vehicle_state,
            telemetry: TEST_TELEMETRY,
            timestamp: now(),
            ...(tncEvent.startsWith('trip_') ? { trip_id: '1f943d59-ccc9-4d91-b6e2-0c5e771cbc6b' } : {}),
            ...(TRIP_STATES.includes(vehicle_state as TRIP_STATE) ? { trip_state: vehicle_state as TRIP_STATE } : {})
          }
          await request
            .post(pathPrefix(`/vehicles/${device_id}/event`))
            .set('Authorization', AUTH)
            .send(body)
            .expect(201)

          // expect(result.body.status).toEqual(EVENT_STATUS_MAP[taxiEvent])
        })
      }
    }

    /* We want to test for all micromobility events which
     * are not included in the valid tnc events.
     */
    const MICRO_MOBILITY_EVENTS_NOT_IN_TNC_EVENTS = MICRO_MOBILITY_VEHICLE_EVENTS.filter(
      item => !TNC_VEHICLE_EVENT.includes(item as TNC_VEHICLE_EVENT)
    )

    for (const microEvent of MICRO_MOBILITY_EVENTS_NOT_IN_TNC_EVENTS) {
      const validStates = MICRO_MOBILITY_EVENT_STATES_MAP[microEvent]
      for (const vehicle_state of validStates) {
        it(`verifies cannot send micromobility type event: ${microEvent} for a tnc`, async () => {
          const { device_id } = TEST_TNC
          const result = await request
            .post(pathPrefix(`/vehicles/${device_id}/event`))
            .set('Authorization', AUTH)
            .send({
              event_types: [microEvent],
              vehicle_state,
              telemetry: TEST_TELEMETRY,
              timestamp: now(),
              ...(microEvent.startsWith('trip_') ? { trip_id: '1f943d59-ccc9-4d91-b6e2-0c5e771cbc6b' } : {}),
              ...(TRIP_STATES.includes(vehicle_state as TRIP_STATE) ? { trip_state: vehicle_state as TRIP_STATE } : {})
            })
            .expect(400)

          expect(result.body.error).toContain('bad_param')
          expect(result.body.error_description).toContain('invalid event_type')
        })
      }
    }
  })

  describe('Tests TripMetadata', () => {
    const metadata: () => Required<Omit<TripMetadata, 'provider_id'>> = () => ({
      trip_id: uuid(),
      requested_trip_start_location: { lat: 34.0522, lng: -118.2437 },
      reservation_time: now(),
      quoted_trip_start_time: now(),
      dispatch_time: now(),
      trip_start_time: now(),
      trip_end_time: now(),
      cancellation_reason: 'test',
      distance: 100,
      accessibility_options: [],
      fare: {
        quoted_cost: 2000,
        actual_cost: 2500,
        components: {},
        currency: 'USD',
        payment_methods: ['cash', 'card', 'equity_program']
      },
      reservation_type: 'on_demand',
      reservation_method: 'app'
    })

    it('Tests valid POST payload returns success code', async () => {
      await request.post(pathPrefix('/trips')).set('Authorization', AUTH).send(metadata()).expect(201)
    })

    it('Tests valid PATCH payload returns success code', async () => {
      await request.patch(pathPrefix('/trips')).set('Authorization', AUTH).send(metadata()).expect(201)
    })

    it('Tests unknown properties are allowed', async () => {
      await request
        .patch(pathPrefix('/trips'))
        .set('Authorization', AUTH)
        .send({ ...metadata(), potato: 'I am good in a stew' })
        .expect(201)
    })

    /**
     * Note: Right now trip_id is the only required property, but this may change down the road. Keeping this test harness around even though it's excessive at the moment, because it could prove very useful 🛠
     */
    for (const key of ['trip_id'] as (keyof Omit<TripMetadata, 'provider_id'>)[]) {
      it(`Tests invalid TripMetadata payload without ${key}`, async () => {
        const { [key]: foo, ...subsetMetadata } = metadata()

        // eslint-disable-next-line no-await-in-loop
        const result = await request
          .post(pathPrefix('/trips'))
          .set('Authorization', AUTH)
          .send(subsetMetadata)
          .expect(400)

        expect(result.body.error.reason).toEqual(` must have required property '${key}'`)
      })
    }
  })
})

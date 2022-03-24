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

/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable promise/always-return */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable promise/catch-or-return */

import cache from '@mds-core/mds-agency-cache'
import { ApiServer } from '@mds-core/mds-api-server'
import { AttachmentServiceClient } from '@mds-core/mds-attachment-service'
import db from '@mds-core/mds-db'
import type { DeviceDomainModel } from '@mds-core/mds-ingest-service'
import { IngestServiceClient } from '@mds-core/mds-ingest-service'
import { JEST_PROVIDER_ID } from '@mds-core/mds-providers'
import { ServiceError } from '@mds-core/mds-service-helpers'
import { makeDevices, makeEventsWithTelemetry, makeTelemetryInArea, SCOPED_AUTH } from '@mds-core/mds-test-data'
import type { Attachment, Audit, AuditAttachment, Telemetry, Timestamp, VehicleEvent } from '@mds-core/mds-types'
import { AUDIT_EVENT_TYPES } from '@mds-core/mds-types'
import { NotFoundError, now, pathPrefix, rangeRandomInt, uuid } from '@mds-core/mds-utils'
import supertest from 'supertest'
import { api } from '../api'
import * as attachments from '../attachments'
import { AUDIT_API_DEFAULT_VERSION } from '../types'

const request = supertest(ApiServer(api))

const APP_JSON = 'application/vnd.mds.audit+json; charset=utf-8; version=0.1'

const audit_trip_id = uuid()
const audit_trip_id_2 = uuid()
const audit_device_id: string = uuid()
const provider_id = JEST_PROVIDER_ID
const provider_device_id = uuid()
const provider_vehicle_id = 'test-vehicle'

const SAN_FERNANDO_VALLEY = 'e3ed0a0e-61d3-4887-8b6a-4af4f3769c14'
const CANALS = '43f329fc-335a-4495-b542-6b516def9269'

const telemetry = (): {} => ({
  provider_id,
  device_id: audit_device_id,
  timestamp: Date.now(),
  gps: { lat: 37.4230723, lng: -122.13742939999999 }
})

const AUDIT_START = Date.now()
const OLD_EVENT = Date.now() - 60000

const audit_subject_id = 'user@mds-testing.info'

beforeAll(async () => {
  await Promise.all([db.reinitialize(), cache.reinitialize()])
})

describe('Testing API', () => {
  beforeAll(done => {
    const baseTelemetry = {
      provider_id,
      device_id: provider_device_id,
      timestamp: AUDIT_START,
      recorded: AUDIT_START,
      charge: 0.5,
      gps: {
        lat: 37.4230723,
        lng: -122.137429,
        speed: 0,
        hdop: 1,
        heading: 180
      }
    }
    const baseEvent: VehicleEvent = {
      provider_id,
      device_id: provider_device_id,
      event_types: ['agency_drop_off'],
      vehicle_state: 'available',
      trip_state: null,
      telemetry_timestamp: AUDIT_START,
      telemetry: baseTelemetry,
      trip_id: uuid(),
      timestamp: AUDIT_START,
      recorded: AUDIT_START
    }

    const device: DeviceDomainModel = {
      accessibility_options: [],
      device_id: provider_device_id,
      modality: 'micromobility',
      provider_id,
      year: null,
      mfgr: null,
      model: null,
      vehicle_id: provider_vehicle_id,
      propulsion_types: ['electric'],
      vehicle_type: 'scooter',
      recorded: AUDIT_START
    }

    jest.spyOn(IngestServiceClient, 'getDevice').mockImplementation(async () => device)

    db.writeDevice(device).then(() => {
      db.writeEvent({
        ...baseEvent,
        ...{ telemetry_timestamp: OLD_EVENT, timestamp: OLD_EVENT }
      })
      db.writeEvent(baseEvent)
      db.writeTelemetry([
        {
          ...baseTelemetry,
          ...{ timestamp: OLD_EVENT, recorded: OLD_EVENT }
        },
        {
          ...baseTelemetry,
          ...{ timestamp: AUDIT_START, recorded: AUDIT_START }
        }
      ]).then(() => done())
    })
  })

  it('verify audit start (matching vehicle)', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/start`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        audit_event_id: uuid(),
        timestamp: AUDIT_START,
        provider_id,
        provider_vehicle_id,
        audit_device_id,
        telemetry: telemetry()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result).toHaveProperty('body')
        expect(result.body).toHaveProperty('provider_device')
        expect(result.body.provider_device).toHaveProperty('vehicle_id')
        expect(result.body.provider_device.vehicle_id).toStrictEqual(provider_vehicle_id)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        done(err)
      })
  })

  it('verify audit start (conflict)', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/start`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .expect(409)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it('verify audit start (no scope)', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/start`))
      .set('Authorization', SCOPED_AUTH([], ''))
      .expect(403)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it('verify audit issue event', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/event`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        audit_event_id: uuid(),
        audit_event_type: AUDIT_EVENT_TYPES.issue,
        audit_issue_code: 'vehicle_not_found',
        note: '',
        timestamp: Date.now(),
        telemetry: telemetry()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body).toMatchObject({ version: AUDIT_API_DEFAULT_VERSION })
        done(err)
      })
  })

  it('verify audit issue event (no scope)', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/event`))
      .set('Authorization', SCOPED_AUTH([], ''))
      .send({
        audit_event_id: uuid(),
        audit_event_type: AUDIT_EVENT_TYPES.issue,
        audit_issue_code: 'vehicle_not_found',
        note: '',
        timestamp: Date.now(),
        telemetry: telemetry()
      })
      .expect(403)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it('verify trip start event', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/vehicle/event`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        event_type: 'trip_start',
        timestamp: Date.now(),
        trip_id: audit_trip_id,
        telemetry: telemetry()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        expect(Object.keys(result.body)).toStrictEqual(['version'])
        done(err)
      })
  })

  it('verify audit telemetry', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/vehicle/telemetry`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        telemetry: telemetry(),
        timestamp: Date.now()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        expect(Object.keys(result.body)).toStrictEqual(['version'])
        done(err)
      })
  })

  it('verify audit telemetry (no scope)', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/vehicle/telemetry`))
      .set('Authorization', SCOPED_AUTH([], ''))
      .send({
        telemetry: telemetry(),
        timestamp: Date.now()
      })
      .expect(403)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it('verify trip end event', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/vehicle/event`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        event_type: 'trip_end',
        timestamp: Date.now(),
        trip_id: audit_trip_id,
        telemetry: telemetry()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        done(err)
      })
  })

  it('verify audit summary event', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/event`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        audit_event_id: uuid(),
        audit_event_type: AUDIT_EVENT_TYPES.summary,
        note: 'This audit test passed!!',
        timestamp: Date.now(),
        telemetry: telemetry()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        done(err)
      })
  })

  // ===>>>
  it('verify audit end', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/end`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        audit_event_id: uuid(),
        audit_event_type: AUDIT_EVENT_TYPES.end,
        timestamp: Date.now(),
        telemetry: telemetry()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        done(err)
      })
  })

  it('verify audit end (no scope)', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id}/end`))
      .set('Authorization', SCOPED_AUTH([], ''))
      .send({
        audit_event_id: uuid(),
        timestamp: Date.now(),
        telemetry: telemetry()
      })
      .expect(403)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  const routes = ['note', 'vehicle/event', 'vehicle/telemetry', 'end'].map(path => `/trips/${uuid()}/${path}`)

  routes.forEach(route =>
    it(`verify post audit (not found) ${route}`, done => {
      request
        .post(pathPrefix(route))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .expect(404)
        .end((err, result) => {
          expect(result.header).toHaveProperty('content-type', APP_JSON)
          done(err)
        })
    })
  )

  it('verify get audit (matched vehicle)', done => {
    request
      .get(pathPrefix(`/trips/${audit_trip_id}`))
      .set('Authorization', SCOPED_AUTH(['audits:read'], audit_subject_id))
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        expect(result.body.events.length).toStrictEqual(7)
        expect(result.body.provider_event_types).toStrictEqual(['agency_drop_off'])
        expect(result.body.provider_vehicle_state).toStrictEqual('available')
        expect(result.body.provider_telemetry.charge).toStrictEqual(0.5)
        expect(result.body.provider_event_time).toStrictEqual(AUDIT_START)
        done(err)
      })
  })

  it(`verify get audit (no scope)`, done => {
    request
      .get(pathPrefix(`/trips/${uuid()}`))
      .set('Authorization', SCOPED_AUTH([], ''))
      .expect(403)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it(`verify get audit (not found)`, done => {
    request
      .get(pathPrefix(`/trips/${uuid()}`))
      .set('Authorization', SCOPED_AUTH(['audits:read'], audit_subject_id))
      .expect(404)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it(`verify list audits (no scope)`, done => {
    request
      .get(pathPrefix(`/trips`))
      .set('Authorization', SCOPED_AUTH([], ''))
      .expect(403)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  const queries = [
    { filter: 'verify audit list (unfiltered)', query: ``, count: 1 },
    { filter: 'provider_id', query: `?provider_id=${provider_id}`, count: 1 },
    { filter: 'provider_id', query: `?provider_id=${uuid()}`, count: 0 },
    { filter: 'provider_vehicle_id', query: `?provider_vehicle_id=${provider_vehicle_id.substring(4)}`, count: 1 },
    { filter: 'provider_vehicle_id', query: `?provider_vehicle_id=not-found`, count: 0 },
    { filter: 'audit_subject_id', query: `?audit_subject_id=${audit_subject_id}`, count: 1 },
    { filter: 'audit_subject_id', query: `?audit_subject_id=not-found`, count: 0 },
    { filter: 'start_time', query: `?start_time=${AUDIT_START}`, count: 1 },
    { filter: 'start_time', query: `?start_time=${Date.now()}`, count: 0 },
    { filter: 'end_time', query: `?end_time=${Date.now()}`, count: 1 },
    { filter: 'end_time', query: `?end_time=${AUDIT_START - 1}`, count: 0 }
  ]

  queries.forEach(({ filter, query, count }) =>
    it(`verify list audits (Filter: ${filter}, Count: ${count})`, done => {
      request
        .get(pathPrefix(`/trips${query}`))
        .set('Authorization', SCOPED_AUTH(['audits:read'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.header).toHaveProperty('content-type', APP_JSON)
          expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
          expect(result.body.count).toStrictEqual(count)
          expect(result.body.audits.length).toStrictEqual(count)
          done(err)
        })
    })
  )

  it('verify delete audit (no scope)', done => {
    request
      .delete(pathPrefix(`/trips/${uuid()}`))
      .set('Authorization', SCOPED_AUTH([], ''))
      .expect(403)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it('verify delete audit (not found)', done => {
    request
      .delete(pathPrefix(`/trips/${uuid()}`))
      .set('Authorization', SCOPED_AUTH(['audits:delete'], audit_subject_id))
      .expect(404)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        done(err)
      })
  })

  it('verify delete audit', done => {
    request
      .delete(pathPrefix(`/trips/${audit_trip_id}`))
      .set('Authorization', SCOPED_AUTH(['audits:delete'], audit_subject_id))
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        done(err)
      })
  })

  it('verify audit start (missing vehicle)', done => {
    request
      .post(pathPrefix(`/trips/${audit_trip_id_2}/start`))
      .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
      .send({
        audit_event_id: uuid(),
        timestamp: AUDIT_START,
        provider_id,
        provider_vehicle_id: uuid(),
        audit_device_id,
        telemetry: telemetry()
      })
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        expect(result).toHaveProperty('body')
        expect(result.body).toHaveProperty('provider_device')
        expect(result.body.provider_device).toStrictEqual(null)
        done(err)
      })
  })

  it('verify get audit (missing vehicle)', done => {
    request
      .get(pathPrefix(`/trips/${audit_trip_id_2}`))
      .set('Authorization', SCOPED_AUTH(['audits:read'], audit_subject_id))
      .expect(200)
      .end((err, result) => {
        expect(result.header).toHaveProperty('content-type', APP_JSON)
        expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
        expect(result.body.events.length).toStrictEqual(1)
        done(err)
      })
  })

  const vehicles = [
    provider_vehicle_id, // test-vehicle
    provider_vehicle_id.toUpperCase(), // TEST-VEHICLE
    provider_vehicle_id.replace('-', '_').split('').join('-'), // t-e-s-t-_-v-e-h-i-c-l-e
    provider_vehicle_id
      .split('')
      .map((char, index) => (index % 2 ? char.toLowerCase() : char.toUpperCase()))
      .join('') // TeSt-vEhIcLe
  ]
  vehicles.forEach(vehicle_id =>
    it(`verify vehicle matching ${vehicle_id}`, done => {
      request
        .post(pathPrefix(`/trips/${uuid()}/start`))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .send({
          audit_event_id: uuid(),
          timestamp: AUDIT_START,
          provider_id,
          provider_vehicle_id: vehicle_id,
          audit_device_id,
          telemetry: telemetry()
        })
        .expect(200)
        .end((err, result) => {
          expect(result.header).toHaveProperty('content-type', APP_JSON)
          expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
          expect(result).toHaveProperty('body')
          expect(result.body).toHaveProperty('provider_device')
          expect(result.body.provider_device).toHaveProperty('vehicle_id')
          expect(result.body.provider_device.vehicle_id).toStrictEqual(provider_vehicle_id)
          done(err)
        })
    })
  )
  describe('Tests retreiving vehicles', () => {
    let devices_a: DeviceDomainModel[] // Have events and telemetry outside our BBOX
    let devices_b: DeviceDomainModel[] // Have events and telemetry inside our BBOX
    let devices_c: DeviceDomainModel[] // No events or telemetry
    beforeAll(done => {
      devices_a = makeDevices(10, now(), JEST_PROVIDER_ID)
      const events_a = makeEventsWithTelemetry(devices_a, now(), SAN_FERNANDO_VALLEY, {
        event_types: ['trip_start'],
        vehicle_state: 'on_trip',
        speed: rangeRandomInt(10)
      })
      const telemetry_a = devices_a.map(device =>
        makeTelemetryInArea(device, now(), SAN_FERNANDO_VALLEY, rangeRandomInt(10))
      )
      devices_b = makeDevices(10, now(), JEST_PROVIDER_ID)
      const events_b = makeEventsWithTelemetry(devices_b, now(), CANALS, {
        event_types: ['trip_start'],
        vehicle_state: 'on_trip',
        speed: rangeRandomInt(10)
      })
      const telemetry_b = devices_b.map(device => makeTelemetryInArea(device, now(), CANALS, rangeRandomInt(10)))
      devices_c = makeDevices(10, now(), JEST_PROVIDER_ID)

      const seedData = {
        // Include a duplicate device (same vin + provider but different device_id)
        devices: [
          ...devices_a,
          ...devices_b,
          ...devices_c,
          { ...(devices_c[0] as DeviceDomainModel), ...{ device_id: uuid() } }
        ] as DeviceDomainModel[],
        events: [...events_a, ...events_b],
        telemetry: [...telemetry_a, ...telemetry_b]
      }
      Promise.all([db.reinitialize(), cache.reinitialize()]).then(() => {
        Promise.all([cache.seed(seedData), db.seed(seedData)]).then(() => {
          done()
        })
      })
    })

    it('Verify getting vehicles inside of a bounding box', done => {
      const bbox = [
        [-118.484776, 33.996855],
        [-118.452283, 33.96299]
      ] // BBOX encompasses the entirity of CANALS
      request
        .get(pathPrefix(`/vehicles?bbox=${JSON.stringify(bbox)}`))
        .set('Authorization', SCOPED_AUTH(['audits:vehicles:read'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.header).toHaveProperty('content-type', APP_JSON)
          expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
          expect(result.body.vehicles.length === 10).toBeTruthy()
          result.body.vehicles.forEach(
            (device: DeviceDomainModel & { updated?: Timestamp | null; telemetry: Telemetry }) => {
              expect(typeof device.telemetry.gps.lat === 'number').toBeTruthy()
              expect(typeof device.telemetry.gps.lng === 'number').toBeTruthy()
              expect(typeof device.updated === 'number').toBeTruthy()
            }
          )
          done(err)
        })
    })

    it('Verify get vehicle by vehicle_id and provider_id', done => {
      request
        .get(pathPrefix(`/vehicles/${devices_a[0]?.provider_id}/vin/${devices_a[0]?.vehicle_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:vehicles:read'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.header).toHaveProperty('content-type', APP_JSON)
          expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
          expect(result).toHaveProperty('body')
          expect(result.body).toHaveProperty('vehicles')
          expect(result.body.vehicles[0].provider_id).toStrictEqual(devices_a[0]?.provider_id)
          expect(result.body.vehicles[0].vehicle_id).toStrictEqual(devices_a[0]?.vehicle_id)
          expect(result.body.vehicles[0].updated).toStrictEqual(result.body.vehicles[0].timestamp)
          expect(result.body.vehicles[0].vehicle_state).toStrictEqual('on_trip')
          expect(result.body.vehicles[0].telemetry.charge > 0).toStrictEqual(true)
          done(err)
        })
    })

    it('Verify get vehicle by vehicle_id and provider_id (not found)', done => {
      request
        .get(pathPrefix(`/vehicles/${uuid()}/vin/${devices_a[0]?.vehicle_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:vehicles:read'], audit_subject_id))
        .expect(404)
        .end((err, result) => {
          expect(result.header).toHaveProperty('content-type', APP_JSON)
          done(err)
        })
    })

    it('Verify get vehicle by vehicle_id and provider_id (no event or telemetry)', done => {
      request
        .get(pathPrefix(`/vehicles/${devices_c[0]?.provider_id}/vin/${devices_c[0]?.vehicle_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:vehicles:read'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.body.vehicles[0].provider_id).toStrictEqual(devices_c[0]?.provider_id)
          expect(result.body.vehicles[0].vehicle_id).toStrictEqual(devices_c[0]?.vehicle_id)
          expect(result.body.vehicles[0]).not.toHaveProperty('vehicle_state')
          done(err)
        })
    })

    it('Verify get vehicle by vehicle_id and provider_id (duplicate device)', done => {
      request
        .get(pathPrefix(`/vehicles/${devices_c[0]?.provider_id}/vin/${devices_c[0]?.vehicle_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:vehicles:read'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.header).toHaveProperty('content-type', APP_JSON)
          expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
          expect(result).toHaveProperty('body')
          expect(result.body).toHaveProperty('vehicles')
          expect(result.body.vehicles[0].provider_id).toStrictEqual(devices_c[0]?.provider_id)
          expect(result.body.vehicles[0].vehicle_id).toStrictEqual(devices_c[0]?.vehicle_id)
          expect(result.body.vehicles[0].device_id).not.toStrictEqual(devices_c[0]?.device_id)
          done(err)
        })
    })
  })
  const attachment_id = uuid()
  const baseUrl = 'http://example.com/'
  describe('Tests for attachments', () => {
    beforeAll(done => {
      const audit = {
        audit_trip_id,
        audit_device_id,
        audit_subject_id,
        provider_id,
        provider_name: 'test',
        provider_vehicle_id,
        provider_device_id,
        timestamp: AUDIT_START,
        recorded: AUDIT_START
      } as Audit
      const attachment = {
        attachment_id,
        attachment_filename: `${attachment_id}.jpg`,
        base_url: baseUrl,
        mimetype: 'image/jpeg',
        thumbnail_filename: `${attachment_id}.thumbnail.jpg`,
        attachment_mimetype: 'image/jpeg',
        recorded: AUDIT_START
      } as Attachment
      const auditAttachment = {
        attachment_id,
        audit_trip_id,
        recorded: AUDIT_START
      } as AuditAttachment
      Promise.all([db.reinitialize(), cache.reinitialize()]).then(async () => {
        await db.writeDevice({
          accessibility_options: [],
          device_id: provider_device_id,
          modality: 'micromobility',
          provider_id,
          vehicle_id: provider_vehicle_id,
          propulsion_types: ['electric'],
          vehicle_type: 'scooter',
          year: null,
          mfgr: null,
          model: null,
          recorded: AUDIT_START
        })
        await db.writeAudit(audit)
        await db.writeAttachment(attachment)
        await db.writeAuditAttachment(auditAttachment)
        done()
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('verify get audit by id with attachments', done => {
      request
        .get(pathPrefix(`/trips/${audit_trip_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:read'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.body.attachments[0].attachment_id).toStrictEqual(attachment_id)
          expect(result.body.attachments[0].attachment_url).toStrictEqual(`http://example.com/${attachment_id}.jpg`)
          expect(result.body.attachments[0].thumbnail_url).toStrictEqual(
            `http://example.com/${attachment_id}.thumbnail.jpg`
          )
          done(err)
        })
    })

    it('verify get trips with attachments', done => {
      request
        .get(pathPrefix('/trips'))
        .set('Authorization', SCOPED_AUTH(['audits:read'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.body.audits[0].attachments[0].attachment_id).toStrictEqual(attachment_id)
          expect(result.body.audits[0].attachments[0].attachment_url).toStrictEqual(
            `http://example.com/${attachment_id}.jpg`
          )
          expect(result.body.audits[0].attachments[0].thumbnail_url).toStrictEqual(
            `http://example.com/${attachment_id}.thumbnail.jpg`
          )
          done(err)
        })
    })

    it('verify provider can get own trips', done => {
      request
        .get(pathPrefix('/trips'))
        .set('Authorization', SCOPED_AUTH(['audits:read:provider'], provider_id))
        .expect(200)
        .end((err, result) => {
          /* Expect a 200 response with the audit records for that provider returned (only 1 in this case) */
          expect(result.body.audits[0].attachments[0].attachment_id).toStrictEqual(attachment_id)
          expect(result.body.audits[0].attachments[0].attachment_url).toStrictEqual(
            `http://example.com/${attachment_id}.jpg`
          )
          expect(result.body.audits[0].attachments[0].thumbnail_url).toStrictEqual(
            `http://example.com/${attachment_id}.thumbnail.jpg`
          )
          done(err)
        })
    })

    it("verify provider cannot get others' trips", done => {
      request
        .get(pathPrefix('/trips'))
        .set('Authorization', SCOPED_AUTH(['audits:read:provider'], uuid())) // Generate arbitrary provider_id
        .expect(200)
        .end((err, result) => {
          /* Expect a 200 response with no audits returned */
          expect(result.body.audits).toStrictEqual([])
          done(err)
        })
    })

    it('verify post attachment (audit not found)', done => {
      request
        .post(pathPrefix(`/trips/${uuid()}/attach/image%2Fpng`))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .send({}) // TODO: include file
        .expect(404)
        .end((err, result) => {
          expect(result.body.error.name).toStrictEqual('NotFoundError')
          expect(result.body.error.reason).toStrictEqual('audit not found')
          done(err)
        })
    })

    const attachmentTests = [
      {
        name: 'no file',
        file: 'empty.png',
        status: 400,
        errName: 'ValidationError',
        errReason: 'No attachment found'
      },
      {
        name: 'missing extension',
        file: 'samplepng',
        status: 400,
        errName: 'ValidationError',
        errReason: `Missing file extension in filename samplepng`
      },
      {
        name: 'unsupported mimetype',
        file: 'sample.gif',
        status: 415,
        errName: 'UnsupportedTypeError',
        errReason: `Unsupported mime type image/gif`
      }
    ]

    attachmentTests.forEach(testCase =>
      it(`verify post bad attachment (${testCase.name})`, done => {
        jest.spyOn(AttachmentServiceClient, 'writeAttachment').mockRejectedValue(
          ServiceError({
            type: testCase.errName,
            message: 'Error Writing Attachment',
            details: testCase.errReason
          }).error
        )
        request
          .post(pathPrefix(`/trips/${audit_trip_id}/attach/image%2Fpng`))
          .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
          .attach('file', `./tests/${testCase.file}`)
          .expect(testCase.status)
          .end((err, result) => {
            expect(result.body.error.type).toStrictEqual(testCase.errName)
            expect(result.body.error.details).toStrictEqual(testCase.errReason)
            done(err)
          })
      })
    )

    it('verify audit attach (success)', done => {
      // const fake = Sinon.fake.returns()
      jest.spyOn(attachments, 'writeAttachment').mockImplementation(
        async () =>
          ({
            audit_trip_id,
            attachment_id,
            recorded: AUDIT_START,
            attachment_filename: `${attachment_id}.jpg`,
            base_url: baseUrl,
            mimetype: 'image/jpeg'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
      )
      request
        .post(pathPrefix(`/trips/${audit_trip_id}/attach/image%2Fpng`))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .attach('file', `./tests/sample.png`)
        .expect(200)
        .end((err, result) => {
          expect(result.body.attachment_id).toStrictEqual(attachment_id)
          expect(result.body.attachment_url).toStrictEqual(`${baseUrl + attachment_id}.jpg`)
          expect(result.body.thumbnail_url).toStrictEqual('')
          done(err)
        })
    })

    it('verify audit attach (error)', done => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(attachments, 'writeAttachment').mockImplementation(async () => null as any)
      request
        .post(pathPrefix(`/trips/${audit_trip_id}/attach/image%2Fpng`))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .attach('file', `./tests/sample.png`)
        .expect(500)
        .end((err, result) => {
          expect(result.body.error.name).toStrictEqual('ServerError')
          done(err)
        })
    })

    it('verify audit delete (success)', done => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(attachments, 'deleteAuditAttachment').mockImplementation(async () => null as any)
      request
        .delete(pathPrefix(`/trips/${audit_trip_id}/attachment/${attachment_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .expect(200)
        .end((err, result) => {
          expect(result.body.version).toStrictEqual(AUDIT_API_DEFAULT_VERSION)
          done(err)
        })
    })

    it('verify audit delete (not found)', done => {
      jest.spyOn(attachments, 'deleteAuditAttachment').mockRejectedValue(new NotFoundError())
      request
        .delete(pathPrefix(`/trips/${audit_trip_id}/attachment/${attachment_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .expect(404)
        .end((err, result) => {
          expect(result.body.error.name).toStrictEqual('NotFoundError')
          done(err)
        })
    })

    it('verify audit delete (error)', done => {
      jest.spyOn(attachments, 'deleteAuditAttachment').mockRejectedValue(new Error())
      request
        .delete(pathPrefix(`/trips/${audit_trip_id}/attachment/${attachment_id}`))
        .set('Authorization', SCOPED_AUTH(['audits:write'], audit_subject_id))
        .expect(500)
        .end((err, result) => {
          expect(result.body.error.name).toStrictEqual('ServerError')
          done(err)
        })
    })
  })
})

afterAll(async () => {
  await Promise.all([db.shutdown(), cache.shutdown()])
})

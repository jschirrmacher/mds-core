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

import type { DeviceDomainModel } from '@mds-core/mds-ingest-service'
import type {
  MODALITY,
  PROPULSION_TYPE,
  Telemetry,
  Timestamp,
  UUID,
  VehicleEvent,
  VEHICLE_EVENT,
  VEHICLE_STATE
} from '@mds-core/mds-types'
import {
  addDistanceBearing,
  hasAtLeastOneEntry,
  makePointInShape,
  now,
  pointInShape,
  range,
  rangeRandom,
  rangeRandomInt,
  uuid
} from '@mds-core/mds-utils'
import type { Geometry } from 'geojson'
import { DISTRICT_SEVEN } from './test-areas/district-seven'
import { LA_CITY_BOUNDARY } from './test-areas/la-city-boundary'
import { restrictedAreas, serviceAreaMap, venice, veniceSpecOps } from './test-areas/test-areas'

const JUMP_PROVIDER_ID = 'c20e08cf-8488-46a6-a66c-5d8fb827f7e0'
const LIME_PROVIDER_ID = '63f13c48-34ff-49d2-aca7-cf6a5b6171c3'
const BIRD_PROVIDER_ID = '2411d395-04f2-47c9-ab66-d09e9e3c3251'

const TEST1_PROVIDER_ID = '5f7114d1-4091-46ee-b492-e55875f7de00'
const TEST2_PROVIDER_ID = '45f37d69-73ca-4ca6-a461-e7283cffa01a'

const PROVIDER_SCOPES = 'admin:all'

// for test purposes
const PROVIDER_AUTH =
  'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlFVWkJRVFUwT0RJNE9EbERRakl3TWpJeE0wVkZNamhHTmtaRFFUa3lSRGRGTmtSRFF6RkZOUSJ9.eyJodHRwczovL2xhZG90LmlvL3Byb3ZpZGVyX2lkIjoiNWY3MTE0ZDEtNDA5MS00NmVlLWI0OTItZTU1ODc1ZjdkZTAwIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmxhZG90LmlvLyIsInN1YiI6IjE4UmN1QVJLQzVSUHQ5ZmFON0VRNXdjRTVvUmNlbzB0QGNsaWVudHMiLCJhdWQiOiJodHRwczovL3NhbmRib3gubGFkb3QuaW8iLCJpYXQiOjE1NTMzMTAyNDYsImV4cCI6MTU1NDM5MDI0NiwiYXpwIjoiMThSY3VBUktDNVJQdDlmYU43RVE1d2NFNW9SY2VvMHQiLCJzY29wZSI6ImFkbWluOmFsbCB0ZXN0OmFsbCIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.NNTJpeVAvbyslzK0PLrDkPs6_rGQ7tZwVl00QlNiDPUPuMzlCcMWTCOei0Jwm9_21KXAsGo6iko1oYgutrMPjvnePCDFbs3h2iGX8Wiw4rx0FrOijNJV6GWXSW33okagoABo0b63mLnGpfZYRNVjAbMEcJ5GrAWbEvZZeSIL6Mjl6YYn527mU4eWyqRMwTDtJ0s8iYaT2fj3VyOYZcUy0wCeQ3otK2ikkW4jyFgL60-Bb0U6IVh1rHPlS4pZa-wDzg1Pjk9I0RaBWDJQzpTd7OsEMwq-4qMqi9xrzQ6f52Sdl3JbKcQ0EzKK4GHGdILRiUfIpfZLEnNBOH9iAsOswQ'

const COMPLIANCE_AUTH =
  'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgubGFkb3QuaW8vIiwic3ViIjoiMThSY3VBUktDNVJQdDlmYU43RVE1d2NFNW9SY2VvMHRAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vc2FuZGJveC5sYWRvdC5pbyIsImlhdCI6MTU1MzMxMDI0NiwiZXhwIjoxNTU0MzkwMjQ2LCJhenAiOiIxOFJjdUFSS0M1UlB0OWZhTjdFUTV3Y0U1b1JjZW8wdCIsInNjb3BlIjoiYWRtaW46YWxsIHRlc3Q6YWxsIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.a17IoARIRcGD1f3RIwRbw8KYIFN6IcF70DWrGkzKUNY'

const BAD_PROVIDER_UUID = '5f7114d1-4091-46ee-b492-e55875f7de99'

const JUMP_TEST_DEVICE_1: DeviceDomainModel = {
  accessibility_options: [],
  provider_id: JUMP_PROVIDER_ID,
  device_id: 'e9edbe74-f7be-48e0-a63a-92f4bc1af5ed',
  vehicle_id: '1230987',
  vehicle_type: 'scooter',
  propulsion_types: ['electric'],
  year: 2018,
  mfgr: 'Schwinn',
  modality: 'micromobility',
  model: 'whoknows',
  recorded: now()
}

function makeTelemetry(devices: DeviceDomainModel[], timestamp: Timestamp): [Telemetry, ...Telemetry[]] {
  let i = 0
  const serviceAreaKeys = Object.keys(serviceAreaMap)

  const num_areas = 1
  type ClusterInfo = {
    [key: string]: { num_clusters: number; cluster_radii: number[]; cluster_centers: { lat: number; lng: number }[] }
  }
  const cluster_info: ClusterInfo = {}

  serviceAreaKeys.slice(0, 1).map(key => {
    const serviceArea = serviceAreaMap[key]
    const serviceAreaMultipoly = serviceArea?.area

    if (!serviceAreaMultipoly) {
      throw new Error('service area not found')
    }

    const num_clusters = rangeRandomInt(5, 15)

    cluster_info[key] = {
      num_clusters, // number of clusters
      cluster_radii: [], // meters
      cluster_centers: [] // to be filled in
    }

    for (let j = 0; j < num_clusters; j++) {
      // make centers-of-gravity
      ;(cluster_info[key] as ClusterInfo[string]).cluster_radii.push(rangeRandom(100, 1000)) // type assertion is OKAY because we ensure this exists above
      const center = makePointInShape(serviceAreaMultipoly)
      if (!pointInShape(center, serviceAreaMultipoly)) {
        throw new Error('bad center is not in multipoly (1)')
      }
      ;(cluster_info[key] as ClusterInfo[string]).cluster_centers.push(center) // type assertion is OKAY because we ensure this exists above
    }
  })

  const telemetries = devices.map(device => {
    // make a rando telemetry for that vehicle, in one of the areas
    const key = serviceAreaKeys[i++ % num_areas] as string
    const serviceArea = serviceAreaMap[key]
    const service_area_multipoly = serviceArea?.area

    if (!service_area_multipoly) {
      throw new Error('service area not found')
    }
    // pick a cluster
    const cluster = cluster_info[key]
    if (!cluster) {
      throw new Error('cluster not found')
    }
    const { num_clusters } = cluster
    const cluster_num = rangeRandomInt(num_clusters)
    // get the center and radius of the cluster, then put a vehicle in there
    let point
    let tries = 0
    for (;;) {
      const center = cluster.cluster_centers[cluster_num]
      if (!center || !pointInShape(center, service_area_multipoly)) {
        throw new Error('bad center is not in multipoly (2)')
      }
      const radius = cluster.cluster_radii[cluster_num]
      if (!radius) {
        throw new Error('bad radius')
      }
      const angle = rangeRandomInt(360)
      point = addDistanceBearing(center, rangeRandom(0, radius), angle)
      if (pointInShape(point, service_area_multipoly)) {
        break
      }
      if (tries++ > 100) {
        throw new Error('unable to create point in polygon after 100 tries')
      }
    }
    return {
      device_id: device.device_id,
      provider_id: device.provider_id,
      gps: {
        lat: point.lat,
        lng: point.lng,
        speed: rangeRandomInt(0, 10),
        hdop: rangeRandomInt(0, 5),
        heading: rangeRandomInt(0, 360)
      },
      charge: rangeRandom(0.1, 0.9),
      timestamp,
      recorded: now()
    }
  })

  if (!hasAtLeastOneEntry(telemetries)) {
    throw new Error('No telemetries were generated. Did you forget to pass in a list of devices?')
  }

  return telemetries
}

function makeTelemetryInShape(device: DeviceDomainModel, timestamp: number, shape: Geometry, speed: number) {
  const point = makePointInShape(shape)
  return {
    device_id: device.device_id,
    provider_id: device.provider_id,
    gps: {
      lat: point.lat,
      lng: point.lng,
      speed,
      hdop: rangeRandomInt(0, 5),
      heading: rangeRandomInt(0, 360)
    },
    charge: rangeRandom(0.1, 0.9),
    timestamp,
    recorded: timestamp
  }
}

function makeTelemetryInArea(device: DeviceDomainModel, timestamp: Timestamp, area: UUID | Geometry, speed: number) {
  if (typeof area === 'string') {
    const serviceArea = serviceAreaMap[area]
    if (!serviceArea) {
      throw new Error('service area not found')
    }
    return makeTelemetryInShape(device, timestamp, serviceArea.area, speed)
  }
  return makeTelemetryInShape(device, timestamp, area, speed)
}

function makeTelemetryStream(origin: Telemetry, steps: number) {
  if (!origin.provider_id) {
    throw new Error('makeTelemetryStream requires non-null provider_id')
  }
  if (typeof origin.gps !== 'object') {
    throw new Error(`invalid origin gps ${origin.gps}`)
  }
  if (typeof origin.gps.heading !== 'number' || origin.gps.heading === null || origin.gps.heading === undefined) {
    throw new Error(`invalid origin heading "${origin.gps.heading}"`)
  }

  const stream: Telemetry[] = []
  let t = { ...origin } as Telemetry & { gps: { heading: number } }
  Object.assign(t.gps, origin.gps)
  range(steps).map(() => {
    t = { ...t }
    // move 50m in whatever the bearing is
    t.gps = addDistanceBearing(t.gps, 50, t.gps.heading)
    // turn 5º
    t.gps.heading += 5
    t.timestamp += 5000 // 5 sec
    stream.push(t)
  })
  return stream
}

function makeEventsWithTelemetry(
  devices: DeviceDomainModel[],
  timestamp: Timestamp,
  area: UUID | Geometry,
  makeEventsWithTelemetryOptions: {
    event_types: VEHICLE_EVENT[]
    vehicle_state: VEHICLE_STATE
    speed: number
    trip_id?: UUID
  } = {
    event_types: ['trip_start'],
    vehicle_state: 'on_trip',
    speed: rangeRandomInt(10)
  }
): VehicleEvent[] {
  const { event_types, vehicle_state, speed, trip_id } = makeEventsWithTelemetryOptions

  return devices.map(device => {
    const telemetry = makeTelemetryInArea(device, timestamp, area, speed)
    return {
      device_id: device.device_id,
      provider_id: device.provider_id,
      event_types,
      vehicle_state,
      trip_state: null,
      telemetry,
      telemetry_timestamp: telemetry.timestamp,
      timestamp,
      recorded: timestamp,
      trip_id
    }
  })
}

function makeDevices(
  count: number,
  timestamp: Timestamp,
  provider_id = TEST1_PROVIDER_ID
): [DeviceDomainModel, ...DeviceDomainModel[]] {
  // make N devices, distributed across the regions
  const devices = []
  if (count === 0) {
    throw new Error('makeDevices requires a non-zero count')
  }
  for (let i = 0; i < count; i += 1) {
    // make a rando vehicle
    const device_id = uuid()
    const coin = rangeRandomInt(2)
    let vehicle_type
    let propulsion_types: PROPULSION_TYPE[]
    switch (provider_id) {
      case LIME_PROVIDER_ID:
      case JUMP_PROVIDER_ID:
        vehicle_type = ['bicycle', 'scooter'][coin]
        if (vehicle_type === 'bicycle') {
          propulsion_types = [['human', 'electric'], ['human']][coin] as PROPULSION_TYPE[]
        } else {
          propulsion_types = ['electric']
        }
        break
      case BIRD_PROVIDER_ID:
        vehicle_type = 'scooter'
        propulsion_types = ['electric']
        break
      default:
        vehicle_type = 'bicycle'
        propulsion_types = ['human']
        break
    }
    let mfgr
    let model
    const year = rangeRandomInt(2016, 2020)
    switch (vehicle_type) {
      case 'scooter':
        mfgr = 'Xiaomi'
        model = 'M365'
        break
      case 'bicycle':
        mfgr = 'Schwinn'
        model = 'Mantaray'
        break
      default:
        throw new Error(`unknown type: ${vehicle_type}`)
    }
    const device = {
      accessibility_options: [],
      device_id,
      provider_id,
      vehicle_id: `test-vin-${Math.round(Math.random() * 1000000)}`,
      vehicle_type,
      propulsion_types,
      year,
      mfgr,
      modality: 'micromobility' as MODALITY,
      model,
      timestamp,
      recorded: now()
    }
    devices.push(device)
  }

  if (!hasAtLeastOneEntry(devices)) {
    throw new Error('No devices were generated. Did you forget to pass in a non-zero count?')
  }
  return devices
}

const SCOPED_AUTH = <AccessTokenScope extends string>(scopes: AccessTokenScope[], principalId = TEST1_PROVIDER_ID) =>
  `basic ${Buffer.from(`${principalId}|${scopes.join(' ')}`).toString('base64')}`

export const GEOGRAPHY_UUID = '1f943d59-ccc9-4d91-b6e2-0c5e771cbc49'
export const GEOGRAPHY2_UUID = '722b99ca-65c2-4ed6-9be1-056c394fadbf'
export const POLICY_UUID = '72971a3d-876c-41ea-8e48-c9bb965bbbcc'

export {
  BAD_PROVIDER_UUID,
  PROVIDER_AUTH,
  COMPLIANCE_AUTH,
  TEST1_PROVIDER_ID,
  TEST2_PROVIDER_ID,
  JUMP_TEST_DEVICE_1,
  JUMP_PROVIDER_ID,
  LIME_PROVIDER_ID,
  BIRD_PROVIDER_ID,
  PROVIDER_SCOPES,
  LA_CITY_BOUNDARY,
  DISTRICT_SEVEN,
  makeDevices,
  makeEventsWithTelemetry,
  makeTelemetry,
  makeTelemetryInArea,
  makeTelemetryInShape,
  makeTelemetryStream,
  SCOPED_AUTH,
  serviceAreaMap,
  restrictedAreas,
  veniceSpecOps,
  venice
}

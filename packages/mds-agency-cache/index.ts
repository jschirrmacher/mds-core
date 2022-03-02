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

import { RedisCache } from '@mds-core/mds-cache'
import { BoundingBox, Device, Telemetry, Timestamp, UUID, VehicleEvent } from '@mds-core/mds-types'
import {
  filterDefined,
  isInsideBoundingBox,
  NotFoundError,
  now,
  nullKeys,
  routeDistance,
  setEmptyArraysToUndefined,
  stripNulls,
  tail
} from '@mds-core/mds-utils'
import flatten, { unflatten } from 'flat'
import Redis from 'ioredis'
import { AgencyCacheLogger } from './logger'
import {
  CachedItem,
  CacheReadDeviceResult,
  StringifiedCacheReadDeviceResult,
  StringifiedEventWithTelemetry,
  StringifiedTelemetry
} from './types'
import { parseCachedItem, parseDevice, parseEvent, parseTelemetry } from './unflatteners'

const { env } = process

const client = RedisCache()

// optionally prefix a 'tenantId' key given the redis is a shared service across deployments
function decorateKey(key: string): string {
  return env.TENANT_ID ? `${env.TENANT_ID}:${key}` : key
}

async function info() {
  const results = await client.info()
  const lines = results.split('\r\n')
  const data: { [propName: string]: string | number } = {}
  lines.map(line => {
    const [key, val] = line.split(':')
    if (key !== undefined && val !== undefined) {
      if (Number.isNaN(Number(val))) {
        data[key] = val
      } else {
        data[key] = parseFloat(val)
      }
    }
  })
  return data
}

// update the ordered list of (device_id, timestamp) tuples
// so that we can trivially get a list of "updated since ___" device_ids
function updateVehicleList(device_id: UUID, pipeline: Redis.Pipeline, timestamp?: Timestamp) {
  const when = timestamp || now()
  pipeline.zadd(decorateKey('device-ids'), when.toString(), device_id)
}
async function hread(suffix: string, device_id: UUID): Promise<CachedItem> {
  if (!device_id) {
    throw new Error(`hread: tried to read ${suffix} for device_id ${device_id}`)
  }
  const key = decorateKey(`device:${device_id}:${suffix}`)
  const flat = await client.hgetall(key)
  if (Object.keys(flat).length !== 0) {
    return unflatten({ ...flat, device_id })
  }
  throw new NotFoundError(`${suffix} for ${device_id} not found`)
}

/* Store latest known lat/lng for a given device in a redis geo-spatial analysis compatible manner. */
function addGeospatialHash(device_id: UUID, coordinates: [number, number], pipeline: Redis.Pipeline) {
  const [lat, lng] = coordinates
  pipeline.geoadd(decorateKey('locations'), lng, lat, device_id)
}

async function getEventsInBBox(bbox: BoundingBox) {
  const start = now()
  const [pt1, pt2] = bbox
  const points = bbox.map(pt => {
    return { lat: pt[0], lng: pt[1] }
  })
  const [lng, lat] = [(pt1[0] + pt2[0]) / 2, (pt1[1] + pt2[1]) / 2]
  const radius: number = routeDistance(points)
  const events: string[] = await client.georadius(decorateKey('locations'), lng, lat, radius, 'm')
  const finish: Timestamp = now()
  const timeElapsed = finish - start
  AgencyCacheLogger.debug(`getEventsInBBox ${JSON.stringify(bbox)} time elapsed: ${timeElapsed}ms`)
  return events
}

async function hreads(
  suffixes: string[],
  ids: UUID[],
  prefix: 'device' | 'provider' = 'device'
): Promise<CachedItem[]> {
  if (suffixes === undefined) {
    throw new Error('hreads: no suffixes')
  }
  if (ids === undefined) {
    throw new Error('hreads: no ids')
  }

  const multi = suffixes
    .map(suffix => ids.map(id => decorateKey(`${prefix}:${id}:${suffix}`)))
    .flat()
    .reduce((pipeline, key) => {
      return pipeline.hgetall(key)
    }, await client.multi())

  const replies = (await multi.exec()).map(([_, result]) => result)

  return replies.map((flat, index) =>
    Object.keys(flat).length > 0 ? unflatten({ ...flat, [`${prefix}_id`]: ids[index % ids.length] }) : unflatten(null)
  )
}

// anything with a device_id, e.g. device, telemetry, etc.
function hwrite(suffix: string, item: CacheReadDeviceResult | Telemetry | VehicleEvent, pipeline: Redis.Pipeline) {
  if (typeof item.device_id !== 'string') {
    AgencyCacheLogger.error(`hwrite: invalid device_id ${item.device_id}`)
    throw new Error(`hwrite: invalid device_id ${item.device_id}`)
  }
  const { device_id } = item
  const key = decorateKey(`device:${device_id}:${suffix}`)
  const flat: { [key: string]: unknown } = setEmptyArraysToUndefined(flatten(item))
  const nulls = nullKeys(flat)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hmap = stripNulls(flat) as { [key: string]: any; device_id?: UUID }
  delete hmap.device_id

  if (nulls.length > 0) {
    // redis doesn't store null keys, so we have to delete them
    // TODO unit-test
    pipeline.hdel(key, ...nulls)
  }

  const keys = suffix === 'event' ? [decorateKey(`provider:${item.provider_id}:latest_event`), key] : [key]

  keys.forEach(k => pipeline.hset(k, hmap))

  updateVehicleList(device_id, pipeline)
}

async function writeDevices(devices: Device[]) {
  const pipeline = await client.multi()
  devices.forEach(d => writeDevice(d, pipeline))
  await pipeline.exec()
}

// put basics of device in the cache
function writeDevice(device: Device, pipeline: Redis.Pipeline) {
  try {
    if (!device) {
      throw new Error('null device not legal to write')
    }

    return hwrite('device', device, pipeline)
  } catch (error) {
    AgencyCacheLogger.error('Failed to write device to cache', { error })
    throw error
  }
}

async function readKeys(pattern: string) {
  return client.keys(decorateKey(pattern))
}

async function wipeDevices(device_ids: UUID[]) {
  const pipeline = await client.multi()
  device_ids.forEach(d => wipeDevice(d, pipeline))
  await pipeline.exec()
}

function wipeDevice(device_id: UUID, pipeline: Redis.Pipeline) {
  const keys = [
    decorateKey(`device:${device_id}:event`),
    decorateKey(`device:${device_id}:telemetry`),
    decorateKey(`device:${device_id}:device`)
  ]
  if (keys.length > 0) {
    AgencyCacheLogger.debug(':wipeDevice, deleting keys', { keys })
    pipeline.del(...keys)
    return
  }
  AgencyCacheLogger.warn('wipeDevice, no keys found!', { device_id })
}

async function writeEvents(events: VehicleEvent[]) {
  const pipeline = await client.multi()
  const prevEvents = await readEvents(events.map(({ device_id }) => device_id))
  const deviceEventMap = new Map(prevEvents.map(e => [e.device_id, e]))
  events.forEach(e => writeEvent(e, pipeline, deviceEventMap.get(e.device_id)))
  await pipeline.exec()
}

function writeEvent(event: VehicleEvent, pipeline: Redis.Pipeline, prevEvent?: VehicleEvent) {
  try {
    if (tail(event.event_types) === 'decommissioned') {
      wipeDevice(event.device_id, pipeline)
      return
    }

    /* if there's no previous event, or that event is earlier, write a new to the cache */
    if (!prevEvent || prevEvent.timestamp < event.timestamp) {
      try {
        if (event.telemetry) {
          const { lat, lng } = event.telemetry.gps
          addGeospatialHash(event.device_id, [lat, lng], pipeline)
        }
        hwrite('event', event, pipeline)
      } catch (error) {
        AgencyCacheLogger.error('hwrites', { error })
        throw error
      }
    } else {
      return null
    }
  } catch (_) {
    try {
      if (event.telemetry) {
        const { lat, lng } = event.telemetry.gps
        addGeospatialHash(event.device_id, [lat, lng], pipeline)
      }
      hwrite('event', event, pipeline)
    } catch (error) {
      AgencyCacheLogger.error('hwrites', { error })
      throw error
    }
  }
}

async function readEvent(device_id: UUID): Promise<VehicleEvent> {
  const rawEvent = await hread('event', device_id)
  const event = parseEvent(rawEvent as StringifiedEventWithTelemetry)
  return event
}

async function readEvents(device_ids: UUID[]): Promise<VehicleEvent[]> {
  const events = await hreads(['event'], device_ids)
  return events
    .map(e => {
      return parseEvent(e as StringifiedEventWithTelemetry)
    })
    .filter(e => Boolean(e))
}

async function readDevice(device_id: UUID) {
  if (!device_id) {
    throw new Error('null device not legal to read')
  }
  const rawDevice = await hread('device', device_id)
  const device = parseDevice(rawDevice as StringifiedCacheReadDeviceResult)
  return device
}

async function readDevices(device_ids: UUID[]) {
  return ((await hreads(['device'], device_ids)) as StringifiedCacheReadDeviceResult[]).map(device => {
    return parseDevice(device)
  })
}

async function readDeviceStatus(device_id: UUID) {
  // Read event and device in parallel, catching NotFoundErrors
  const promises = [readEvent(device_id), readDevice(device_id)].map((p: Promise<{}>) =>
    /* eslint-disable-next-line promise/prefer-await-to-callbacks */
    p.catch((err: Error) => {
      if (err.name !== 'NotFoundError') {
        throw err
      }
    })
  )
  try {
    const results = await Promise.all(promises)
    const deviceStatusMap: { [device_id: string]: CachedItem | {} } = {}
    results
      .filter((item): item is CachedItem => item !== undefined)
      .map(item => {
        deviceStatusMap[item.device_id] = deviceStatusMap[item.device_id] || {}
        Object.assign(deviceStatusMap[item.device_id], item)
      })
    const statuses = Object.values(deviceStatusMap)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return statuses.find((status: any) => status.telemetry) || statuses[0] || null
  } catch (error) {
    AgencyCacheLogger.error('Error reading device status', { error })
    throw error
  }
}

/* eslint-reason redis external lib weirdness */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable promise/catch-or-return */
async function readDevicesStatus(query: {
  since?: number
  skip?: number
  take?: number
  bbox: BoundingBox
  strict?: boolean
}) {
  const start = query.since || 0
  const stop = now()
  const strictChecking = query.strict

  const geoStart = now()
  const { bbox } = query
  const deviceIdsInBbox = await getEventsInBBox(bbox)
  const deviceIdsRes =
    deviceIdsInBbox.length === 0 ? await client.zrangebyscore(decorateKey('device-ids'), start, stop) : deviceIdsInBbox
  const skip = query.skip || 0
  const take = query.take || 100000000000
  const deviceIds = deviceIdsRes.slice(skip, skip + take)
  const geoFinish = now()
  const timeElapsed = geoFinish - geoStart
  AgencyCacheLogger.debug(`readDevicesStatus bbox fetch ${JSON.stringify(bbox)} time elapsed: ${timeElapsed}ms`)

  const eventsStart = now()
  const events = ((await hreads(['event'], deviceIds)) as StringifiedEventWithTelemetry[])
    .reduce((acc: VehicleEvent[], item: StringifiedEventWithTelemetry) => {
      try {
        const parsedItem = parseEvent(item)
        if (
          parsedItem.vehicle_state === 'removed' ||
          !parsedItem.telemetry ||
          (strictChecking && !isInsideBoundingBox(parsedItem.telemetry, query.bbox))
        )
          return acc
        return [...acc, parsedItem]
      } catch (err) {
        return acc
      }
    }, [])
    .filter(item => Boolean(item))
  const eventsFinish = now()
  const eventsTimeElapsed = eventsFinish - eventsStart
  AgencyCacheLogger.debug(`readDevicesStatus bbox check ${JSON.stringify(bbox)} time elapsed: ${eventsTimeElapsed}ms`)

  const devicesStart = now()
  const eventDeviceIds = events.map(event => event.device_id)
  const devices = (await hreads(['device'], eventDeviceIds))
    .reduce((acc: (Device | Telemetry | VehicleEvent)[], item: CachedItem) => {
      try {
        const parsedItem = parseCachedItem(item)
        return [...acc, parsedItem]
      } catch (err) {
        return acc
      }
    }, [])
    .filter(item => Boolean(item))
  const all = [...devices, ...events]
  const deviceStatusMap: { [device_id: string]: CachedItem | {} } = {}
  all.map(item => {
    deviceStatusMap[item.device_id] = deviceStatusMap[item.device_id] || {}
    Object.assign(deviceStatusMap[item.device_id], item)
  })
  const values = Object.values(deviceStatusMap)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valuesWithTelemetry = values.filter((item: any) => item.telemetry)
  const devicesFinish = now()
  const devicesTimeElapsed = devicesFinish - devicesStart
  AgencyCacheLogger.debug(
    `readDevicesStatus device processing ${JSON.stringify(bbox)} time elapsed: ${devicesTimeElapsed}ms`
  )

  return valuesWithTelemetry
}

async function readTelemetry(device_ids: UUID[]): Promise<Telemetry[]> {
  const results = (await hreads(['telemetry'], device_ids)) as StringifiedTelemetry[]
  return results.filter(r => r).map(parseTelemetry)
}

function writeOneTelemetry(
  telemetry: Telemetry,
  options: { quiet: boolean } = { quiet: false },
  pipeline: Redis.Pipeline,
  priorTelemetry?: Telemetry
) {
  const isNewerTelemetry = () => {
    try {
      if (!priorTelemetry) throw Error('missing prior telemetry')
      return telemetry.timestamp > priorTelemetry.timestamp
    } catch (error) {
      if (!options.quiet) {
        AgencyCacheLogger.info('writeOneTelemetry: no prior telemetry found:', { error })
      }
      // Cache miss; return true
      return true
    }
  }

  try {
    if (isNewerTelemetry()) {
      const { lat, lng } = telemetry.gps
      addGeospatialHash(telemetry.device_id, [lat, lng], pipeline)
      hwrite('telemetry', telemetry, pipeline)
    } else {
      return
    }
  } catch (error) {
    AgencyCacheLogger.error('writeOneTelemetry error', { error })
    throw error
  }
}

async function writeTelemetry(telemetries: Telemetry[], options: { quiet: boolean } = { quiet: false }) {
  try {
    const priorTelemetry = await readTelemetry(telemetries.map(({ device_id }) => device_id))
    const pipeline = await client.multi()
    const devicePriorTelemetryMap = new Map(priorTelemetry.map(t => [t.device_id, t]))

    telemetries.forEach(telemetry =>
      writeOneTelemetry(telemetry, options, pipeline, devicePriorTelemetryMap.get(telemetry.device_id))
    )

    await pipeline.exec()
  } catch (error) {
    AgencyCacheLogger.error('Failed to write telemetry to cache', { error })
    throw error
  }
}

async function readAllTelemetry() {
  // FIXME wildcard searching is slow
  const keys = await readKeys('device:*:telemetry')
  const device_ids = keys
    .map(key => {
      const [, device_id] = key.split(':')
      return device_id
    })
    .filter(filterDefined())
  return ((await hreads(['telemetry'], device_ids)) as StringifiedTelemetry[]).reduce((acc: Telemetry[], telemetry) => {
    try {
      return [...acc, parseTelemetry(telemetry)]
    } catch (error) {
      AgencyCacheLogger.error('readAllTelemetry error', { error })
      return acc
    }
  }, [])
}

async function seed(dataParam: { devices: Device[]; events: VehicleEvent[]; telemetry: Telemetry[] }) {
  AgencyCacheLogger.debug('cache seed')
  const data = dataParam || {
    devices: [],
    events: [],
    telemetry: []
  }

  await writeDevices(data.devices)
  await writeEvents(data.events)
  if (data.telemetry.length !== 0) {
    await writeTelemetry(data.telemetry.sort((a, b) => a.timestamp - b.timestamp))
  }
  AgencyCacheLogger.debug('cache seed redis done')
}

async function reset() {
  AgencyCacheLogger.warn('cache reset')
  await client.flushdb()
  return AgencyCacheLogger.warn('redis flushed')
}

async function reinitialize() {
  await client.initialize()
  await reset()
}

async function startup() {
  await client.initialize()
}

async function shutdown() {
  await client.shutdown()
}

async function health() {
  // FIXME
  return Promise.resolve('we good')
}

// remove stale keys, if any
// this was needed to clean up from failing to verify that a device was legit
async function cleanup() {
  try {
    const keys = await readKeys('device:*')
    AgencyCacheLogger.warn(`cleanup: read ${keys.length} keys`)
    const report: { telemetry: number; device: number; event: number; [suffix: string]: number } = {
      telemetry: 0,
      device: 0,
      event: 0
    }
    try {
      // look for bogus keys
      let badKeys: string[] = []
      keys.map(key => {
        const [, , suffix] = key.split(':')
        if (suffix) {
          badKeys.push(key)
          report[suffix] += 1
        }
      })
      // let's just purge a few as an experiment
      badKeys = badKeys.slice(0, 10000)
      const result = await client.del(...badKeys)
      // return a wee report
      report.deleted = result
      return report
    } catch (error) {
      AgencyCacheLogger.error('cleanup: exception', { error })
      throw error
    }
  } catch (error) {
    AgencyCacheLogger.error('cleanup: exception', { error })
    return Promise.reject(error)
  }
}

export default {
  reinitialize,
  health,
  info,
  seed,
  reset,
  startup,
  shutdown,
  writeDevices,
  writeEvents,
  writeTelemetry,
  readDevice,
  readDevices,
  readDeviceStatus,
  readDevicesStatus,
  readEvent,
  readEvents,
  readTelemetry,
  readAllTelemetry,
  readKeys,
  wipeDevices,
  cleanup
}

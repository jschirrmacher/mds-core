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

// utility functions
import type { BBox, BoundingBox, SingleOrArray, Telemetry, Timestamp, UUID } from '@mds-core/mds-types'
import circleToPolygon from 'circle-to-polygon'
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson'
import pointInPoly from 'point-in-polygon'
import { IndexError, RuntimeError } from './exceptions/exceptions'
import { hasOwnProperty } from './hasOwnProperty'
import { UtilsLogger } from './logger'
import { getNextStates, isEventSequenceValid } from './state-machine'

const RADIUS = 30.48 // 100 feet, in meters
const NUMBER_OF_EDGES = 32 // Number of edges to add, geojson doesn't support real circles
const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/

/* Is `as` a subset of `bs`? */
const isSubset = <T extends Array<string>, U extends Readonly<Array<string>>>(as: T, bs: U) => {
  return as.every(a => bs.includes(a))
}

function isUUID(s: unknown): s is UUID {
  if (typeof s !== 'string') {
    return false
  }
  return UUID_REGEX.test(s)
}

function round(value: string | number, decimals: number) {
  return Number(
    `${Math.round(Number(`${typeof value !== 'number' ? parseFloat(value) : value}e${decimals}`))}e-${decimals}`
  )
}

function isPct(val: unknown): val is number {
  if (typeof val !== 'number') {
    return false
  }
  return val >= 0 && val <= 1
}

// this is a real-time API, so timestamps should be now +/- some factor, let's start with 24h
function isTimestamp(val: unknown): val is Timestamp {
  if (typeof val !== 'number') {
    UtilsLogger.info('timestamp not an number')
    return false
  }
  if (val < 1420099200000) {
    UtilsLogger.info('timestamp is prior to 1/1/2015; this is almost certainly seconds, not milliseconds')
    return false
  }
  return true
}

function seconds(n: number) {
  if (typeof n !== 'number') {
    throw new Error('timespan must be a number')
  }
  return n * 1000
}

function minutes(n: number) {
  return seconds(n) * 60
}

function hours(n: number) {
  return minutes(n) * 60
}

function days(n: number) {
  return hours(n) * 24
}

const RULE_UNIT_MAP = {
  minutes: minutes(1),
  hours: hours(1)
}

// Based on a bin size (in ms), calculate the start/end of
// the frame containing the timestamp.
function timeframe(size: Timestamp, timestamp: Timestamp) {
  const start_time = timestamp - (timestamp % size)
  return { start_time, end_time: start_time + size - 1 }
}

/**
 * @param  {number} minimum
 * @param  {number} maximum
 * @return {number} random value in minimum...maximum
 */
function rangeRandom(min: number, max: number) {
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new Error(`rangeRandom: min, max must be numbers, not ${min}, ${max}`)
  }
  return min + (max - min) * Math.random()
}

/**
 * @param  {number} minimum
 * @param  {number} maximum
 * @return {number} random value in minimum...maximum
 */
function rangeRandomInt(min: number, max?: number) {
  if (max === undefined) {
    return Math.floor(rangeRandom(0, min))
  }
  return Math.floor(rangeRandom(min, max))
}

function randomElement<T>(list: T[] | readonly T[]) {
  return list[rangeRandomInt(list.length)]
}

function head<T>(list: T[] | readonly T[] | [T, ...T[]]) {
  if (!Array.isArray(list)) {
    throw new Error('not a list')
  }
  return list[0]
}

function tail<T>(list: T[] | readonly T[]) {
  if (!Array.isArray(list)) {
    throw new Error('not a list')
  }

  const result = list[list.length - 1]

  if (!result) {
    throw new IndexError(`Cannot access entry ${list.length - 1} of ${list}`)
  }

  return result
}

/**
 * @param  {MultiPolygon}
 * @return {bbox}
 */
function calcBBox(geometry: Geometry): BBox {
  // log.debug('calcBBox', geometry.type)
  let latMin = 10000
  let latMax = -10000
  let lngMin = 10000
  let lngMax = -10000

  const expand = (poly: number[][]) => {
    if (!Array.isArray(poly)) {
      throw new Error('poly is not a list')
    }

    for (const pair of poly) {
      const [lng, lat] = pair
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('poly is not a list of [num,num]')
      }
      if (latMin > lat) {
        latMin = lat
      }
      if (latMax < lat) {
        latMax = lat
      }
      if (lngMin > lng) {
        lngMin = lng
      }
      if (lngMax < lng) {
        lngMax = lng
      }
    }
  }

  switch (geometry.type) {
    case 'Polygon':
      const [poly] = geometry.coordinates
      if (!poly) {
        throw new Error(`calcBBox cannot extract missing polygon from ${geometry}`)
      }

      expand(poly)
      break

    case 'MultiPolygon':
      {
        const coords = geometry.coordinates
        for (const polyWithHoles of coords) {
          const [poly] = polyWithHoles
          if (!poly) {
            throw new Error(`calcBBox cannot extract missing polygon from ${geometry}`)
          }
          expand(poly)
        }
      }
      break
    default:
      throw new Error(`calcBBox does not (yet) handle geometry of type ${geometry.type}`)
  }
  return {
    latMin,
    latMax,
    lngMin,
    lngMax
  }
}

function pointInPolyWithHoles(pt: [number, number], polyWithHoles: number[][][]): boolean {
  const poly = polyWithHoles[0]
  // log('testing', pt, 'in', poly, 'in', polyWithHoles)
  if (poly && pointInPoly(pt, poly)) {
    // log('pt in poly')
    const holes = polyWithHoles.slice(1)
    for (const hole of holes) {
      if (pointInPoly(pt, hole)) {
        // log('pt in hole')
        return false
      }
    }
    // log('pt in poly but not holes')
    return true
  }
  // log('pt in none polys')
  return false
}

/**
 * @param  {Point or [number, number]}
 * @param  {MultiPolygon}
 * @return {true iff the point is somewhere in the list of polygons and not in the list of holes}
 */
function pointInMultiPolygon(pt: [number, number], multipoly: MultiPolygon): boolean {
  return multipoly.coordinates.some((polyWithHoles: number[][][]) => pointInPolyWithHoles(pt, polyWithHoles))
}

/**
 * @param  {Point or [number, number]}
 * @param  {Polygon}
 * @return {true iff the point is somewhere in the list of polygons and not in the list of holes}
 */
function pointInPolygon(pt: [number, number], poly: Polygon): boolean {
  return pointInPolyWithHoles(pt, poly.coordinates)
}

function pointInGeometry(pt: [number, number], shape: Geometry): boolean {
  if (shape.type === 'MultiPolygon') {
    return pointInMultiPolygon(pt, shape)
  }
  if (shape.type === 'Polygon') {
    return pointInPolygon(pt, shape)
  }
  if (shape.type === 'Point') {
    if (pointInPolygon(pt, circleToPolygon(shape.coordinates, RADIUS, NUMBER_OF_EDGES))) {
      return true
    }
    return false
  }
  UtilsLogger.debug(`cannot check point in shape for type ${shape.type}, returning false`)

  return false
}

function pointInFeatureCollection(pt: [number, number], fc: FeatureCollection): boolean {
  return fc.features.some((feature: Feature) => pointInGeometry(pt, feature.geometry))
}

function pointInShape(
  pt: [number, number] | { lat: number; lng: number },
  shape: Geometry | FeatureCollection
): boolean {
  const point: [number, number] = Array.isArray(pt) ? pt : [pt.lng, pt.lat]
  if (shape.type === 'Point') {
    if (pointInPolygon(point, circleToPolygon(shape.coordinates, RADIUS, NUMBER_OF_EDGES))) {
      return true
    }
    return false
  }
  if (shape.type === 'MultiPolygon') {
    return pointInMultiPolygon(point, shape)
  }
  if (shape.type === 'Polygon') {
    return pointInPolygon(point, shape)
  }
  if (shape.type === 'FeatureCollection') {
    return pointInFeatureCollection(point, shape)
  }
  return pointInGeometry(point, shape)
}

/**
 * @param  {MultiPolygon}
 * @return {Point} random point within the MultiPolygon
 */
function makePointInShape(shape: Geometry): { lat: number; lng: number } {
  if (!shape) {
    throw new Error('no shape')
  }

  const shapeToCreate = shape.type === 'Point' ? circleToPolygon(shape.coordinates, RADIUS, NUMBER_OF_EDGES) : shape

  const bbox = calcBBox(shapeToCreate)
  let tries = 0
  while (tries < 1000) {
    const pt: [number, number] = [rangeRandom(bbox.lngMin, bbox.lngMax), rangeRandom(bbox.latMin, bbox.latMax)]
    if (pointInShape(pt, shapeToCreate)) {
      return {
        lng: pt[0],
        lat: pt[1]
      }
    }
    tries += 1
  }
  throw new Error('tried 1000 times to put a point in poly and failed')
}

/**
 * [rad description]
 * @param  {[type]} _deg [description]
 * @return {[type]}      [description]
 */
function rad(_deg: number): number {
  return (_deg * Math.PI) / 180
}

/**
 * [deg description]
 * @param  {[type]} _rad [description]
 * @return {[type]}      [description]
 */
function deg(_rad: number): number {
  return (_rad * 180) / Math.PI
}

/**
 * @param {Point}
 * @param {distance in meters}
 * @param {bearing in degrees}
 */
function addDistanceBearing<T extends { lat: number; lng: number }>(pt: T, distance: number, bearing: number) {
  // log('addDistanceBearing', pt, distance, bearing)
  if (Number.isNaN(distance)) {
    throw new Error('bad distance')
  }
  if (Number.isNaN(bearing)) {
    throw new Error('bad bearing')
  }
  const R = 6378100 // Radius of the Earth, in meters
  const B = rad(bearing)

  const lat1 = rad(pt.lat)
  const lng1 = rad(pt.lng)

  const xx = Math.sin(lat1) * Math.cos(distance / R) + Math.cos(lat1) * Math.sin(distance / R) * Math.cos(B)
  const lat2 = Math.asin(xx)

  const num = Math.sin(B) * Math.sin(distance / R) * Math.cos(lat1)
  const den = Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
  const lng2 = lng1 + Math.atan2(num, den)

  return { ...pt, lat: deg(lat2), lng: deg(lng2) }
}

/**
 * @param  {string describing a bounding box}
 * @return {bounding box}
 */
function parseBBox(bbox_str: string): { lngMin: number; lngMax: number; latMin: number; latMax: number } | null {
  // [sw point, ne point]
  // e.g. '[[-73.9876, 40.7661],[-73.9876, 40.7661]]'
  if (!bbox_str || typeof bbox_str !== 'string') {
    return null
  }
  const parts = bbox_str
    .replace(/[[\] ]+/g, '')
    .split(',')
    .map(parseFloat)

  const isTuple4Number = (input: unknown): input is [number, number, number, number] => {
    return Array.isArray(input) && input.length === 4 && input.every((x: unknown) => typeof x === 'number')
  }

  if (!isTuple4Number(parts)) {
    return null
  }

  const [lng1, lat1, lng2, lat2] = parts
  return {
    lngMin: Math.min(lng1, lng2),
    lngMax: Math.max(lng1, lng2),
    latMin: Math.min(lat1, lat2),
    latMax: Math.max(lat1, lat2)
  }
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function nullKeys<T>(obj: { [key: string]: T }): string[] {
  return Object.keys(obj).filter(key => obj[key] === null || obj[key] === undefined)
}

function stripNulls<T extends {}>(obj: { [x: string]: unknown }): Partial<T> {
  return nullKeys(obj).reduce((stripped, key) => {
    const { [key]: nullkey, ...rest } = stripped
    return rest
  }, obj) as Partial<T>
}

const setEmptyArraysToUndefined = <T extends {}>(obj: { [x: string]: unknown }): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    if (Array.isArray(val) && val.length === 0) return Object.assign(acc, { [key]: undefined })
    return Object.assign(acc, { [key]: val })
  }, {}) as Partial<T>
}

function isFloat(n: unknown): boolean {
  return typeof n === 'number' || (typeof n === 'string' && !Number.isNaN(parseFloat(n)))
}

function now(): Timestamp {
  return Date.now()
}

// dumb subset of lodash range()
function range(n: number) {
  return [...Array(n).keys()]
}

function nonNegInt(val: string, def: number): number {
  if (def === undefined) {
    throw new Error('nonNegInt: no default value')
  }
  if (val === undefined) {
    return def
  }
  const parsed = parseInt(val)
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed
  }

  throw new Error(`invalid nonNegInt "${val}"`)
}

function yesterday(): Timestamp {
  return Date.now() - days(1)
}

// shortcut for making a string form of comma-separated values
function csv<T>(list: T[] | Readonly<T[]>): string {
  return list.join(', ')
}

// utility for adding counts to maps
function inc(map: { [key: string]: number }, key: string) {
  const value = map[key]

  return Object.assign(map, { [key]: value ? value + 1 : 1 })
}

function pathPrefix(path: string): string {
  const { PATH_PREFIX } = process.env
  return PATH_PREFIX ? `${PATH_PREFIX}${path}` : path
}

function isInsideBoundingBox(telemetry: Telemetry | undefined | null, bbox: BoundingBox): boolean {
  if (telemetry && telemetry.gps) {
    const { lat, lng } = telemetry.gps
    if (!lat || !lng) {
      return false
    }
    const [[lng1, lat1], [lng2, lat2]] = bbox
    const latMin = Math.min(lat1, lat2)
    const latMax = Math.max(lat1, lat2)
    const lngMin = Math.min(lng1, lng2)
    const lngMax = Math.max(lng1, lng2)
    return latMin <= lat && lat <= latMax && lngMin <= lng && lng <= lngMax
  }
  return false
}

function areThereCommonElements<T, U>(arr1: T[], arr2: U[]) {
  const set = new Set([...arr1, ...arr2])
  return set.size !== arr1.length + arr2.length
}

function routeDistance(coordinates: { lat: number; lng: number }[]): number {
  const R = 6371000 // Earth's mean radius in meters
  return (coordinates || [])
    .map(coordinate => <const>[rad(coordinate.lat), rad(coordinate.lng)])
    .reduce((distance, point, index, points) => {
      if (index > 0) {
        const prev = points[index - 1]

        if (!prev) {
          throw new RuntimeError('routeDistance: previous point not found') // this should never happen, but Safety™
        }

        const [lat1, lng1] = prev
        const [lat2, lng2] = point
        const [dlat, dlng] = [lat2 - lat1, lng2 - lng1]
        const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c
        return distance + d
      }
      return distance
    }, 0)
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

type isDefinedOptions = Partial<{ warnOnEmpty: boolean }>

const isDefined = <T>(elem: T | undefined | null, options: isDefinedOptions = {}, index?: number): elem is T => {
  const { warnOnEmpty } = options
  if (elem !== undefined && elem !== null) {
    return true
  }
  if (warnOnEmpty) {
    UtilsLogger.warn(`Encountered empty element at index: ${index}`)
  }
  return false
}

const filterDefined =
  (options: isDefinedOptions = {}) =>
  <T>(value: T | undefined | null, index: number, array: (T | undefined | null)[]): value is T =>
    isDefined(value, options, index)

function moved(latA: number, lngA: number, latB: number, lngB: number) {
  const limit = 0.00001 // arbitrary amount
  const latDiff = Math.abs(latA - latB)
  const lngDiff = Math.abs(lngA - lngB)
  return lngDiff > limit || latDiff > limit // very computational efficient basic check (better than sqrts & trig)
}

const normalizeToArray = <T>(elementToNormalize: T | T[] | undefined): T[] => asArray(elementToNormalize ?? [])

const getEnvVar = <TProps extends { [name: string]: string }>(props: TProps): TProps =>
  Object.keys(props).reduce((env, key) => {
    return {
      ...env,
      [key]: process.env[key] || props[key]
    }
  }, {} as TProps)

const isTArray = <T>(arr: unknown, isT: (t: unknown) => t is T): arr is T[] => {
  if (arr instanceof Array) {
    return arr.filter(t => isT(t)).length === arr.length
  }
  return false
}

const isString = (arg: unknown): arg is string => typeof arg === 'string'

const isStringArray = (arr: unknown): arr is string[] => isTArray<string>(arr, isString)

const asArray = <T>(value: SingleOrArray<T>): T[] => (Array.isArray(value) ? value : [value])

const asArrayOfAtLeastOne = <T>(value: SingleOrArray<T>): [T, ...T[]] => {
  if (Array.isArray(value)) {
    if (!hasAtLeastOneEntry(value)) {
      throw new Error('asArrayOfAtLeastOne: array must have at least one entry')
    }

    return value
  }

  return [value]
}

const pluralize = (count: number, singular: string, plural: string) => (count === 1 ? singular : plural)

/**
 * Aborts execution if not running under a test environment.
 */
const testEnvSafeguard = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('This function must be called in a test environment.')
  }
}

const START_ONE_MONTH_AGO = now() - (now() % days(1)) - days(30)
const START_ONE_WEEK_AGO = now() - (now() % days(1)) - days(7)
const START_YESTERDAY = now() - (now() % days(1))
const START_NOW = now()
const START_TOMORROW = now() + (now() % days(1))
const START_ONE_MONTH_FROM_NOW = now() - (now() % days(1)) + days(30)

/**
 *
 * @param arr1 First list to zip
 * @param arr2 Second list to zip
 * @returns A list of zipped & mapped values
 *
 * @example zip([1, 2, 3], ['a', 'b', 'c'], (a, b) => `${a}${b}`) => ['1a', '2b', '3c']
 * Zips two lists of equal length, mapping each tuple to a new value.
 */
const zip = <T, U, R>(arr1: T[], arr2: U[], mapper: (x: T, y: U) => R) => {
  if (arr1.length !== arr2.length) {
    throw new Error('Arrays must be of equal length in order to zip')
  }
  return arr1.map((elem, index) => mapper(elem, arr2[index] as U)) // we can do this type assertion because we know the arrays are of the same length
}

const hasAtLeastOneEntry = <T>(input: T[]): input is [T, ...T[]] => input.length >= 1

export {
  RULE_UNIT_MAP,
  START_NOW,
  START_ONE_MONTH_AGO,
  START_ONE_MONTH_FROM_NOW,
  START_ONE_WEEK_AGO,
  START_TOMORROW,
  START_YESTERDAY,
  UUID_REGEX,
  addDistanceBearing,
  areThereCommonElements,
  asArray,
  capitalizeFirst,
  clone,
  csv,
  days,
  filterDefined,
  getEnvVar,
  getNextStates,
  head,
  hours,
  inc,
  isDefined,
  isEventSequenceValid,
  isFloat,
  isInsideBoundingBox,
  isPct,
  isStringArray,
  isSubset,
  isTimestamp,
  isUUID,
  makePointInShape,
  minutes,
  moved,
  nonNegInt,
  normalizeToArray,
  now,
  nullKeys,
  parseBBox,
  pathPrefix,
  pluralize,
  pointInGeometry,
  pointInShape,
  randomElement,
  range,
  rangeRandom,
  rangeRandomInt,
  round,
  routeDistance,
  seconds,
  setEmptyArraysToUndefined,
  stripNulls,
  tail,
  testEnvSafeguard,
  timeframe,
  yesterday,
  zip,
  hasOwnProperty,
  hasAtLeastOneEntry,
  asArrayOfAtLeastOne
}

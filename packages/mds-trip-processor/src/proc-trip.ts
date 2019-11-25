import { data_handler as dataHandler } from './proc'
import db from '@mds-core/mds-db'
import cache from '@mds-core/mds-cache'
import stream from '@mds-core/mds-stream'
import config from './config'

import { CE_TYPE, TRIP_EVENT, TRIP_ENTRY, TRIP_TELEMETRY } from '@mds-core/mds-types'
// TODO: convert libraries to TS
let { calcDistance } = require('./geo/geo')

/*
    Trip processor that runs inside a Kubernetes pod, activated via cron job.
    Aggregates event/telemety data into binned trips at a set interval. As trips
    are processed caches are cleaned.

    Processed trips are added to a postgres table:

        REPORTS_DEVICE_TRIPS:
          PRIMARY KEY = (provider_id, device_id, trip_id)
          VALUES = trip_data
*/
async function tripHandler() {
  await dataHandler('trip', async function(type: CE_TYPE, data: any) {
    tripAggregator()
  })
}

async function tripAggregator() {
  const tripsMap: { [uuid: string]: string } = await cache.hgetall('trips:events')
  for (let vehicleID in tripsMap) {
    const [provider_id, device_id] = vehicleID.split(':')
    const trips: { [trip_id: string]: TRIP_EVENT[] } = JSON.parse(tripsMap[vehicleID])
    let unprocessedTrips = trips
    for (let trip_id in trips) {
      const trip_processed = await processTrip(provider_id, device_id, trip_id, trips[trip_id])
      if (trip_processed) {
        console.log('TRIP PROCESSED')
        delete unprocessedTrips[trip_id]
      }
    }
    // Update or clear cache
    if (Object.keys(unprocessedTrips).length) {
      console.log('PROCESSED SOME TRIPS')
      await cache.hset('trips:events', vehicleID, JSON.stringify(unprocessedTrips))
    } else {
      console.log('PROCESSED ALL TRIPS')
      await cache.hdel('trips:events', vehicleID)
    }
  }
}

function calcTimeIntervals(
  telemetry: { [x: string]: { [x: string]: { timestamp: number } } },
  start_time: number
): number {
  /*
    Not currently used. Allows tracking of time between individual telemetry/event points
  */
  let temp_time = start_time
  let count = 0
  for (let n in telemetry) {
    for (let m in telemetry[n]) {
      count += telemetry[n][m].timestamp - temp_time
      temp_time = telemetry[n][m].timestamp
    }
  }
  return count
}

async function processTrip(
  provider_id: string,
  device_id: string,
  trip_id: string,
  tripEvents: TRIP_EVENT[]
): Promise<boolean> {
  /*
    Add telemetry and meta data into database when a trip ends

    Examples:

        1) trip duration
        2) trip length

    We must compute these metrics here due to the potential of up to 24hr delay of telemetry data
  */

  // Validation steps
  // TODO: make checks more robust
  if (tripEvents.length < 2) {
    console.log('No trip end seen yet')
    return false
  }

  // Process anything where the last event timestamp is more than 24 hours old
  tripEvents.sort(function(a: { timestamp: number }, b: { timestamp: number }) {
    return a.timestamp - b.timestamp
  })
  const timeSLA = config.compliance_sla.max_telemetry_time
  const curTime = new Date().getTime()
  const latestTime = tripEvents[tripEvents.length - 1].timestamp
  if (latestTime + timeSLA > curTime) {
    console.log('trips ended less than 24hrs ago')
    return false
  }

  // Get trip metadata
  const tripStartEvent = tripEvents[0]
  const tripEndEvent = tripEvents[tripEvents.length - 1]
  const baseTripData = {
    vehicle_type: tripStartEvent.vehicle_type,
    trip_id: trip_id,
    device_id: device_id,
    provider_id: provider_id,
    start_time: tripStartEvent.timestamp,
    end_time: tripEndEvent.timestamp,
    start_service_area_id: tripStartEvent.service_area_id,
    end_service_area_id: tripEndEvent.service_area_id
  } as TRIP_ENTRY

  // Get trip telemetry data
  let tripMap = JSON.parse(await cache.hget('trips:telemetry', provider_id + ':' + device_id))
  const tripTelemetry = tripMap[trip_id]
  let telemetry: TRIP_TELEMETRY[][] = []
  // Separate telemetry by trip events
  if (tripTelemetry && tripTelemetry.length > 0) {
    for (let i = 0; i < tripEvents.length - 1; i++) {
      const start_time = tripEvents[i].timestamp
      const end_time = i !== tripEvents.length - 1 ? tripEvents[i + 1].timestamp : null
      const tripSegment = tripTelemetry.filter(
        (telemetry_point: { timestamp: number }) =>
          telemetry_point.timestamp >= start_time && (end_time ? telemetry_point.timestamp <= end_time : true)
      ) as TRIP_TELEMETRY[]
      tripSegment.sort(function(a: { timestamp: number }, b: { timestamp: number }) {
        return a.timestamp - b.timestamp
      })
      telemetry.push(tripSegment)
    }
  } else {
    console.log('No telemtry found')
  }

  // Calculate trip metrics
  // We must calculate with trip since telemetry is delayed by up to 24 hrs
  const total_time = tripEndEvent.timestamp - tripStartEvent.timestamp
  const duration = total_time
  const distMeasure: any = calcDistance(telemetry, tripStartEvent.gps)
  const distance = distMeasure.totalDist
  const distArray = distMeasure.points
  const violation_count = distMeasure.points.length
  const max_violation_dist = Math.min(...distArray)
  const min_violoation_dist = Math.max(...distArray)
  const avg_violation_dist =
    distArray.length > 0 ? distArray.reduce((a: number, b: number) => a + b) / distArray.length : null

  const tripData = {
    ...baseTripData,
    duration: duration,
    distance: distance,
    violation_count: violation_count,
    max_violation_dist: max_violation_dist,
    min_violoation_dist: min_violoation_dist,
    avg_violation_dist: avg_violation_dist,
    telemetry: telemetry
  } as TRIP_ENTRY

  // Insert into PG DB and stream
  console.log('INSERT')
  try {
    await db.insert('reports_trips', tripData)
  } catch (err) {
    console.log(err)
  }
  //await stream.writeCloudEvent('mds.processed.trip', JSON.stringify(trip_data))

  // Delete all processed telemetry data and update cache
  console.log('DELETE')
  try {
    delete tripMap[trip_id]
    await cache.hset('trips:telemetry', provider_id + ':' + device_id, JSON.stringify(tripMap))
  } catch (err) {
    console.log(err)
  }
  return true
}

export { tripHandler as trip_handler }

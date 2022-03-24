import cache from '@mds-core/mds-agency-cache'
import db from '@mds-core/mds-db'
import type { DeviceDomainModel } from '@mds-core/mds-ingest-service'
import { IngestServiceClient, IngestStream, validateEventDomainModel } from '@mds-core/mds-ingest-service'
import type { DeepPartial, UUID, VehicleEvent } from '@mds-core/mds-types'
import { isDefined, normalizeToArray, NotFoundError, now, ValidationError } from '@mds-core/mds-utils'
import { AgencyLogger } from '../logger'
import type { AgencyApiSubmitVehicleEventRequest, AgencyApiSubmitVehicleEventResponse } from '../types'
import { AgencyServerError } from '../types'
import { agencyValidationErrorParser, eventValidForMode } from '../utils'

const handleDbError = async (
  req: AgencyApiSubmitVehicleEventRequest,
  res: AgencyApiSubmitVehicleEventResponse,
  err: Error | Partial<{ message: string }>,
  provider_id: UUID,
  event: DeepPartial<VehicleEvent>
): Promise<void> => {
  const message = err.message || String(err)

  await IngestStream.writeEventError({
    provider_id,
    data: event,
    recorded: now(),
    error_message: message
  })

  if (message.includes('duplicate')) {
    AgencyLogger.debug('duplicate event', { provider_id, event })
    res.status(400).send({
      error: 'bad_param',
      error_description: 'An event with this device_id and timestamp has already been received'
    })
  } else if (message.includes('not found') || message.includes('unregistered')) {
    AgencyLogger.debug('event for unregistered', { provider_id, event })
    res.status(400).send({
      error: 'unregistered',
      error_description: 'The specified device_id has not been registered'
    })
  } else {
    AgencyLogger.error('post event fail:', { event, message })
    res.status(500).send(AgencyServerError)
  }
}

/**
 * Logs performance of write if the duration of the write was > deltaThreshold
 * @param event VehicleEvent which was persisted
 * @param deltaThreshold Delta (in ms) to log for (default 100ms)
 */
const logEventWritePerformance = (event: VehicleEvent, logThreshold = 100) => {
  const { recorded } = event
  const delta = now() - recorded

  /* Tests shouldn't be slow */
  /* istanbul ignore next */
  if (delta > logThreshold) {
    const { provider_id } = event

    AgencyLogger.debug(`${provider_id} post event took ${delta} ms`)
  }
}

const sendSuccess = (
  req: AgencyApiSubmitVehicleEventRequest,
  res: AgencyApiSubmitVehicleEventResponse,
  event: VehicleEvent
) => {
  const { device_id, vehicle_state } = event

  logEventWritePerformance(event)

  return res.status(201).send({
    device_id,
    state: vehicle_state
  })
}

/**
 * Refreshes the cache if a device was previously registered, but was removed from the cache due to decommissioning
 * @param device MDS Device
 * @param event MDS VehicleEvent
 */
const refreshDeviceCache = async (device: DeviceDomainModel, event: VehicleEvent) => {
  try {
    await cache.readDevice(event.device_id)
  } catch (refreshError) {
    try {
      await Promise.all([cache.writeDevices([device]), IngestStream.writeDevice(device)])
      AgencyLogger.debug('Re-adding previously deregistered device to cache', { error: refreshError })
    } catch (error) {
      AgencyLogger.warn(`Error writing to cache/stream`, { error })
    }
  }
}

export const createEventHandler = async (
  req: AgencyApiSubmitVehicleEventRequest,
  res: AgencyApiSubmitVehicleEventResponse
) => {
  const { device_id } = req.params

  const { provider_id } = res.locals

  const recorded = now()

  const unparsedEvent = {
    ...req.body,
    device_id,
    provider_id,
    telemetry: { ...req.body.telemetry, provider_id, recorded },
    recorded
  }

  try {
    const event = (() => {
      const parsedEvent = validateEventDomainModel(unparsedEvent)

      const { telemetry, device_id, recorded } = parsedEvent
      const { timestamp: telemetry_timestamp } = telemetry

      return { ...parsedEvent, telemetry_timestamp, telemetry: { ...telemetry, device_id, recorded } }
    })()

    // TODO switch to cache for speed?
    const device = await IngestServiceClient.getDevice({ device_id, provider_id })
    if (!isDefined(device)) {
      throw new NotFoundError(`device_id ${device_id} not found`)
    }

    // Note: Even though the event has passed schema validation, we need to verify it's allowed for this mode of vehicle
    const invalidStateOrEventTypes = eventValidForMode(device, event)
    if (invalidStateOrEventTypes) {
      return res.status(400).send(invalidStateOrEventTypes)
    }

    await refreshDeviceCache(device, event)

    const { telemetry } = event
    const recorded_telemetry = await db.writeTelemetry(normalizeToArray(telemetry))

    // database write is crucial; failures of cache/stream should be noted and repaired
    const recorded_event = await db.writeEvent(event)

    try {
      await Promise.all([
        cache.writeEvents([recorded_event]),
        IngestStream.writeEvent(recorded_event),
        cache.writeTelemetry([telemetry]),
        IngestStream.writeTelemetry(recorded_telemetry)
      ])
    } catch (eventPersistenceError) {
      AgencyLogger.warn('/event exception cache/stream', { error: eventPersistenceError })
    } finally {
      return sendSuccess(req, res, event)
    }
  } catch (error) {
    if (error instanceof ValidationError) return res.status(400).send(agencyValidationErrorParser(error))

    await handleDbError(req, res, error as any, provider_id, unparsedEvent)
  }
}

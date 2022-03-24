/**
 * Copyright 2020 City of Los Angeles
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

import type { ProcessController, ServiceProvider } from '@mds-core/mds-service-helpers'
import { ServiceException, ServiceResult } from '@mds-core/mds-service-helpers'
import { NotFoundError } from '@mds-core/mds-utils'
import type { IngestService, IngestServiceRequestContext } from '../@types'
import { IngestServiceLogger } from '../logger'
import { IngestRepository } from '../repository'
import {
  validateEventAnnotationDomainCreateModel,
  validateEventDomainCreateModel,
  validateGetDeviceOptions,
  validateGetDevicesOptions,
  validateGetEventsWithDeviceAndTelemetryInfoOptions,
  validateGetVehicleEventsFilterParams,
  validateTelemetryAnnotationDomainCreateModel,
  validateUUIDs
} from './validators'

export const IngestServiceProvider: ServiceProvider<IngestService, IngestServiceRequestContext> & ProcessController = {
  start: async () => {
    await Promise.all([IngestRepository.initialize()])
  },

  stop: async () => {
    await Promise.all([IngestRepository.shutdown()])
  },

  getDevicesUsingOptions: async (context, options) => {
    try {
      return ServiceResult(await IngestRepository.getDevicesUsingOptions(validateGetDevicesOptions(options)))
    } catch (error) {
      const exception = ServiceException('Error in getDevicesUsingOptions', error)
      IngestServiceLogger.error('getDevicesUsingOptions exception', { exception, error })
      return exception
    }
  },

  getDevice: async (context, options) => {
    try {
      return ServiceResult(await IngestRepository.getDevice(validateGetDeviceOptions(options)))
    } catch (error) {
      const exception = ServiceException('Error in getDevice', error)
      IngestServiceLogger.error('getDevice exception', { exception, error })
      return exception
    }
  },

  getDevicesUsingCursor: async (context, cursor) => {
    try {
      return ServiceResult(await IngestRepository.getDevicesUsingCursor(cursor))
    } catch (error) {
      const exception = ServiceException('Error in getDevicesUsingCursor', error)
      IngestServiceLogger.error('getDevicesUsingCursor exception', { exception, error })
      return exception
    }
  },

  getEventsUsingOptions: async (context, params) => {
    try {
      return ServiceResult(await IngestRepository.getEventsUsingOptions(validateGetVehicleEventsFilterParams(params)))
    } catch (error) {
      const exception = ServiceException('Error in getEvents', error)
      IngestServiceLogger.error('getEvents exception', { exception, error })
      return exception
    }
  },

  getEventsUsingCursor: async (context, cursor) => {
    try {
      return ServiceResult(await IngestRepository.getEventsUsingCursor(cursor))
    } catch (error) {
      const exception = ServiceException('Error in getEvents', error)
      IngestServiceLogger.error('getEvents exception', { exception, error })
      return exception
    }
  },

  getDevices: async (context, device_ids) => {
    try {
      return ServiceResult(await IngestRepository.getDevices(validateUUIDs(device_ids)))
    } catch (error) {
      const exception = ServiceException('Error in getDevices', error)
      IngestServiceLogger.error('getDevices exception', { exception, error })
      return exception
    }
  },

  getLatestTelemetryForDevices: async (context, device_ids) => {
    try {
      return ServiceResult(await IngestRepository.getLatestTelemetryForDevices(device_ids))
    } catch (error) {
      const exception = ServiceException('Error in getLatestTelemetryForDevices', error)
      IngestServiceLogger.error('getLatestTelemetryForDevices exception', { exception, error })
      return exception
    }
  },

  writeEvents: async (context, events) => {
    try {
      // Check to see if the devices references in the events exist in the db. This is in a closure to keep the code pretty boxed off, but I didn't feel the need to make a named function elsewhere :)
      // FIXME: Move this check to the cache (once we have a cache manged by the ingest service)
      await (async () => {
        const devicesInPayload = new Set(events.map(e => e.device_id))
        const devicesInDb = await IngestRepository.getDevices([...devicesInPayload])
        if (devicesInPayload.size !== devicesInDb.length)
          throw new NotFoundError('Some device(s) in event payload not registered')
      })()

      return ServiceResult(await IngestRepository.createEvents(events.map(validateEventDomainCreateModel)))
    } catch (error) {
      const exception = ServiceException('Error in writeEvents', error)
      IngestServiceLogger.error('writeEvents exception', { exception, error })
      return exception
    }
  },

  writeEventAnnotations: async (context, eventAnnotations) => {
    try {
      return ServiceResult(
        await IngestRepository.createEventAnnotations(eventAnnotations.map(validateEventAnnotationDomainCreateModel))
      )
    } catch (error) {
      const exception = ServiceException('Error in writeEventAnnotations', error)
      IngestServiceLogger.error('writeEventAnnotations exception', { exception, error })
      return exception
    }
  },

  writeTelemetryAnnotations: async (context, telemetryAnnotations) => {
    try {
      return ServiceResult(
        await IngestRepository.createTelemetryAnnotations(
          telemetryAnnotations.map(validateTelemetryAnnotationDomainCreateModel)
        )
      )
    } catch (error) {
      const exception = ServiceException('Error in writeTelemetryAnnotation', error)
      IngestServiceLogger.error('writeTelemetryAnnotation exception', { exception, error })
      return exception
    }
  },

  getTripEvents: async (context, options) => {
    try {
      return ServiceResult(await IngestRepository.getTripEvents(options))
    } catch (error) {
      const exception = ServiceException('Error in getTripEvents', error)
      IngestServiceLogger.error('getTripEvents exception', { exception, error })
      return exception
    }
  },

  getEventsWithDeviceAndTelemetryInfoUsingOptions: async (context, options) => {
    try {
      return ServiceResult(
        await IngestRepository.getEventsWithDeviceAndTelemetryInfoUsingOptions(
          validateGetEventsWithDeviceAndTelemetryInfoOptions(options ?? {})
        )
      )
    } catch (error) {
      const exception = ServiceException('Error in getEventsWithDeviceAndTelemetryInfoUsingOptions', error)
      IngestServiceLogger.error('getEventsWithDeviceAndTelemetryInfoUsingOptions exception', { exception, error })
      return exception
    }
  },

  getEventsWithDeviceAndTelemetryInfoUsingCursor: async (context, cursor) => {
    try {
      return ServiceResult(await IngestRepository.getEventsWithDeviceAndTelemetryInfoUsingCursor(cursor))
    } catch (error) {
      const exception = ServiceException('Error in getEventsWithDeviceAndTelemetryInfoUsingCursor', error)
      IngestServiceLogger.error('getEventsWithDeviceAndTelemetryInfoUsingCursor exception', { exception, error })
      return exception
    }
  },

  getDeviceEvents: async (context, options) => {
    try {
      return ServiceResult(await IngestRepository.getDeviceEvents(options))
    } catch (error) {
      const exception = ServiceException('Error in getDeviceEvents', error)
      IngestServiceLogger.error('getDeviceEvents exception', { exception, error })
      return exception
    }
  }
}

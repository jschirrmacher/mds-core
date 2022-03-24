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

import type { AccessTokenScopeValidator } from '@mds-core/mds-api-server'
import { checkAccess } from '@mds-core/mds-api-server'
import { isUUID, pathPrefix } from '@mds-core/mds-utils'
import type express from 'express'
import { createEventHandler } from './handlers/create-event'
import { createTelemetryHandler } from './handlers/create-telemetry'
import { AgencyLogger } from './logger'
import { AgencyApiVersionMiddleware } from './middleware/agency-api-version'
import {
  getVehicleById,
  getVehiclesByProvider,
  registerVehicle,
  updateVehicle,
  writeTripMetadata
} from './request-handlers'
import { getCacheInfo } from './sandbox-admin-request-handlers'
import type { AgencyApiAccessTokenScopes, AgencyApiRequest, AgencyApiResponse } from './types'
import { AgencyServerError } from './types'
import { validateDeviceId } from './utils'

const checkAgencyApiAccess = (validator: AccessTokenScopeValidator<AgencyApiAccessTokenScopes>) =>
  checkAccess(validator)

function api(app: express.Express): express.Express {
  /**
   * Agency-specific middleware to extract provider_id into locals, do some logging, etc.
   */
  app.use(AgencyApiVersionMiddleware)

  app.use(async (req: AgencyApiRequest, res: AgencyApiResponse, next) => {
    try {
      // verify presence of provider_id
      if (!req.path.includes('/health')) {
        if (res.locals.claims) {
          const { provider_id } = res.locals.claims

          if (!isUUID(provider_id)) {
            AgencyLogger.warn('invalid provider_id is not a UUID', { provider_id, originalUrl: req.originalUrl })
            return res.status(400).send({
              error: 'authentication_error',
              error_description: `invalid provider_id ${provider_id} is not a UUID`
            })
          }

          // stash provider_id
          res.locals.provider_id = provider_id
        } else {
          return res.status(401).send({ error: 'authentication_error', error_description: 'Unauthorized' })
        }
      }
    } catch (error) {
      /* istanbul ignore next */
      AgencyLogger.error('request claims parsing fail:', { originalUrl: req.originalUrl, error })
      return res.status(500).send(AgencyServerError)
    }
    next()
  })

  // / ////////// gets ////////////////

  /**
   * Endpoint to register vehicles
   * See {@link https://github.com/openmobilityfoundation/mobility-data-specification/tree/dev/agency#vehicle---register Register}
   */
  app.post(pathPrefix('/vehicles'), registerVehicle)

  /**
   * Read back a vehicle.
   */
  app.get(pathPrefix('/vehicles/:device_id'), validateDeviceId, getVehicleById)

  /**
   * Read back all the vehicles for this provider_id, with pagination
   */
  app.get(pathPrefix('/vehicles'), getVehiclesByProvider)

  // update the vehicle_id
  app.put(pathPrefix('/vehicles/:device_id'), validateDeviceId, updateVehicle)

  /**
   * Endpoint to submit vehicle events
   * See {@link https://github.com/openmobilityfoundation/mobility-data-specification/tree/dev/agency#vehicle---event Events}
   */
  app.post(pathPrefix('/vehicles/:device_id/event'), validateDeviceId, createEventHandler)

  /**
   * Endpoint to submit telemetry
   * See {@link https://github.com/openmobilityfoundation/mobility-data-specification/tree/dev/agency#vehicles---update-telemetry Telemetry}
   */
  app.post(pathPrefix('/vehicles/telemetry'), createTelemetryHandler)

  app.get(
    pathPrefix('/admin/cache/info'),
    checkAgencyApiAccess(scopes => scopes.includes('admin:all')),
    getCacheInfo
  )

  /* Experimental Endpoint */
  app.post(pathPrefix('/trips'), writeTripMetadata)
  app.patch(pathPrefix('/trips'), writeTripMetadata)
  return app
}

// ///////////////////// end test-only endpoints ///////////////////////

export { api }

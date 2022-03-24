/**
 * Copyright 2021 City of Los Angeles
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
import { GeographyServiceClient } from '@mds-core/mds-geography-service'
import { ErrorCheckFunction } from '@mds-core/mds-service-helpers'
import { DependencyMissingError, NotFoundError } from '@mds-core/mds-utils'
import type express from 'express'
import { GeographyAuthorLogger } from '../logger'
import type {
  GeographyAuthorApiPutGeographyMetadataRequest,
  GeographyAuthorApiPutGeographyMetadataResponse
} from '../types'

export const UpdateGeographyMetadataHandler = async (
  req: GeographyAuthorApiPutGeographyMetadataRequest,
  res: GeographyAuthorApiPutGeographyMetadataResponse,
  next: express.NextFunction
) => {
  const geography_metadata = req.body
  try {
    await GeographyServiceClient.editGeographyMetadata(geography_metadata)
    return res.status(200).send({ version: res.locals.version, data: { geography_metadata } })
  } catch (updateErr) {
    if (ErrorCheckFunction(NotFoundError)(updateErr)) {
      try {
        await GeographyServiceClient.writeGeographiesMetadata([geography_metadata])
        return res.status(201).send({ version: res.locals.version, data: { geography_metadata } })
      } catch (writeErr) {
        GeographyAuthorLogger.warn('failed to write geography metadata', { error: writeErr })
        if (ErrorCheckFunction(DependencyMissingError)(writeErr)) {
          return res.status(404).send({ error: writeErr })
        }
        return next(writeErr)
      }
    } else {
      return next(updateErr)
    }
  }
}

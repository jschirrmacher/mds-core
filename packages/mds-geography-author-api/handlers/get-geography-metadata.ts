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
import { InsufficientPermissionsError, NotFoundError } from '@mds-core/mds-utils'
import type express from 'express'
import { GeographyAuthorLogger } from '../logger'
import type {
  GeographyAuthorApiGetGeographyMetadatumRequest,
  GeographyAuthorApiGetGeographyMetadatumResponse
} from '../types'

export const GetGeographyMetadataHandler = async (
  req: GeographyAuthorApiGetGeographyMetadatumRequest,
  res: GeographyAuthorApiGetGeographyMetadatumResponse,
  next: express.NextFunction
) => {
  const { geography_id } = req.params
  try {
    const geography = await GeographyServiceClient.getGeography(geography_id, {
      includeGeographyJSON: false,
      includeMetadata: true
    })
    if (!geography) {
      throw new NotFoundError('cannot find Geography')
    }
    const geography_metadata = {
      geography_id: geography.geography_id,
      geography_metadata: geography.geography_metadata || {}
    }

    if (!geography.publish_date && !res.locals.scopes.includes('geographies:read:unpublished')) {
      throw new InsufficientPermissionsError('permission to read metadata of unpublished geographies missing')
    }
    return res.status(200).send({ version: res.locals.version, data: { geography_metadata } })
  } catch (error) {
    GeographyAuthorLogger.warn('failed to read geography metadata', { error })
    return next(error)
  }
}

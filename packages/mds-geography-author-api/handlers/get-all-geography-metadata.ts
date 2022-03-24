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

import type { GeographyMetadataDomainModel, GeographyWithMetadataDomainModel } from '@mds-core/mds-geography-service'
import { GeographyServiceClient } from '@mds-core/mds-geography-service'
import { InsufficientPermissionsError } from '@mds-core/mds-utils'
import type express from 'express'
import { GeographyAuthorLogger } from '../logger'
import type {
  GeographyAuthorApiGetGeographyMetadataRequest,
  GeographyAuthorApiGetGeographyMetadataResponse
} from '../types'

export const GetAllGeographyMetadataHandler = async (
  req: GeographyAuthorApiGetGeographyMetadataRequest,
  res: GeographyAuthorApiGetGeographyMetadataResponse,
  next: express.NextFunction
) => {
  const { scopes } = res.locals
  const { get_published, get_unpublished } = req.query
  const params = {
    get_published: get_published ? get_published === 'true' : null,
    get_unpublished: get_unpublished ? get_unpublished === 'true' : null
  }

  /* If the user can only read published geos, and all they want is the unpublished metadata,
   * throw a permissions error.
   */
  try {
    if (!scopes.includes('geographies:read:unpublished') && params.get_unpublished) {
      throw new InsufficientPermissionsError(
        'Cannot require unpublished geo metadata without geography:read:unpublished scope'
      )
    }

    /* If the user has only the read:published scope, they should not be allowed to see
     * unpublished geos. If they didn't supply any params, we modify them here so as to
     * filter only for published geo metadata. We have to monkey with the params here
     * in a way that we don't for the bulk read of the geographies since we can't filter
     * the DB results in this layer, since metadata has no idea if the geo it's associated
     * with is published or not.
     */
    if (
      !scopes.includes('geographies:read:unpublished') &&
      params.get_unpublished === null &&
      params.get_published === null
    ) {
      params.get_published = true
    }

    let geographies: GeographyWithMetadataDomainModel[] = []
    if (!params.get_published && !params.get_unpublished) {
      geographies = await GeographyServiceClient.getGeographies({
        includeGeographyJSON: false,
        includeMetadata: true
      })
    }

    if (params.get_published) {
      geographies = await GeographyServiceClient.getPublishedGeographies({
        includeGeographyJSON: false,
        includeMetadata: true
      })
    }

    if (params.get_unpublished) {
      geographies = await GeographyServiceClient.getUnpublishedGeographies({
        includeGeographyJSON: false,
        includeMetadata: true
      })
    }

    const geography_metadata: GeographyMetadataDomainModel[] = geographies.map(
      ({ geography_id, geography_metadata }) => ({
        geography_id,
        geography_metadata: geography_metadata || {}
      })
    )
    return res.status(200).send({ version: res.locals.version, data: { geography_metadata } })
  } catch (error) {
    GeographyAuthorLogger.warn('failed to read geography metadata', { error })
    return next(error)
  }
}

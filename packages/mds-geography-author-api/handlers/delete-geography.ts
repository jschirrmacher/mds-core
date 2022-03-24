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
import type express from 'express'
import { GeographyAuthorLogger } from '../logger'
import type { GeographyAuthorApiDeleteGeographyRequest, GeographyAuthorApiDeleteGeographyResponse } from '../types'

export const DeleteGeographyHandler = async (
  req: GeographyAuthorApiDeleteGeographyRequest,
  res: GeographyAuthorApiDeleteGeographyResponse,
  next: express.NextFunction
) => {
  const { geography_id } = req.params
  try {
    await GeographyServiceClient.deleteGeographyAndMetadata(geography_id)

    return res.status(200).send({
      version: res.locals.version,
      data: { geography_id }
    })
  } catch (error) {
    GeographyAuthorLogger.warn('failed to delete geography', { error })
    return next(error)
  }
}

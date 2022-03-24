/**
 * Copyright 2022 City of Los Angeles
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

import { ConfigServiceClient } from '@mds-core/mds-config-service'
import { isServiceError } from '@mds-core/mds-service-helpers'
import type { ConfigApiGetMergedSettingsRequest, ConfigApiGetSettingsRequest, ConfigApiResponse } from '../@types'

export const getSettings = async (
  req: ConfigApiGetSettingsRequest | ConfigApiGetMergedSettingsRequest,
  res: ConfigApiResponse
) => {
  try {
    const { properties } = res.locals
    const settings = await ConfigServiceClient.getSettings(properties, { partial: req.query.partial === 'true' })
    return res.status(200).send(settings)
  } catch (error) {
    if (isServiceError(error, 'ServiceUnavailable')) {
      return res.status(503).send({ error })
    }
    return res.status(404).send({ error })
  }
}

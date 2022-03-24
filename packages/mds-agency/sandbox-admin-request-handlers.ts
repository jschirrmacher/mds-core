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

import cache from '@mds-core/mds-agency-cache'
import { ServerError } from '@mds-core/mds-utils'
import type { AgencyApiRequest, AgencyApiResponse } from './types'

export const getCacheInfo = async (req: AgencyApiRequest, res: AgencyApiResponse) => {
  try {
    const details = await cache.info()
    res.status(200).send(details)
  } catch (err) {
    res.status(500).send(new ServerError())
  }
}

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

import { pathPrefix } from '@mds-core/mds-utils'
import express from 'express'
import { ConfigApiGetMergedSettingsRequest, ConfigApiGetSettingsRequest, ConfigApiResponse } from '../@types'
import { getSettings } from '../handlers'

const api = (app: express.Express): express.Express =>
  app
    // Return multiple settings properties specified in the query string merged into a single object
    .get(
      pathPrefix('/settings'),
      async (req: ConfigApiGetMergedSettingsRequest, res: ConfigApiResponse, next: express.NextFunction) => {
        const defaultProperty = 'settings'
        const { p } = req.query
        if (Array.isArray(p)) {
          res.locals.properties = p.length ? p : [defaultProperty]
        } else {
          res.locals.properties = [p || defaultProperty]
        }
        return next()
      },
      getSettings
    )

    // Return a single settings property specified as a route parameter
    .get(
      pathPrefix('/settings/:property'),
      async (req: ConfigApiGetSettingsRequest, res: ConfigApiResponse, next: express.NextFunction) => {
        res.locals.properties = [req.params.property]
        return next()
      },
      getSettings
    )

export { api }

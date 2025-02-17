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

import { ApiErrorHandlingMiddleware } from '@mds-core/mds-api-server'
import { pathPrefix } from '@mds-core/mds-utils'
import type express from 'express'
import { GetPoliciesHandler } from './handlers/get-policies'
import { GetPolicyHandler } from './handlers/get-policy'
import { PolicyApiVersionMiddleware } from './middleware'

export const api = (app: express.Express): express.Express =>
  app
    .use(PolicyApiVersionMiddleware)
    .get(pathPrefix('/policies'), GetPoliciesHandler)
    .get(pathPrefix('/policies/:policy_id'), GetPolicyHandler)
    .use(ApiErrorHandlingMiddleware)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const injectSchema = (schema: any, app: express.Express): express.Express => {
  app.get(pathPrefix('/schema/policy'), (req, res) => {
    res.status(200).send(schema)
  })
  return app
}

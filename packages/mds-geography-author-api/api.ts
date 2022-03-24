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
import { ApiErrorHandlingMiddleware, checkAccess } from '@mds-core/mds-api-server'
import { pathPrefix } from '@mds-core/mds-utils'
import type express from 'express'
import { CreateGeographyHandler } from './handlers/create-geography'
import { DeleteGeographyHandler } from './handlers/delete-geography'
import { GetAllGeographyMetadataHandler } from './handlers/get-all-geography-metadata'
import { GetGeographyMetadataHandler } from './handlers/get-geography-metadata'
import { PublishGeographyHandler } from './handlers/publish-geography'
import { UpdateGeographyHandler } from './handlers/update-geography'
import { UpdateGeographyMetadataHandler } from './handlers/update-geography-metadata'
import { GeographyAuthorApiVersionMiddleware } from './middleware'
import type { GeographyAuthorApiAccessTokenScopes } from './types'

const checkGeographyAuthorApiAccess = (validator: AccessTokenScopeValidator<GeographyAuthorApiAccessTokenScopes>) =>
  checkAccess(validator)

function api(app: express.Express): express.Express {
  app.use(GeographyAuthorApiVersionMiddleware)

  app.get(
    pathPrefix('/geographies/meta/'),
    checkGeographyAuthorApiAccess(
      scopes => scopes.includes('geographies:read:published') || scopes.includes('geographies:read:unpublished')
    ),
    GetAllGeographyMetadataHandler
  )

  app.post(
    pathPrefix('/geographies/'),
    checkGeographyAuthorApiAccess(scopes => scopes.includes('geographies:write')),
    CreateGeographyHandler
  )

  app.put(
    pathPrefix('/geographies/:geography_id'),
    checkGeographyAuthorApiAccess(scopes => scopes.includes('geographies:write')),
    UpdateGeographyHandler
  )

  app.delete(
    pathPrefix('/geographies/:geography_id'),
    checkGeographyAuthorApiAccess(scopes => scopes.includes('geographies:write')),
    DeleteGeographyHandler
  )

  app.get(
    pathPrefix('/geographies/:geography_id/meta'),
    checkGeographyAuthorApiAccess(
      scopes => scopes.includes('geographies:read:published') || scopes.includes('geographies:read:unpublished')
    ),
    GetGeographyMetadataHandler
  )

  app.put(
    pathPrefix('/geographies/:geography_id/meta'),
    checkGeographyAuthorApiAccess(scopes => scopes.includes('geographies:write')),
    UpdateGeographyMetadataHandler
  )

  app
    .put(
      pathPrefix('/geographies/:geography_id/publish'),
      checkGeographyAuthorApiAccess(scopes => scopes.includes('geographies:publish')),
      PublishGeographyHandler
    )
    .use(ApiErrorHandlingMiddleware)

  return app
}

export { api }

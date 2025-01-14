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

import type {
  ApiRequest,
  ApiRequestParams,
  ApiRequestQuery,
  ApiResponseLocalsClaims,
  ApiVersionedResponse
} from '@mds-core/mds-api-server'
import type { GeographyDomainModel } from '@mds-core/mds-geography-service'

export const GEOGRAPHY_API_SUPPORTED_VERSIONS = ['1.0.0'] as const
export type GEOGRAPHY_API_SUPPORTED_VERSION = typeof GEOGRAPHY_API_SUPPORTED_VERSIONS[number]
export const [GEOGRAPHY_API_DEFAULT_VERSION] = GEOGRAPHY_API_SUPPORTED_VERSIONS

export type GeographyApiRequest<B = {}> = ApiRequest<B>

export type GeographyApiGetGeographyRequest = GeographyApiRequest & ApiRequestParams<'geography_id'>

export type GeographyApiGetGeographiesRequest = GeographyApiRequest &
  ApiRequestQuery<'summary' | 'get_published' | 'get_unpublished'>

export type GeographyApiAccessTokenScopes =
  | 'geographies:read'
  | 'geographies:read:unpublished'
  | 'geographies:read:published'

export type GeographyApiResponse<B = {}> = ApiVersionedResponse<GEOGRAPHY_API_SUPPORTED_VERSION, B> &
  ApiResponseLocalsClaims<GeographyApiAccessTokenScopes>

export type GeographyApiGetGeographyResponseBody = {
  data: { geography: GeographyDomainModel }
}

export type GeographyApiGetGeographyResponse = GeographyApiResponse<GeographyApiGetGeographyResponseBody>

export type GeographyApiGetGeographiesResponseBody = {
  data: { geographies: (GeographyDomainModel | Omit<GeographyDomainModel, 'geography_json'>)[] }
}

export type GeographyApiGetGeographiesResponse = GeographyApiResponse<GeographyApiGetGeographiesResponseBody>

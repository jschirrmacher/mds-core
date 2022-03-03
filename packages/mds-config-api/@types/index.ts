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

import {
  ApiRequest,
  ApiRequestParams,
  ApiRequestQuery,
  ApiResponse,
  ApiResponseLocals,
  ApiResponseLocalsClaims
} from '@mds-core/mds-api-server'

export type ConfigApiRequest<B = {}> = ApiRequest<B>

export type ConfigApiResponse<B = {}> = ApiResponse<B> &
  ApiResponseLocalsClaims<never> &
  ApiResponseLocals<'properties', string[]>

export type ConfigApiGetSettingsRequest = ConfigApiRequest & ApiRequestParams<'property'> & ApiRequestQuery<'partial'>
export type ConfigApiGetMergedSettingsRequest = ConfigApiRequest & ApiRequestQuery<'partial', ['p']>

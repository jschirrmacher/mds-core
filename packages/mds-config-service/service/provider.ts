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

import { ServiceError, ServiceProvider, ServiceResult } from '@mds-core/mds-service-helpers'
import { ConfigService, ConfigServiceRequestContext } from '../@types'
import { readJsonFile } from './utils'

export const ConfigServiceProvider: ServiceProvider<ConfigService, ConfigServiceRequestContext> = {
  getSettings: async (context, properties, options) => {
    const { partial = false } = options ?? {}
    const responses = await Promise.all(properties.map(property => readJsonFile(property)))
    const result = responses.reduce<{ found: string[]; missing: string[] }>(
      (info, response, index) => {
        const property = properties[index]
        if (property) {
          return response.error
            ? { ...info, missing: [...info.missing, property] }
            : { ...info, found: [...info.found, property] }
        }
        return info
      },
      { found: [], missing: [] }
    )
    return result.missing.length > 0 && !partial
      ? ServiceError({
          type: 'NotFoundError',
          message: `Settings Not Found: ${result.missing}`
        })
      : ServiceResult(
          responses.reduce((merged, response, index) => {
            if (response.error) {
              const property = properties[index]
              return property ? Object.assign(merged, { [property]: null }) : merged
            }
            return Object.assign(merged, response.result)
          }, {})
        )
  }
}

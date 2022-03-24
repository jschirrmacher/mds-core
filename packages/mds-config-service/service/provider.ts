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

import { ConfigFileReader } from '@mds-core/mds-config-files'
import type { ServiceProvider } from '@mds-core/mds-service-helpers'
import { ServiceError, ServiceResult } from '@mds-core/mds-service-helpers'
import type { ConfigService, ConfigServiceRequestContext } from '../@types'

export const ConfigServiceProvider: ServiceProvider<ConfigService, ConfigServiceRequestContext> = {
  getSettings: async (context, properties, options) => {
    const config = ConfigFileReader.mount()
    const { partial = false } = options ?? {}
    const files = await Promise.allSettled(properties.map(property => config.readConfigFile(property)))
    const result = files.reduce<{ found: string[]; missing: string[] }>(
      (info, { status }, index) => {
        const property = properties[index]
        if (property) {
          if (status === 'fulfilled') {
            return { ...info, found: [...info.found, property] }
          }
          return { ...info, missing: [...info.missing, property] }
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
          files.reduce((merged, file, index) => {
            const property = properties[index]
            if (property) {
              const value = file.status === 'fulfilled' ? file.value : { [property]: null }
              return Object.assign(merged, value)
            }
            return merged
          }, {})
        )
  }
}

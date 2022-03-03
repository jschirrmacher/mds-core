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

import { isServiceError } from '@mds-core/mds-service-helpers'
import { ConfigServiceClientFactory } from '../client'
import { ConfigServiceManager } from '../service/manager'

const { MDS_CONFIG_PATH } = process.env

const ConfigServer = ConfigServiceManager.controller()

describe('Test Config Client', () => {
  beforeAll(async () => {
    process.env.MDS_CONFIG_PATH = './'
    await ConfigServer.start()
  })

  it('Single Settings File (missing)', async () => {
    try {
      const ConfigServiceClient = ConfigServiceClientFactory<{ missing: unknown }>({})
      const settings = await ConfigServiceClient.getSettings(['missing'])
      expect(settings).toEqual(null)
    } catch (error) {
      expect(isServiceError(error) && error.type).toEqual('NotFoundError')
    }
  })

  it('Single Settings File (partial)', async () => {
    try {
      const ConfigServiceClient = ConfigServiceClientFactory<{ missing: unknown }>({})
      const settings = await ConfigServiceClient.getSettings(['missing'], {
        partial: true
      })
      expect(settings.missing).toEqual(null)
    } catch (error) {
      expect(error).toEqual(null)
    }
  })

  it('Single Settings File', async () => {
    try {
      const ConfigServiceClient = ConfigServiceClientFactory<{ name: string }>({})
      const settings = await ConfigServiceClient.getSettings(['package'])
      expect(settings.name).toEqual('@mds-core/mds-config-service')
    } catch (error) {
      expect(error).toEqual(null)
    }
  })

  it('Multiple Settings File (missing)', async () => {
    try {
      const ConfigServiceClient = ConfigServiceClientFactory<{ missing: unknown }>({})
      const settings = await ConfigServiceClient.getSettings(['package', 'missing'])
      expect(settings).toEqual(null)
    } catch (error) {
      expect(isServiceError(error) && error.type).toEqual('NotFoundError')
    }
  })

  it('Multiple Settings File (partial)', async () => {
    try {
      const ConfigServiceClient = ConfigServiceClientFactory<{ missing: unknown }>({})
      const settings = (await ConfigServiceClient.getSettings(['package', 'missing'], {
        partial: true
      })) as { name: string; missing: unknown }
      expect(settings.name).toEqual('@mds-core/mds-config-service')
      expect(settings.missing).toEqual(null)
    } catch (error) {
      expect(error).toEqual(null)
    }
  })

  it('Multiple Settings File', async () => {
    try {
      const ConfigServiceClient = ConfigServiceClientFactory<{
        name: string
        compilerOptions: { outDir?: string }
      }>({})
      const settings = await ConfigServiceClient.getSettings(['package', 'tsconfig.build'])
      expect(settings.name).toEqual('@mds-core/mds-config-service')
      expect(settings.compilerOptions?.outDir).toEqual('dist')
    } catch (error) {
      expect(error).toEqual(null)
    }
  })

  afterAll(async () => {
    await ConfigServer.stop()
    process.env.MDS_CONFIG_PATH = MDS_CONFIG_PATH
  })
})

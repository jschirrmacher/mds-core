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
import { RpcService, RpcServiceManager } from '@mds-core/mds-rpc-common'
import { ConfigServiceDefinition } from '../@types'
import { ConfigServiceClient } from '../client'
import { ConfigServiceLogger as logger } from '../logger'
import { ConfigServiceProvider } from './provider'

export const ConfigServiceManager = RpcServiceManager({
  port: process.env.CONFIG_SERVICE_RPC_PORT,
  repl: {
    port: process.env.CONFIG_SERVICE_REPL_PORT,
    context: { client: ConfigServiceClient }
  }
}).for(
  RpcService(
    ConfigServiceDefinition,
    {
      onStart: async () => {
        try {
          logger.info(`Using Settings Files mounted at ${ConfigFileReader.mount().path}`)
        } catch {}
      },
      onStop: async () => undefined
    },
    {
      getSettings: (args, context) => ConfigServiceProvider.getSettings(context, ...args)
    }
  )
)

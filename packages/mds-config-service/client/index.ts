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

import { RpcClient, RpcRequest, RpcRequestOptions } from '@mds-core/mds-rpc-common'
import { SerializedBuffers, ServiceClient } from '@mds-core/mds-service-helpers'
import { ConfigService, ConfigServiceDefinition, ConfigServiceRequestContext } from '../@types'

export const ConfigServiceClientFactory = <S = {}>(
  context: ConfigServiceRequestContext,
  options: RpcRequestOptions = {}
): ServiceClient<ConfigService<S>> => {
  const ConfigServiceRpcClient = RpcClient(ConfigServiceDefinition, {
    context,
    host: process.env.CONFIG_SERVICE_RPC_HOST,
    port: process.env.CONFIG_SERVICE_RPC_PORT
  })

  return {
    getSettings: (...args) =>
      RpcRequest(options, ConfigServiceRpcClient.getSettings, args) as Promise<SerializedBuffers<S>>
  }
}

export const ConfigServiceClient = ConfigServiceClientFactory({})

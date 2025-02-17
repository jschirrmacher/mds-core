/**
 * Copyright 2021 City of Los Angeles
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

import type { RpcRequestOptions } from '@mds-core/mds-rpc-common'
import { RpcClient, RpcRequest } from '@mds-core/mds-rpc-common'
import type { ServiceClient } from '@mds-core/mds-service-helpers'
import type { CollectorService, CollectorServiceRequestContext } from '../@types'
import { CollectorServiceRpcDefinition } from '../@types'

export const CollectorServiceClientFactory = (
  context: CollectorServiceRequestContext,
  options: RpcRequestOptions = {}
): ServiceClient<CollectorService> => {
  const CollectorServiceRpcClient = RpcClient(CollectorServiceRpcDefinition, {
    context,
    host: process.env.COLLECTOR_SERVICE_RPC_HOST,
    port: process.env.COLLECTOR_SERVICE_RPC_PORT
  })

  return {
    registerMessageSchema: (...args) => RpcRequest(options, CollectorServiceRpcClient.registerMessageSchema, args),
    getMessageSchema: (...args) => RpcRequest(options, CollectorServiceRpcClient.getMessageSchema, args),
    writeSchemaMessages: (...args) => RpcRequest(options, CollectorServiceRpcClient.writeSchemaMessages, args)
  }
}

export const CollectorServiceClient = CollectorServiceClientFactory({})

export type { CollectorMessageDomainCreateModel } from '../@types'

/**
 * Copyright 2020 City of Los Angeles
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
import type { PolicyService, PolicyServiceRequestContext } from '../@types'
import { PolicyServiceDefinition } from '../@types'

// What the API layer, and any other clients, will invoke.
export const PolicyServiceClientFactory = (
  context: PolicyServiceRequestContext,
  options: RpcRequestOptions = {}
): ServiceClient<PolicyService> => {
  const PolicyServiceRpcClient = RpcClient(PolicyServiceDefinition, {
    context,
    host: process.env.POLICY_SERVICE_RPC_HOST,
    port: process.env.POLICY_SERVICE_RPC_PORT
  })

  return {
    name: (...args) => RpcRequest(options, PolicyServiceRpcClient.name, args),
    writePolicy: (...args) => RpcRequest(options, PolicyServiceRpcClient.writePolicy, args),
    readPolicies: (...args) => RpcRequest(options, PolicyServiceRpcClient.readPolicies, args),
    readActivePolicies: (...args) => RpcRequest(options, PolicyServiceRpcClient.readActivePolicies, args),
    deletePolicy: (...args) => RpcRequest(options, PolicyServiceRpcClient.deletePolicy, args),
    editPolicy: (...args) => RpcRequest(options, PolicyServiceRpcClient.editPolicy, args),
    publishPolicy: (...args) => RpcRequest(options, PolicyServiceRpcClient.publishPolicy, args),
    readBulkPolicyMetadata: (...args) => RpcRequest(options, PolicyServiceRpcClient.readBulkPolicyMetadata, args),
    readPolicy: (...args) => RpcRequest(options, PolicyServiceRpcClient.readPolicy, args),
    readSinglePolicyMetadata: (...args) => RpcRequest(options, PolicyServiceRpcClient.readSinglePolicyMetadata, args),
    updatePolicyMetadata: (...args) => RpcRequest(options, PolicyServiceRpcClient.updatePolicyMetadata, args),
    writePolicyMetadata: (...args) => RpcRequest(options, PolicyServiceRpcClient.writePolicyMetadata, args)
  }
}

export const PolicyServiceClient = PolicyServiceClientFactory({})

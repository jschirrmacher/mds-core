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

import { RpcClient, RpcRequestOptions, RpcRequestWithOptions } from '@mds-core/mds-rpc-common'
import { ServiceClient } from '@mds-core/mds-service-helpers'
import { JurisdictionService, JurisdictionServiceDefinition } from '../@types'

const JurisdictionServiceRpcClient = RpcClient(JurisdictionServiceDefinition, {
  host: process.env.JURISDICTION_SERVICE_RPC_HOST,
  port: process.env.JURISDICTION_SERVICE_RPC_PORT
})

export const JurisdictionServiceClientFactory = (
  options: RpcRequestOptions = {}
): ServiceClient<JurisdictionService> => ({
  createJurisdiction: (...args) =>
    RpcRequestWithOptions(options, JurisdictionServiceRpcClient.createJurisdiction, args),
  createJurisdictions: (...args) =>
    RpcRequestWithOptions(options, JurisdictionServiceRpcClient.createJurisdictions, args),
  deleteJurisdiction: (...args) =>
    RpcRequestWithOptions(options, JurisdictionServiceRpcClient.deleteJurisdiction, args),
  getJurisdiction: (...args) => RpcRequestWithOptions(options, JurisdictionServiceRpcClient.getJurisdiction, args),
  getJurisdictions: (...args) => RpcRequestWithOptions(options, JurisdictionServiceRpcClient.getJurisdictions, args),
  updateJurisdiction: (...args) => RpcRequestWithOptions(options, JurisdictionServiceRpcClient.updateJurisdiction, args)
})

export const JurisdictionServiceClient = JurisdictionServiceClientFactory()

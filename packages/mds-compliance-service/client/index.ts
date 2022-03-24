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
import type { ComplianceService, ComplianceServiceRequestContext } from '../@types'
import { ComplianceServiceDefinition } from '../@types'

// What the API layer, and any other clients, will invoke.
export const ComplianceServiceClientFactory = (
  context: ComplianceServiceRequestContext,
  options: RpcRequestOptions = {}
): ServiceClient<ComplianceService> => {
  const ComplianceServiceRpcClient = RpcClient(ComplianceServiceDefinition, {
    context,
    host: process.env.COMPLIANCE_SERVICE_RPC_HOST,
    port: process.env.COMPLIANCE_SERVICE_RPC_PORT
  })

  return {
    getComplianceSnapshot: (...args) => RpcRequest(options, ComplianceServiceRpcClient.getComplianceSnapshot, args),
    getComplianceSnapshotsByTimeInterval: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.getComplianceSnapshotsByTimeInterval, args),
    getComplianceSnapshotsByIDs: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.getComplianceSnapshotsByIDs, args),
    createComplianceSnapshot: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.createComplianceSnapshot, args),
    createComplianceSnapshots: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.createComplianceSnapshots, args),
    getComplianceViolationPeriods: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.getComplianceViolationPeriods, args),
    getComplianceViolation: (...args) => RpcRequest(options, ComplianceServiceRpcClient.getComplianceViolation, args),
    getComplianceViolationsByTimeInterval: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.getComplianceViolationsByTimeInterval, args),
    createComplianceViolation: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.createComplianceViolation, args),
    createComplianceViolations: (...args) =>
      RpcRequest(options, ComplianceServiceRpcClient.createComplianceViolations, args)
  }
}

export const ComplianceServiceClient = ComplianceServiceClientFactory({})

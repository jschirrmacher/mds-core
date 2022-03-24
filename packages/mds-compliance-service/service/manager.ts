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

import { RpcServer } from '@mds-core/mds-rpc-common'
import type { ComplianceService, ComplianceServiceRequestContext } from '../@types'
import { ComplianceServiceDefinition } from '../@types'
import { ComplianceServiceClient } from '../client'
import { ComplianceServiceProvider } from './provider'

export const ComplianceServiceManager = RpcServer<ComplianceService, ComplianceServiceRequestContext>(
  ComplianceServiceDefinition,
  {
    onStart: ComplianceServiceProvider.start,
    onStop: ComplianceServiceProvider.stop
  },
  {
    createComplianceSnapshot: (args, context) => ComplianceServiceProvider.createComplianceSnapshot(context, ...args),
    createComplianceSnapshots: (args, context) => ComplianceServiceProvider.createComplianceSnapshots(context, ...args),
    createComplianceViolation: (args, context) => ComplianceServiceProvider.createComplianceViolation(context, ...args),
    createComplianceViolations: (args, context) =>
      ComplianceServiceProvider.createComplianceViolations(context, ...args),
    getComplianceSnapshot: (args, context) => ComplianceServiceProvider.getComplianceSnapshot(context, ...args),
    getComplianceSnapshotsByTimeInterval: (args, context) =>
      ComplianceServiceProvider.getComplianceSnapshotsByTimeInterval(context, ...args),
    getComplianceSnapshotsByIDs: (args, context) =>
      ComplianceServiceProvider.getComplianceSnapshotsByIDs(context, ...args),
    getComplianceViolationPeriods: (args, context) =>
      ComplianceServiceProvider.getComplianceViolationPeriods(context, ...args),
    getComplianceViolation: (args, context) => ComplianceServiceProvider.getComplianceViolation(context, ...args),
    getComplianceViolationsByTimeInterval: (args, context) =>
      ComplianceServiceProvider.getComplianceViolationsByTimeInterval(context, ...args)
  },
  {
    port: process.env.COMPLIANCE_SERVICE_RPC_PORT,
    repl: {
      port: process.env.COMPLIANCE_SERVICE_REPL_PORT,
      context: { client: ComplianceServiceClient }
    },
    maxRequestSize: '30mb'
  }
)

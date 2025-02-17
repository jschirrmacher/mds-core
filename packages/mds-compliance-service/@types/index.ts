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

import type { RpcEmptyRequestContext, RpcServiceDefinition } from '@mds-core/mds-rpc-common'
import { RpcRoute } from '@mds-core/mds-rpc-common'
import type { Nullable, Timestamp, UUID, VEHICLE_EVENT, VEHICLE_STATE } from '@mds-core/mds-types'

export interface MatchedVehicleInformation {
  device_id: UUID
  state: VEHICLE_STATE
  event_types: VEHICLE_EVENT[]
  timestamp: Timestamp
  /** A vehicle/event pair may match the *logical criteria* for multiple rules within a policy */
  rules_matched: UUID[]
  /** Only one rule can be *applied* to a vehicle/event pair in the context of compliance */
  rule_applied?: UUID
  speed?: number
  gps: {
    lat: number
    lng: number
  }
}

export interface ComplianceSnapshotDomainModel {
  compliance_as_of: Timestamp
  compliance_snapshot_id: UUID
  policy: {
    name: string
    policy_id: UUID
  }
  provider_id: UUID
  /**
   * All vehicles found that met the logical criteria for the policy (not necessarily vehicles that were in violation)
   */
  vehicles_found: MatchedVehicleInformation[]
  /**
   * All vehicles found to be in violation of the policy. This is a subset of `vehicles_found`,
   * and is based on which vehicle events were most recent.
   */
  violating_vehicles: MatchedVehicleInformation[]
  excess_vehicles_count: number
  total_violations: number
}

/**
 * If a generated snapshot can't be written to Kafka, make a note for later cleanup
 */
export interface ComplianceSnapshotKafkaFailureDomainModel {
  timestamp: Timestamp
  compliance_snapshot_id: UUID
}

/**
 * A violation period starts with the first compliance snapshot that has a violation, and ends
 * with the first snapshot that has no violations. E.g. if A, B, C, D, and E are snapshots,
 * and A and E have no violations, the violation period contains B, C and D, and the end_time is
 * the compliance_as_of timestamp on E.
 */
export interface ComplianceViolationPeriodDomainModel {
  compliance_snapshot_ids: UUID[]
  start_time: Timestamp
  end_time: Timestamp | null
}

export interface ComplianceAggregateDomainModel {
  policy_id: UUID
  provider_id: UUID
  provider_name: string
  violation_periods: ComplianceViolationPeriodDomainModel[]
}

export interface ComplianceViolationPeriodEntityModel {
  provider_id: UUID
  policy_id: UUID
  start_time: Timestamp
  end_time: Timestamp
  real_end_time: Timestamp | null
  compliance_snapshot_ids: UUID[]
  sum_total_violations: number
}

export interface ComplianceViolationDetailsEvent {
  /** Timestamp of the event that triggered the violation */
  event_timestamp: Timestamp
  /** The device that violated the policy */
  device_id: UUID
  /** Pointer to the trip which was ongoing when this violation occurred (if any) */
  trip_id: Nullable<UUID>
}

export interface ComplianceViolationDomainModel {
  /** Unique ID for the violation */
  violation_id: UUID
  /** Timestamp of the violation being generated */
  timestamp: Timestamp
  /** The policy that was violated */
  policy_id: UUID
  /** Provider managing whatever entity violated the policy */
  provider_id: UUID
  /** The rule that was applied */
  rule_id: UUID
  /** Details of the violation (linkage to other tables) */
  violation_details: ComplianceViolationDetailsEvent
}

export type GetComplianceSnapshotOptions =
  | {
      compliance_snapshot_id: UUID
    }
  | {
      provider_id: UUID
      policy_id: UUID
      compliance_as_of: Timestamp
    }

export type GetComplianceSnapshotsByTimeIntervalOptions = {
  start_time: Timestamp
  end_time?: Nullable<Timestamp>
  policy_ids?: Nullable<UUID[]>
  provider_ids?: Nullable<UUID[]>
}

export type GetComplianceViolationPeriodsOptions = {
  start_time: Timestamp
  provider_ids?: UUID[]
  policy_ids?: UUID[]
  end_time?: Timestamp
}

export type GetComplianceViolationOptions =
  | {
      violation_id: UUID
    }
  | {
      event_timestamp: Timestamp
      device_id: UUID
      trip_id?: UUID
    }

export type GetComplianceViolationsByTimeIntervalOptions = {
  start_time: Timestamp
  provider_ids?: UUID[]
  policy_ids?: UUID[]
  end_time?: Timestamp
}

export interface ComplianceService {
  createComplianceSnapshots: (complianceSnapshots: ComplianceSnapshotDomainModel[]) => ComplianceSnapshotDomainModel[]
  createComplianceSnapshot: (complianceSnapshot: ComplianceSnapshotDomainModel) => ComplianceSnapshotDomainModel
  createComplianceViolation: (complianceViolation: ComplianceViolationDomainModel) => ComplianceViolationDomainModel
  createComplianceViolations: (
    complianceViolations: ComplianceViolationDomainModel[]
  ) => ComplianceViolationDomainModel[]
  getComplianceSnapshotsByTimeInterval: (
    options: GetComplianceSnapshotsByTimeIntervalOptions
  ) => ComplianceSnapshotDomainModel[]
  getComplianceSnapshotsByIDs: (ids: UUID[]) => ComplianceSnapshotDomainModel[]
  getComplianceSnapshot: (options: GetComplianceSnapshotOptions) => ComplianceSnapshotDomainModel
  getComplianceViolationPeriods: (options: GetComplianceViolationPeriodsOptions) => ComplianceAggregateDomainModel[]
  getComplianceViolation: (options: GetComplianceViolationOptions) => ComplianceViolationDomainModel
  getComplianceViolationsByTimeInterval: (
    options: GetComplianceViolationsByTimeIntervalOptions
  ) => ComplianceViolationDomainModel[]
}

export const ComplianceServiceDefinition: RpcServiceDefinition<ComplianceService> = {
  createComplianceSnapshots: RpcRoute<ComplianceService['createComplianceSnapshots']>(),
  createComplianceSnapshot: RpcRoute<ComplianceService['createComplianceSnapshot']>(),
  createComplianceViolation: RpcRoute<ComplianceService['createComplianceViolation']>(),
  createComplianceViolations: RpcRoute<ComplianceService['createComplianceViolations']>(),
  getComplianceSnapshotsByTimeInterval: RpcRoute<ComplianceService['getComplianceSnapshotsByTimeInterval']>(),
  getComplianceSnapshotsByIDs: RpcRoute<ComplianceService['getComplianceSnapshotsByIDs']>(),
  getComplianceSnapshot: RpcRoute<ComplianceService['getComplianceSnapshot']>(),
  getComplianceViolationPeriods: RpcRoute<ComplianceService['getComplianceViolationPeriods']>(),
  getComplianceViolation: RpcRoute<ComplianceService['getComplianceViolation']>(),
  getComplianceViolationsByTimeInterval: RpcRoute<ComplianceService['getComplianceViolationsByTimeInterval']>()
}

export type ComplianceServiceRequestContext = RpcEmptyRequestContext

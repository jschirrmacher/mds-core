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

import { DomainModelCreate } from '@mds-core/mds-repository'
import { RpcRoute, RpcServiceDefinition } from '@mds-core/mds-rpc-common'
import { Nullable, Rule, Timestamp, UUID } from '@mds-core/mds-types'

export const POLICY_STATUS = <const>['draft', 'pending', 'active', 'expired', 'deactivated', 'unknown']
export type POLICY_STATUS = typeof POLICY_STATUS[number]

export interface PolicyDomainModel {
  policy_id: UUID
  name: string
  currency: Nullable<string>
  description: string
  provider_ids: Nullable<UUID[]>
  start_date: Timestamp
  end_date: Nullable<Timestamp>
  prev_policies: Nullable<UUID[]>
  rules: Rule[]
  publish_date: Nullable<Timestamp>
  status?: POLICY_STATUS // Computed property which is returned from the service, not written on creation.
}

export type PolicyDomainCreateModel = DomainModelCreate<PolicyDomainModel>

export interface PolicyMetadataDomainModel<M extends {} = {}> {
  policy_id: UUID
  policy_metadata: Nullable<Partial<M>>
}

export type PolicyMetadataDomainCreateModel = DomainModelCreate<PolicyMetadataDomainModel>

export type PresentationOptions = { withStatus?: boolean }

export interface PolicyService {
  name: () => string
  writePolicy: (policy: PolicyDomainCreateModel) => PolicyDomainModel
  readPolicies: (params: ReadPolicyQueryParams, presentationOptions?: PresentationOptions) => PolicyDomainModel[]
  readActivePolicies: (timestamp: Timestamp) => PolicyDomainModel[]
  deletePolicy: (policy_id: UUID) => UUID
  editPolicy: (policy: PolicyDomainCreateModel) => PolicyDomainModel
  publishPolicy: (policy_id: UUID, publish_date: Timestamp) => PolicyDomainModel
  readBulkPolicyMetadata: <M>(params: ReadPolicyQueryParams) => PolicyMetadataDomainModel<M>[]
  readPolicy: (policy_id: UUID, presentationOptions?: PresentationOptions) => PolicyDomainModel
  readSinglePolicyMetadata: <M>(policy_id: UUID) => PolicyMetadataDomainModel<M>
  updatePolicyMetadata: (policy_metadata: PolicyMetadataDomainModel) => PolicyMetadataDomainModel
  writePolicyMetadata: (policy_metadata: PolicyMetadataDomainModel) => PolicyMetadataDomainModel
}

export const PolicyServiceDefinition: RpcServiceDefinition<PolicyService> = {
  name: RpcRoute<PolicyService['name']>(),
  writePolicy: RpcRoute<PolicyService['writePolicy']>(),
  readPolicies: RpcRoute<PolicyService['readPolicies']>(),
  readActivePolicies: RpcRoute<PolicyService['readActivePolicies']>(),
  deletePolicy: RpcRoute<PolicyService['deletePolicy']>(),
  editPolicy: RpcRoute<PolicyService['editPolicy']>(),
  publishPolicy: RpcRoute<PolicyService['publishPolicy']>(),
  readBulkPolicyMetadata: RpcRoute<PolicyService['readBulkPolicyMetadata']>(),
  readPolicy: RpcRoute<PolicyService['readPolicy']>(),
  readSinglePolicyMetadata: RpcRoute<PolicyService['readSinglePolicyMetadata']>(),
  updatePolicyMetadata: RpcRoute<PolicyService['updatePolicyMetadata']>(),
  writePolicyMetadata: RpcRoute<PolicyService['writePolicyMetadata']>()
}

export interface ReadPolicyQueryParams {
  policy_ids?: UUID[]
  rule_id?: UUID
  name?: string
  description?: string
  start_date?: Timestamp
  get_unpublished?: Nullable<boolean>
  get_published?: Nullable<boolean>
  statuses?: Exclude<POLICY_STATUS, 'unknown'>[]
  geography_ids?: Nullable<UUID[]>
}

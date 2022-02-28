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

import { BigintTransformer, EntityCreateModel, IdentityColumn, RecordedColumn } from '@mds-core/mds-repository'
import { Timestamp, UUID } from '@mds-core/mds-types'
import { Column, Entity, Index } from 'typeorm'
import { MatchedVehicleInformation } from '../../@types'

export interface ComplianceSnapshotEntityModel extends IdentityColumn, RecordedColumn {
  compliance_snapshot_id: UUID
  compliance_as_of: Timestamp
  provider_id: UUID
  policy_name: string
  policy_id: UUID
  excess_vehicles_count: number
  total_violations: number
  vehicles_found: MatchedVehicleInformation[]
  violating_vehicles: MatchedVehicleInformation[]
}

@Entity('compliance_snapshots')
export class ComplianceSnapshotEntity
  extends IdentityColumn(RecordedColumn(class {}))
  implements ComplianceSnapshotEntityModel
{
  @Column('uuid', { primary: true })
  compliance_snapshot_id: ComplianceSnapshotEntityModel['compliance_snapshot_id']

  @Column('bigint', { transformer: BigintTransformer })
  @Index()
  compliance_as_of: ComplianceSnapshotEntityModel['compliance_as_of']

  @Column('uuid')
  @Index()
  provider_id: ComplianceSnapshotEntityModel['provider_id']

  @Column('varchar', { length: 255 })
  policy_name: ComplianceSnapshotEntityModel['policy_name']

  @Column('uuid')
  @Index()
  policy_id: ComplianceSnapshotEntityModel['policy_id']

  @Column('int')
  excess_vehicles_count: ComplianceSnapshotEntityModel['excess_vehicles_count']

  @Column('int')
  total_violations: ComplianceSnapshotEntityModel['total_violations']

  @Column('jsonb')
  vehicles_found: ComplianceSnapshotEntityModel['vehicles_found']

  @Column('jsonb', { default: '[]' })
  violating_vehicles: MatchedVehicleInformation[]
}

export type ComplianceSnapshotEntityCreateModel = EntityCreateModel<ComplianceSnapshotEntityModel>

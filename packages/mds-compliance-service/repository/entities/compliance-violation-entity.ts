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

import type { EntityCreateModel } from '@mds-core/mds-repository'
import { BigintTransformer, IdentityColumn, RecordedColumn } from '@mds-core/mds-repository'
import type { Nullable, Timestamp, UUID } from '@mds-core/mds-types'
import { Column, Entity } from 'typeorm'

export interface ComplianceViolationEntityModel extends IdentityColumn, RecordedColumn {
  violation_id: UUID
  timestamp: Timestamp
  policy_id: UUID
  provider_id: UUID
  rule_id: UUID
  event_timestamp: Timestamp
  device_id: UUID
  trip_id: Nullable<UUID>
}

@Entity('compliance_violations')
export class ComplianceViolationEntity
  extends IdentityColumn(RecordedColumn(class {}))
  implements ComplianceViolationEntityModel
{
  @Column('uuid', { primary: true })
  violation_id: ComplianceViolationEntityModel['violation_id']

  @Column('bigint', { transformer: BigintTransformer })
  timestamp: ComplianceViolationEntityModel['timestamp']

  @Column('uuid')
  policy_id: ComplianceViolationEntityModel['policy_id']

  @Column('uuid')
  provider_id: ComplianceViolationEntityModel['provider_id']

  @Column('uuid')
  rule_id: ComplianceViolationEntityModel['rule_id']

  @Column('bigint', { transformer: BigintTransformer })
  event_timestamp: ComplianceViolationEntityModel['event_timestamp']

  @Column('uuid')
  device_id: ComplianceViolationEntityModel['device_id']

  @Column('uuid', { nullable: true })
  trip_id: ComplianceViolationEntityModel['trip_id']
}

export type ComplianceViolationEntityCreateModel = EntityCreateModel<ComplianceViolationEntityModel>

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

import { BigintTransformer, EntityCreateModel, IdentityColumn } from '@mds-core/mds-repository'
import { Nullable, Timestamp, UUID } from '@mds-core/mds-types'
import { Column, Entity, Index } from 'typeorm'
import { PolicyDomainModel } from '../../@types'

export interface PolicyEntityModel extends IdentityColumn {
  policy_id: PolicyDomainModel['policy_id']
  policy_json: Omit<PolicyDomainModel, 'start_date' | 'end_date' | 'publish_date'>
  superseded_by: Nullable<UUID[]>
  start_date: Timestamp
  end_date: Nullable<Timestamp>
  publish_date: Nullable<Timestamp>
}

@Entity('policies')
export class PolicyEntity extends IdentityColumn(class {}) implements PolicyEntityModel {
  @Column('uuid', { primary: true })
  policy_id: PolicyEntityModel['policy_id']

  @Column('json')
  policy_json: PolicyEntityModel['policy_json']

  @Column('uuid', { nullable: true, array: true })
  superseded_by: PolicyEntityModel['superseded_by']

  @Column('bigint', { transformer: BigintTransformer })
  @Index()
  start_date: Timestamp

  @Column('bigint', { transformer: BigintTransformer, nullable: true })
  @Index()
  end_date: Nullable<Timestamp>

  @Column('bigint', { transformer: BigintTransformer, nullable: true })
  @Index()
  publish_date: Nullable<Timestamp>
}

export type PolicyEntityCreateModel = EntityCreateModel<PolicyEntityModel>

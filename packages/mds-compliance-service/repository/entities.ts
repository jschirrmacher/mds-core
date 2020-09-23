import { Column, Entity, PrimaryColumn } from 'typeorm'
import { UUID, Timestamp } from '@mds-core/mds-types'
import { BigintTransformer, IdentityColumn, RecordedColumn } from '@mds-core/mds-repository'
import { ComplianceResponse, ComplianceResponseDomainModel } from '../@types'

export interface ComplianceResponsePersistenceModel extends IdentityColumn, RecordedColumn {
  compliance_response_id: ComplianceResponseDomainModel['compliance_response_id']
  provider_id: ComplianceResponseDomainModel['provider_id']
  compliance_json: ComplianceResponseDomainModel['compliance_json']
  timestamp: ComplianceResponseDomainModel['timestamp']
}

@Entity('compliance_response')
export class ComplianceResponsePersistenceEntity
  extends IdentityColumn(RecordedColumn(class {}))
  implements ComplianceResponsePersistenceModel {
  @Column('uuid', { primary: true })
  compliance_response_id: UUID

  @Column('uuid')
  provider_id: UUID

  @Column('bigint', { transformer: BigintTransformer })
  timestamp: Timestamp

  @Column('jsonb', { transformer: BigintTransformer })
  compliance_json: ComplianceResponse
}
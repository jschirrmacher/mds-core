import { Optional } from '@mds-core/mds-types'
import { RecordedColumn, IdentityColumn, ModelMapper } from '@mds-core/mds-repository'
import { ComplianceResponsePersistenceModel } from './entities'
import { ComplianceResponseDomainModel } from '../@types'

export const ComplianceResponsePersistenceModelToDomainModel = ModelMapper<
  ComplianceResponsePersistenceModel,
  ComplianceResponseDomainModel
>((entity, options) => {
  const { id, recorded, ...domain } = entity
  return domain
})

/*
type ComplianceResponsePersistenceCreateModel = Omit<
  Optional<ComplianceResponsePersistenceModel, keyof RecordedColumn>,
  keyof IdentityColumn
>

*/

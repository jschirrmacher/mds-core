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

import { ModelMapper } from '@mds-core/mds-repository'
import { now } from '@mds-core/mds-utils'
import {
  PolicyDomainCreateModel,
  PolicyDomainModel,
  PolicyMetadataDomainCreateModel,
  PolicyMetadataDomainModel,
  POLICY_STATUS
} from '../@types'
import { PolicyEntityCreateModel, PolicyEntityModel } from './entities/policy-entity'
import { PolicyMetadataEntityCreateModel, PolicyMetadataEntityModel } from './entities/policy-metadata-entity'

type PolicyEntityToDomainOptions = Partial<{ withStatus: boolean }>

export const derivePolicyStatus = (policy: PolicyEntityModel): POLICY_STATUS => {
  const { superseded_by, start_date, publish_date, end_date } = policy
  const currentTime = now()

  if (publish_date === null) {
    return 'draft'
  }

  if (superseded_by !== null && superseded_by.length >= 1) {
    return 'deactivated'
  }

  if (end_date !== null && end_date < currentTime) {
    return 'expired'
  }

  if (publish_date < currentTime && start_date > currentTime) {
    return 'pending'
  }

  if (start_date < currentTime && publish_date < currentTime) {
    return 'active'
  }

  return 'unknown'
}

export const PolicyEntityToDomain = ModelMapper<PolicyEntityModel, PolicyDomainModel, PolicyEntityToDomainOptions>(
  (entity, options) => {
    const { policy_json, id, superseded_by, ...rest } = entity
    if (options?.withStatus) {
      const status = derivePolicyStatus(entity)
      return {
        ...policy_json,
        ...rest,
        status
      }
    }
    return {
      ...policy_json,
      ...rest
    }
  }
)

type PolicyEntityCreateOptions = Partial<{}>

/**
 * publish_date is set to null if passed through this mapper
 */
export const PolicyDomainToEntityCreate = ModelMapper<
  PolicyDomainCreateModel,
  PolicyEntityCreateModel,
  PolicyEntityCreateOptions
>((entity, _options) => {
  const { currency = null, provider_ids = null, end_date = null, prev_policies = null, start_date, ...domain } = entity
  const { policy_id } = domain
  return {
    policy_id,
    superseded_by: null,
    end_date,
    publish_date: null,
    start_date,
    policy_json: {
      currency,
      provider_ids,
      prev_policies,
      ...domain
    }
  }
})

type PolicyMetadataEntityToDomainOptions = Partial<{}>

export const PolicyMetadataEntityToDomain = ModelMapper<
  PolicyMetadataEntityModel,
  PolicyMetadataDomainModel,
  PolicyMetadataEntityToDomainOptions
>((entity, options) => {
  const { id, policy_metadata = null, ...domain } = entity
  return { policy_metadata, ...domain }
})

type PolicyMetadataEntityCreateOptions = Partial<{}>

export const PolicyMetadataDomainToEntityCreate = ModelMapper<
  PolicyMetadataDomainCreateModel,
  PolicyMetadataEntityCreateModel,
  PolicyMetadataEntityCreateOptions
>(({ policy_metadata = null, ...domain }, options) => {
  return { policy_metadata, ...domain }
})

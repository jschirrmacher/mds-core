// TODO copyright
// TODO this is copypasta

import { PolicyDomainModel } from '@mds-core/mds-policy-service'
import { days } from '@mds-core/mds-utils'

export const TIME = 1605821758034
export const POLICY_ID_1 = '6d7a9c7e-853c-4ff7-a86f-e17c06d3bd80'
export const POLICY_ID_2 = 'dfe3f757-c43a-4eb6-b85e-abc00f3e8387'
export const PROVIDER_ID_1 = 'c20e08cf-8488-46a6-a66c-5d8fb827f7e0'
export const PROVIDER_ID_2 = '63f13c48-34ff-49d2-aca7-cf6a5b6171c3'
const GEOGRAPHY_UUID = '1f943d59-ccc9-4d91-b6e2-0c5e771cbc49'

export const POLICY1: PolicyDomainModel = {
  name: 'Policy 1',
  description: 'Mobility caps as described in the One-Year Permit',
  policy_id: POLICY_ID_1,
  start_date: TIME - days(30),
  end_date: null,
  publish_date: TIME - days(30),
  prev_policies: null,
  currency: null,
  provider_ids: [],
  rules: [
    {
      rule_type: 'count',
      rule_id: '7ea0d16e-ad15-4337-9722-9924e3af9146',
      name: 'Greater LA',
      geographies: [GEOGRAPHY_UUID],
      states: { available: [], removed: [], reserved: [], on_trip: [] },
      vehicle_types: ['bicycle', 'scooter'],
      maximum: 3000,
      minimum: 500
    }
  ]
}

export const POLICY2: PolicyDomainModel = {
  name: 'Policy 2',
  description: 'Mobility caps as described in the One-Year Permit',
  policy_id: POLICY_ID_2,
  start_date: TIME - days(30),
  end_date: null,
  publish_date: TIME - days(30),
  prev_policies: null,
  currency: null,
  provider_ids: [],
  rules: [
    {
      rule_type: 'count',
      rule_id: 'c29bff02-b260-4dfa-b7de-4b9a38a74cd9',
      name: 'Greater LA',
      geographies: [GEOGRAPHY_UUID],
      states: { available: [], removed: [], reserved: [], on_trip: [] },
      vehicle_types: ['bicycle', 'scooter'],
      maximum: 3000,
      minimum: 500
    }
  ]
}

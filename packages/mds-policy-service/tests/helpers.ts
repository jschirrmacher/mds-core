import { GeographyFactory, GeographyService } from '@mds-core/mds-geography-service'
import { ServiceClient } from '@mds-core/mds-service-helpers'
import { venice } from '@mds-core/mds-test-data'
import { Timestamp, UUID } from '@mds-core/mds-types'
import { now, START_ONE_MONTH_FROM_NOW, uuid } from '@mds-core/mds-utils'
import { PolicyDomainCreateModel, PolicyService, Rule } from '../@types'

export const RulesFactory = (overrides = {}): Rule[] => [
  {
    rule_type: 'count',
    rule_id: uuid(),
    name: 'Random Rule',
    geographies: [GeographyFactory().geography_id],
    states: { available: [] },
    vehicle_types: [],
    maximum: 3000,
    minimum: 500,
    rate_amount: null,
    rate_recurrence: null,
    ...overrides
  }
]

export const PolicyFactory = (overrides: Partial<PolicyDomainCreateModel> = {}): PolicyDomainCreateModel => ({
  name: 'MDSPolicy 1',
  description: 'Mobility caps as described in the One-Year Permit',
  policy_id: uuid(),
  start_date: START_ONE_MONTH_FROM_NOW,
  end_date: null,
  prev_policies: null,
  currency: null,
  provider_ids: [],
  rules: RulesFactory(),
  ...overrides
})

export const createPolicyAndGeographyFactory = async (
  policyServiceClient: ServiceClient<PolicyService>,
  geographyServiceClient: ServiceClient<GeographyService>,
  policy?: PolicyDomainCreateModel,
  geography_overrides?: { publish_date: Timestamp }
) => {
  const createdPolicy = await policyServiceClient.writePolicy(policy || PolicyFactory())
  const { publish_date } = geography_overrides || { publish_date: now() }
  await geographyServiceClient.writeGeographies([
    {
      name: 'VENICE',
      geography_id: createdPolicy.rules[0]?.geographies[0] as UUID,
      geography_json: venice
    }
  ])
  await geographyServiceClient.publishGeography({
    publish_date: publish_date,
    geography_id: createdPolicy.rules[0]?.geographies[0] as UUID
  })
  return createdPolicy
}

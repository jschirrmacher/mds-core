import {
  GeographyFactory,
  GeographyServiceClient,
  GeographyServiceManager,
  writePublishedGeography
} from '@mds-core/mds-geography-service'
import stream from '@mds-core/mds-stream'
import type { DAY_OF_WEEK, UUID } from '@mds-core/mds-types'
import {
  clone,
  days,
  hours,
  now,
  START_ONE_MONTH_AGO,
  START_ONE_MONTH_FROM_NOW,
  uuid,
  yesterday
} from '@mds-core/mds-utils'
import type {
  NoParkingIntentDraft,
  ParkingTimeLimitIntentDraft,
  PermittedParkingIntentDraft,
  PermittedVehicleCountIntentDraft,
  PolicyMetadataDomainModel,
  ProviderRebalancingZoneIntentDraft,
  TIME_FORMAT
} from '../@types'
import { PolicyServiceClient } from '../client'
import { PolicyRepository } from '../repository'
import { TWENTY_MINUTES } from '../service/helpers'
import { PolicyServiceManager } from '../service/manager'
import { PolicyStreamKafka } from '../service/stream'
import {
  POLICY2_JSON,
  POLICY3_JSON,
  POLICY_WITH_DUPE_RULE,
  TEST_GEOGRAPHY_UUID1,
  TEST_GEOGRAPHY_UUID2,
  TEST_PROVIDER_ID1
} from '../test_data/policies'
import { createPolicyAndGeographyFactory, PolicyFactory, RulesFactory } from './helpers'

const mockStream = stream.mockStream(PolicyStreamKafka)
const GeographyServer = GeographyServiceManager.controller()
const PolicyServer = PolicyServiceManager.controller()

describe('spot check unit test policy functions with SimplePolicy', () => {
  describe('Policy Client Tests', () => {
    beforeAll(async () => {
      process.env.KAFKA_HOST = 'localhost:7375'
      await GeographyServer.start()
      await PolicyServer.start()
      await PolicyRepository.initialize()
    })

    beforeEach(async () => {
      mockStream.write.mockReset()
      await PolicyRepository.truncateAllTables()
    })

    afterAll(async () => {
      await PolicyRepository.truncateAllTables()
      await PolicyRepository.shutdown()
      await GeographyServer.stop()
      await PolicyServer.stop()
      delete process.env.KAFKA_HOST
    })

    it('cannot publish a policy w/ missing geography', async () => {
      const badPolicy = await PolicyServiceClient.writePolicy(PolicyFactory())
      expect(badPolicy.published_date).toBeNull()
      await expect(PolicyServiceClient.publishPolicy(badPolicy.policy_id, now())).rejects.toMatchObject({
        type: 'DependencyMissingError'
      })

      await writePublishedGeography(GeographyFactory({ geography_id: badPolicy.rules[0]?.geographies[0] }))
      const publishedPolicy = await PolicyServiceClient.publishPolicy(badPolicy.policy_id, now())
      expect(publishedPolicy.published_date).not.toBeNull()
    })

    it('cannot publish a policy w/ unpublished geography', async () => {
      const badPolicy = await PolicyServiceClient.writePolicy(PolicyFactory())
      expect(badPolicy.published_date).toBeNull()
      const geography = GeographyFactory({ geography_id: badPolicy.rules[0]?.geographies[0], publish_date: null })
      await writePublishedGeography(geography)
      await expect(PolicyServiceClient.publishPolicy(badPolicy.policy_id, now())).rejects.toMatchObject({
        type: 'DependencyMissingError'
      })
    })

    it('can translate, create, and publish a draft of a NoParking policy intent and publish to Kafka', async () => {
      // Pushing start_date to an hour in the future to ensure we don't have to worry
      // about start_date > publish_date by 20 minutes
      const start_date = now() + hours(1)
      const end_date = now() + hours(10)
      const draft: NoParkingIntentDraft = {
        intent_type: 'no_parking',
        rule_fields: {
          geographies: [TEST_GEOGRAPHY_UUID1],
          days: ['mon'],
          start_time: '09:00:00',
          end_time: '10:00:00',
          vehicle_types: ['scooter'],
          propulsion_types: ['combustion']
        },
        policy_fields: {
          name: 'aname',
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date,
          end_date
        }
      }
      const policy = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
      const { policy_id } = policy
      expect(policy).toMatchObject({
        name: 'aname',
        description: 'aname',
        provider_ids: [TEST_PROVIDER_ID1],
        start_date,
        end_date,
        rules: [
          {
            rule_type: 'count',
            maximum: 0,
            geographies: [TEST_GEOGRAPHY_UUID1],
            days: ['mon'],
            start_time: '09:00:00',
            end_time: '10:00:00',
            vehicle_types: ['scooter'],
            propulsion_types: ['combustion']
          }
        ]
      })
      const metadata = await PolicyServiceClient.readSinglePolicyMetadata(policy_id)
      expect((metadata?.policy_metadata as { intent_type: string })?.intent_type).toEqual('no_parking')

      const publishedPolicy = await PolicyServiceClient.readPolicy(policy_id, { withStatus: true })
      expect(publishedPolicy.status).toBe('pending')
      expect(publishedPolicy?.rules[0]?.states).toEqual({
        available: [],
        non_operational: [],
        reserved: [],
        unknown: []
      })

      const { status, ...policyWithoutStatus } = publishedPolicy
      const [[kafkaPolicy]] = mockStream.write.mock.calls
      expect(kafkaPolicy).toMatchObject(policyWithoutStatus)
      // Calling this out specially because the published_date has to be passed to Kafka explicitly
      // in the service provider layer
      expect(kafkaPolicy?.published_date).toEqual(publishedPolicy.published_date)
    })

    describe('Exercise propulsion_types and vehicle_types', () => {
      const start_date = now() + hours(1)
      const end_date = now() + hours(10)
      const POLICY_FIELDS = {
        name: 'aname',
        description: 'aname',
        provider_ids: [TEST_PROVIDER_ID1],
        start_date,
        end_date
      }

      const RULE_FIELDS: { geographies: UUID[]; days: DAY_OF_WEEK[]; start_time: TIME_FORMAT; end_time: TIME_FORMAT } =
        {
          geographies: [TEST_GEOGRAPHY_UUID1],
          days: ['mon'],
          start_time: '09:00:00',
          end_time: '10:00:00'
        }

      it('sets propulsion_fields and vehicle_types to null if the user so desires', async () => {
        const draft: NoParkingIntentDraft = {
          intent_type: 'no_parking',
          rule_fields: {
            ...RULE_FIELDS,
            vehicle_types: null,
            propulsion_types: null
          },
          policy_fields: POLICY_FIELDS
        }

        const policy = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
        expect(policy.rules[0]?.vehicle_types).toEqual(null)
        expect(policy.rules[0]?.propulsion_types).toEqual(null)
      })

      it('sets propulsion_fields and vehicle_types to [] if the properties are undefined', async () => {
        const draft: NoParkingIntentDraft = {
          intent_type: 'no_parking',
          rule_fields: {
            ...RULE_FIELDS,
            vehicle_types: undefined,
            propulsion_types: undefined
          },
          policy_fields: POLICY_FIELDS
        }

        const policy = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
        expect(policy.rules[0]?.vehicle_types).toEqual([])
        expect(policy.rules[0]?.propulsion_types).toEqual([])
      })
    })

    it('throws if name is not there', async () => {
      const draft = {
        intent_type: 'no_parking',
        rule_fields: {
          geographies: [TEST_GEOGRAPHY_UUID1],
          days: ['mon'],
          start_time: '09:00:00',
          end_time: '10:00:00'
        },
        policy_fields: {
          name: null,
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date: now(),
          end_date: null
        }
      }
      await expect(
        PolicyServiceClient.writePolicyIntentToPolicy(draft as unknown as NoParkingIntentDraft)
      ).rejects.toMatchObject({
        type: 'ValidationError'
      })
    })

    it('adjusts the start_date to fit the spec', async () => {
      const draft: NoParkingIntentDraft = {
        intent_type: 'no_parking',
        rule_fields: {
          geographies: [TEST_GEOGRAPHY_UUID1],
          days: ['mon'],
          start_time: '09:00:00',
          end_time: '10:00:00'
        },
        policy_fields: {
          name: 'aname',
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date: now(),
          end_date: null
        }
      }

      const { start_date, published_date } = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
      expect(start_date - (published_date as number)).toBeGreaterThanOrEqual(TWENTY_MINUTES)
    })

    it('handles publishing a PermittedVehicleCount policy intent', async () => {
      const draft: PermittedVehicleCountIntentDraft = {
        intent_type: 'permitted_vehicle_count',
        rule_fields: {
          geographies: [TEST_GEOGRAPHY_UUID1],
          days: ['mon'],
          start_time: '09:00:00',
          end_time: '10:00:00',
          maximum: 10,
          minimum: 5
        },
        policy_fields: {
          name: 'aname',
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date: now(),
          end_date: null
        }
      }

      const { policy_id, rules } = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
      expect(rules[0]?.maximum).toEqual(10)
      expect(rules[0]?.minimum).toEqual(5)
      expect(rules[0]?.states).toEqual({})

      const metadata = await PolicyServiceClient.readSinglePolicyMetadata(policy_id)
      expect((metadata?.policy_metadata as { intent_type: string })?.intent_type).toEqual('permitted_vehicle_count')
    })

    it('handles publishing a ParkingTimeLimit policy intent', async () => {
      const draft: ParkingTimeLimitIntentDraft = {
        intent_type: 'parking_time_limit',
        rule_fields: {
          geographies: [TEST_GEOGRAPHY_UUID1],
          days: ['mon'],
          start_time: '09:00:00',
          end_time: '10:00:00',
          maximum: 10,
          rule_units: 'hours'
        },
        policy_fields: {
          name: 'aname',
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date: now(),
          end_date: null
        }
      }

      const { policy_id, rules } = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
      expect(rules[0]?.maximum).toEqual(10)
      expect(rules[0]?.minimum).toEqual(0)
      expect(rules[0]?.rule_units).toEqual('hours')
      expect(rules[0]?.states).toMatchObject({ available: [], non_operational: [], reserved: [] })

      const metadata = await PolicyServiceClient.readSinglePolicyMetadata(policy_id)
      expect((metadata?.policy_metadata as { intent_type: string })?.intent_type).toEqual('parking_time_limit')
    })

    it('handles publishing a PermittedParking policy intent', async () => {
      const draft: PermittedParkingIntentDraft = {
        intent_type: 'permitted_parking',
        rule_fields: [
          {
            geographies: [TEST_GEOGRAPHY_UUID1],
            days: ['mon'],
            start_time: '09:00:00',
            end_time: '10:00:00',
            maximum: 10
          },
          {
            geographies: [TEST_GEOGRAPHY_UUID1],
            days: ['mon'],
            start_time: '09:00:00',
            end_time: '10:00:00',
            maximum: 0
          }
        ],
        policy_fields: {
          name: 'aname',
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date: now(),
          end_date: null
        }
      }

      const { policy_id, rules } = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
      expect(rules[0]?.maximum).toEqual(10)
      expect(rules[0]?.minimum).toEqual(0)
      expect(rules[0]?.rule_units).toEqual('minutes')
      expect(rules[0]?.states).toMatchObject({ available: [], non_operational: [], reserved: [] })

      const metadata = await PolicyServiceClient.readSinglePolicyMetadata(policy_id)
      expect((metadata?.policy_metadata as { intent_type: string })?.intent_type).toEqual('permitted_parking')
    })

    it('will not publish a PermittedParking policy intent with more than one geography in a rule', async () => {
      const draft: PermittedParkingIntentDraft = {
        intent_type: 'permitted_parking',
        rule_fields: [
          {
            geographies: [TEST_GEOGRAPHY_UUID1, TEST_GEOGRAPHY_UUID2],
            days: ['mon'],
            start_time: '09:00:00',
            end_time: '10:00:00',
            maximum: 10
          },
          {
            geographies: [TEST_GEOGRAPHY_UUID1],
            days: ['mon'],
            start_time: '09:00:00',
            end_time: '10:00:00',
            maximum: 0
          }
        ],
        policy_fields: {
          name: 'aname',
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date: now(),
          end_date: null
        }
      }

      await expect(PolicyServiceClient.writePolicyIntentToPolicy(draft)).rejects.toMatchObject({
        type: 'ValidationError'
      })
    })

    it('handles publishing a ProviderRebalancingZone policy intent', async () => {
      const draft: ProviderRebalancingZoneIntentDraft = {
        intent_type: 'provider_rebalancing_zone',
        rule_fields: [
          {
            geographies: [TEST_GEOGRAPHY_UUID1],
            days: ['mon'],
            start_time: '09:00:00',
            end_time: '10:00:00',
            maximum: 10,
            states: {}
          },
          {
            geographies: [TEST_GEOGRAPHY_UUID1],
            days: ['mon'],
            start_time: '09:00:00',
            end_time: '10:00:00',
            maximum: 30,
            states: {}
          },
          {
            geographies: [TEST_GEOGRAPHY_UUID1],
            days: ['mon'],
            start_time: '08:00:00',
            end_time: '12:00:00',
            maximum: 0,
            states: {
              available: ['provider_drop_off'],
              elsewhere: ['provider_drop_off'],
              non_operational: ['provider_drop_off'],
              on_trip: ['provider_drop_off'],
              removed: ['provider_drop_off'],
              reserved: ['provider_drop_off'],
              unknown: ['provider_drop_off']
            }
          }
        ],
        policy_fields: {
          name: 'aname',
          description: 'aname',
          provider_ids: [TEST_PROVIDER_ID1],
          start_date: now(),
          end_date: null
        }
      }

      const { policy_id, rules } = await PolicyServiceClient.writePolicyIntentToPolicy(draft)
      expect(rules[0]?.maximum).toEqual(10)
      expect(rules[0]?.minimum).toEqual(0)
      expect(rules[0]?.start_time).toEqual('09:00:00')
      expect(rules[0]?.end_time).toEqual('10:00:00')
      expect(rules[1]?.maximum).toEqual(30)
      expect(rules[1]?.minimum).toEqual(0)
      expect(rules[0]?.states).toEqual({})
      expect(rules[2]?.states).toEqual({
        available: ['provider_drop_off'],
        elsewhere: ['provider_drop_off'],
        non_operational: ['provider_drop_off'],
        on_trip: ['provider_drop_off'],
        removed: ['provider_drop_off'],
        reserved: ['provider_drop_off'],
        unknown: ['provider_drop_off']
      })
      expect(rules[2]?.maximum).toEqual(0)
      expect(rules[2]?.minimum).toEqual(0)
      expect(rules[2]?.start_time).toEqual('08:00:00')
      expect(rules[2]?.end_time).toEqual('12:00:00')

      const metadata = await PolicyServiceClient.readSinglePolicyMetadata(policy_id)
      expect((metadata?.policy_metadata as { intent_type: string })?.intent_type).toEqual('provider_rebalancing_zone')
    })

    it('can CRUD a SimplePolicy', async () => {
      const simplePolicy = PolicyFactory()
      await PolicyServiceClient.writePolicy(simplePolicy)
      await writePublishedGeography(GeographyFactory({ geography_id: simplePolicy.rules[0]?.geographies[0] }))
      const policy = await PolicyServiceClient.readPolicy(simplePolicy.policy_id)

      expect(policy.policy_id).toEqual(simplePolicy.policy_id)
      expect(policy.name).toEqual(simplePolicy.name)

      await PolicyServiceClient.editPolicy({ ...simplePolicy, name: 'simpleton' })
      const updatedPolicy = await PolicyServiceClient.readPolicy(simplePolicy.policy_id)

      expect(updatedPolicy.policy_id).toEqual(simplePolicy.policy_id)
      expect(updatedPolicy.name).toEqual('simpleton')

      await PolicyServiceClient.deletePolicy(policy.policy_id)
      await expect(PolicyServiceClient.readPolicy(policy.policy_id)).rejects.toMatchObject({
        type: 'NotFoundError'
      })
    })

    it('can publish a SimplePolicy', async () => {
      const geography = GeographyFactory()
      const simplePolicy = PolicyFactory({
        start_date: now() + days(1),
        rules: RulesFactory({ geographies: [geography.geography_id] })
      })
      await writePublishedGeography(geography)
      await PolicyServiceClient.writePolicy(simplePolicy)
      await PolicyServiceClient.publishPolicy(simplePolicy.policy_id, now())
      const { policies: result } = await PolicyServiceClient.readPolicies({ get_published: true })
      expect(result.length).toEqual(1)
    })

    it('can publish a Policy with transaction_types', async () => {
      const geography = GeographyFactory()
      const policyWithTransactionTypes = PolicyFactory({
        rules: RulesFactory({ geographies: [geography.geography_id], transaction_types: ['pick_up'] })
      })

      await writePublishedGeography(geography)
      await PolicyServiceClient.writePolicy(policyWithTransactionTypes)
      await PolicyServiceClient.publishPolicy(policyWithTransactionTypes.policy_id, now())
      const { policies: result } = await PolicyServiceClient.readPolicies({ get_published: true })
      expect(result.length).toEqual(1)
    })

    it('can publish a Policy with service_types', async () => {
      const geography = GeographyFactory()
      const policyWithServiceTypes = PolicyFactory({
        rules: RulesFactory({ geographies: [geography.geography_id], service_types: ['standard'] })
      })

      await writePublishedGeography(geography)
      await PolicyServiceClient.writePolicy(policyWithServiceTypes)
      await PolicyServiceClient.publishPolicy(policyWithServiceTypes.policy_id, now())
      const { policies: result } = await PolicyServiceClient.readPolicies({ get_published: true })
      expect(result.length).toEqual(1)
    })

    it('can publish a Policy with rates', async () => {
      const geography = GeographyFactory()
      const policyWithRates = PolicyFactory({
        currency: 'USD',
        rules: [
          {
            rule_id: uuid(),
            name: 'Downtown Peak-Hour Parking Fee',
            rule_type: 'rate',
            rate_amount: 10,
            rate_recurrence: 'per_complete_time_unit',
            rule_units: 'hours',
            geographies: [geography.geography_id],
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            start_time: '07:00:00',
            end_time: '08:30:00',
            states: {
              available: [],
              non_operational: []
            }
          }
        ]
      })

      await writePublishedGeography(geography)
      await PolicyServiceClient.writePolicy(policyWithRates)
      await PolicyServiceClient.publishPolicy(policyWithRates.policy_id, now())
      const { policies: result } = await PolicyServiceClient.readPolicies({ get_published: true })
      expect(result.length).toEqual(1)
    })

    it('cannot publish a Policy with rates if currency is missing', async () => {
      const geography = GeographyFactory()
      const policyWithRates = PolicyFactory({
        rules: [
          {
            rule_id: uuid(),
            name: 'Downtown Peak-Hour Parking Fee',
            rule_type: 'rate',
            rate_amount: 10,
            rate_recurrence: 'per_complete_time_unit',
            rule_units: 'hours',
            geographies: [geography.geography_id],
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            start_time: '07:00:00',
            end_time: '08:30:00',
            states: {
              available: [],
              non_operational: []
            }
          }
        ]
      })

      await writePublishedGeography(geography)
      await expect(PolicyServiceClient.writePolicy(policyWithRates)).rejects.toMatchObject({ type: 'ValidationError' })
    })

    it('can delete an unpublished Policy', async () => {
      const deletablePolicy = PolicyFactory()
      await PolicyServiceClient.writePolicy(deletablePolicy)

      const policy = await PolicyServiceClient.readPolicy(deletablePolicy.policy_id)
      expect(policy.published_date).toBeFalsy()
      await PolicyServiceClient.deletePolicy(policy.policy_id)
      const { policies: policy_result } = await PolicyServiceClient.readPolicies(
        {
          policy_ids: [policy.policy_id],
          get_published: null,
          get_unpublished: null
        },
        {}
      )
      expect(policy_result).toStrictEqual([])
    })

    it("can't delete a non-existent Policy", async () => {
      await expect(PolicyServiceClient.deletePolicy(uuid())).rejects.toMatchObject({ type: 'NotFoundError' })
    })

    it('can write, read, and publish a Policy', async () => {
      const simplePolicy = PolicyFactory()
      await PolicyServiceClient.writePolicy(simplePolicy)
      await writePublishedGeography(GeographyFactory({ geography_id: simplePolicy.rules[0]?.geographies[0] }))
      /* must publish policy, b/c writePolicy filters out `published_date` */
      await PolicyServiceClient.publishPolicy(simplePolicy.policy_id, simplePolicy.start_date)

      await PolicyServiceClient.writePolicy(POLICY2_JSON)
      await PolicyServiceClient.writePolicy(POLICY3_JSON)

      /* Read all policies, no matter whether published or not. */
      const { policies } = await PolicyServiceClient.readPolicies({})
      expect(policies.length).toEqual(3)
      const { policies: unpublishedPolicies } = await PolicyServiceClient.readPolicies({
        get_unpublished: true,
        get_published: null
      })
      expect(unpublishedPolicies.length).toEqual(2)
      const { policies: publishedPolicies } = await PolicyServiceClient.readPolicies({
        get_published: true,
        get_unpublished: null
      })
      expect(publishedPolicies.length).toEqual(1)
    })

    it('throws a ConflictError when writing a policy that already exists', async () => {
      const activePolicy = await PolicyServiceClient.writePolicy(PolicyFactory())
      await expect(PolicyServiceClient.writePolicy(activePolicy)).rejects.toMatchObject({ type: 'ConflictError' })
    })

    it('can retrieve Policies that were active at a particular date', async () => {
      const activePolicy = await PolicyServiceClient.writePolicy(PolicyFactory({ start_date: yesterday() }))
      await writePublishedGeography(GeographyFactory({ geography_id: activePolicy.rules[0]?.geographies[0] }))
      await PolicyServiceClient.publishPolicy(activePolicy.policy_id, activePolicy.start_date)

      const publishedPolicy = await PolicyServiceClient.writePolicy(
        PolicyFactory({
          start_date: START_ONE_MONTH_AGO,
          published_date: START_ONE_MONTH_AGO,
          rules: RulesFactory({ geographies: activePolicy.rules[0]?.geographies })
        })
      )
      await PolicyServiceClient.publishPolicy(publishedPolicy.policy_id, publishedPolicy.start_date)
      const monthAgoPolicies = await PolicyServiceClient.readActivePolicies(START_ONE_MONTH_AGO)
      expect(monthAgoPolicies.length).toStrictEqual(1)

      const currentlyActivePolicies = await PolicyServiceClient.readActivePolicies(now())
      expect(currentlyActivePolicies.length).toStrictEqual(2)
    })

    it('can read a single Policy', async () => {
      const activePolicy = await PolicyServiceClient.writePolicy(PolicyFactory({ start_date: yesterday() }))
      await writePublishedGeography(GeographyFactory({ geography_id: activePolicy.rules[0]?.geographies[0] }))
      await PolicyServiceClient.publishPolicy(activePolicy.policy_id, activePolicy.start_date)

      const policy = await PolicyServiceClient.readPolicy(activePolicy.policy_id)
      expect(policy.policy_id).toStrictEqual(activePolicy.policy_id)
      expect(policy.name).toStrictEqual(activePolicy.name)
    })

    it('can find Policies by rule id', async () => {
      const simplePolicy = PolicyFactory()
      await PolicyServiceClient.writePolicy(simplePolicy)
      await writePublishedGeography(GeographyFactory({ geography_id: simplePolicy.rules[0]?.geographies[0] }))
      const rule_id = simplePolicy.rules[0]?.rule_id as UUID
      const { policies } = await PolicyServiceClient.readPolicies({ rule_id })
      expect(policies[0]?.rules.map(rule => rule.rule_id).includes(rule_id)).toBeTruthy()
    })

    it('can read Policies by rule modality', async () => {
      const simplePolicy = PolicyFactory()
      await PolicyServiceClient.writePolicy(simplePolicy)
      const { policies: micromobilityPolicies } = await PolicyServiceClient.readPolicies({
        modalities: ['micromobility']
      })
      expect(micromobilityPolicies.length).toEqual(1)

      const { policies: taxiPolicies } = await PolicyServiceClient.readPolicies({ modalities: ['taxi'] })
      expect(taxiPolicies.length).toEqual(0)
    })

    it('ensures rules are unique when writing new policy', async () => {
      await PolicyServiceClient.writePolicy(POLICY3_JSON)
      await expect(PolicyServiceClient.writePolicy(POLICY_WITH_DUPE_RULE)).rejects.toMatchObject({
        type: 'ConflictError'
      })
    })

    it('cannot find a nonexistent Policy', async () => {
      await expect(PolicyServiceClient.readPolicy(uuid())).rejects.toMatchObject({ type: 'NotFoundError' })
    })

    it('can edit a Policy', async () => {
      await PolicyServiceClient.writePolicy(POLICY3_JSON)
      await PolicyServiceClient.editPolicy({ ...POLICY3_JSON, name: 'a shiny new name' })
      const { policies: result } = await PolicyServiceClient.readPolicies({
        policy_ids: [POLICY3_JSON.policy_id],
        get_unpublished: true,
        get_published: null
      })
      expect(result[0]?.name).toStrictEqual('a shiny new name')
    })

    it('cannot add a rule that already exists in some other policy', async () => {
      const activePolicy = await PolicyServiceClient.writePolicy(PolicyFactory())
      const otherPolicy = await PolicyServiceClient.writePolicy(PolicyFactory())

      const policy = {
        ...clone(otherPolicy),
        rules: [
          ...otherPolicy.rules.map((val, iter) => {
            return iter === 0 ? { ...val, rule_id: activePolicy.rules[0]?.rule_id as UUID } : val
          })
        ]
      }
      await expect(PolicyServiceClient.editPolicy(policy)).rejects.toMatchObject({ type: 'ConflictError' })
    })

    it('ensures the published_date >= start_date', async () => {
      const simplePolicy = PolicyFactory({ start_date: START_ONE_MONTH_AGO })
      await PolicyServiceClient.writePolicy(simplePolicy)
      await writePublishedGeography(GeographyFactory({ geography_id: simplePolicy.rules[0]?.geographies[0] }))
      await expect(PolicyServiceClient.publishPolicy(simplePolicy.policy_id, now())).rejects.toMatchObject({
        type: 'ConflictError'
      })

      const validPolicy = clone(simplePolicy)
      validPolicy.start_date = START_ONE_MONTH_FROM_NOW
      await PolicyServiceClient.editPolicy(validPolicy)
      /* if this succeeds, then no error was thrown: */
      await PolicyServiceClient.publishPolicy(validPolicy.policy_id, validPolicy.start_date)
    })

    it('will not edit or delete a published Policy', async () => {
      const activePolicy = await PolicyServiceClient.writePolicy(PolicyFactory({ start_date: yesterday() }))
      await writePublishedGeography(GeographyFactory({ geography_id: activePolicy.rules[0]?.geographies[0] }))
      await PolicyServiceClient.publishPolicy(activePolicy.policy_id, activePolicy.start_date)
      const publishedPolicy = clone(activePolicy)
      publishedPolicy.name = 'a shiny new name'

      await expect(PolicyServiceClient.editPolicy(publishedPolicy)).rejects.toMatchObject({
        type: 'ConflictError'
      })
      await expect(PolicyServiceClient.deletePolicy(publishedPolicy.policy_id)).rejects.toMatchObject({
        type: 'ConflictError'
      })
    })

    it('will throw an error if attempting to edit a nonexistent Policy', async () => {
      const policy = clone(POLICY2_JSON)
      policy.policy_id = '28218022-d333-41be-bda5-1dc4288516d2'
      await expect(PolicyServiceClient.editPolicy(policy)).rejects.toMatchObject({ type: 'NotFoundError' })
    })

    describe('unit test PolicyMetadata functions', () => {
      it('.readBulkPolicyMetadata', async () => {
        const thisYesterday = yesterday()
        const p1 = await PolicyServiceClient.writePolicy(PolicyFactory({ start_date: thisYesterday }))
        const p2 = await PolicyServiceClient.writePolicy(PolicyFactory({ start_date: thisYesterday - days(1) }))
        const p3 = await PolicyServiceClient.writePolicy(PolicyFactory({ start_date: thisYesterday - days(1) }))

        await PolicyServiceClient.writePolicyMetadata({
          policy_id: p1.policy_id,
          policy_metadata: { name: 'policy1_json' }
        })
        await PolicyServiceClient.writePolicyMetadata({
          policy_id: p2.policy_id,
          policy_metadata: { name: 'policy2_json' }
        })
        await PolicyServiceClient.writePolicyMetadata({
          policy_id: p3.policy_id,
          policy_metadata: { name: 'policy3_json' }
        })

        const noParamsResult = await PolicyServiceClient.readBulkPolicyMetadata({})
        expect(noParamsResult.length).toStrictEqual(3)

        const withStartDateResult: PolicyMetadataDomainModel<{ name: string }>[] =
          await PolicyServiceClient.readBulkPolicyMetadata({
            start_date: thisYesterday
          })
        expect(withStartDateResult.length).toStrictEqual(1)

        expect(withStartDateResult[0]?.policy_metadata?.name).toStrictEqual('policy1_json')

        const meta: PolicyMetadataDomainModel<{ name: string }> = await PolicyServiceClient.readSinglePolicyMetadata(
          p1.policy_id
        )
        expect(meta.policy_id).toStrictEqual(p1.policy_id)
        expect(meta.policy_metadata?.name).toStrictEqual('policy1_json')
      })

      it('updates policy metadata', async () => {
        const p1 = await PolicyServiceClient.writePolicy(PolicyFactory())
        const metadata: PolicyMetadataDomainModel<{ name: string }> = await PolicyServiceClient.writePolicyMetadata({
          policy_id: p1.policy_id,
          policy_metadata: { name: 'policy_json' }
        })
        const updatedMeta: PolicyMetadataDomainModel<{ name: string }> = await PolicyServiceClient.updatePolicyMetadata(
          {
            ...metadata,
            policy_metadata: { name: 'steve' }
          }
        )
        expect(updatedMeta.policy_metadata?.name).toStrictEqual('steve')
        const changedMetadata: PolicyMetadataDomainModel<{ name: string }> =
          await PolicyServiceClient.readSinglePolicyMetadata(p1.policy_id)
        expect(changedMetadata.policy_metadata?.name).toStrictEqual('steve')
      })
    })

    describe('Tests Kafka publishing', () => {
      it('Verifies that publishing a policy results in a kafka stream write and includes the publish_date', async () => {
        const policy = PolicyFactory()

        await createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
          publish_date: now()
        })

        await PolicyServiceClient.publishPolicy(policy.policy_id, policy.start_date)
        const publishedPolicy = await PolicyServiceClient.readPolicy(policy.policy_id)

        expect(mockStream.write).toHaveBeenCalledTimes(1)
        const kafkaPolicy = mockStream.write.mock.calls[0][0]
        expect(kafkaPolicy).toMatchObject({ published_date: publishedPolicy.published_date, ...policy })
      })

      it('Verifies that a failed kafka publish results in a failed publish', async () => {
        const policy = PolicyFactory()
        mockStream.write.mockImplementationOnce(() => {
          throw new Error('kafka publish failed')
        })

        await createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
          publish_date: now()
        })

        await expect(PolicyServiceClient.publishPolicy(policy.policy_id, policy.start_date)).rejects.toMatchObject({
          type: 'ServiceException'
        })

        const readPolicyResult = await PolicyServiceClient.readPolicy(policy.policy_id)

        expect(readPolicyResult.published_date).toBeNull()
      })
    })

    describe('Test "Policy Status" behavior', () => {
      describe('Single filter tests', () => {
        it('Can filter for draft policies', async () => {
          const policies = <const>[PolicyFactory(), PolicyFactory()]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          const [policyToPublish, draftPolicy] = policies

          await PolicyServiceClient.publishPolicy(policyToPublish.policy_id, policyToPublish.start_date)

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['draft'] })

          expect(results.length).toStrictEqual(1)
          expect(results[0]).toMatchObject(draftPolicy)
        })

        it('Can filter for active policies', async () => {
          const policies = <const>[PolicyFactory({ start_date: yesterday() }), PolicyFactory()]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          const [policyToPublish] = policies

          const activePolicy = await PolicyServiceClient.publishPolicy(
            policyToPublish.policy_id,
            policyToPublish.start_date
          )

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['active'] })

          expect(results.length).toStrictEqual(1)
          expect(results[0]).toStrictEqual(activePolicy)
        })

        it('Can filter for pending policies', async () => {
          const policies = <const>[PolicyFactory({ start_date: now() + days(1) }), PolicyFactory()]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          const [policyToPublish] = policies

          const pendingPolicy = await PolicyServiceClient.publishPolicy(policyToPublish.policy_id, yesterday())

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['pending'] })

          expect(results.length).toStrictEqual(1)
          expect(results[0]).toStrictEqual(pendingPolicy)
        })

        it('Can filter for deactivated policies', async () => {
          const [firstPolicy, secondPolicy] = (() => {
            const firstPolicy = PolicyFactory({ start_date: yesterday() })
            const secondPolicy = PolicyFactory({ start_date: yesterday(), prev_policies: [firstPolicy.policy_id] })

            return [firstPolicy, secondPolicy]
          })()
          const policies = [firstPolicy, secondPolicy]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          await PolicyServiceClient.publishPolicy(firstPolicy.policy_id, firstPolicy.start_date)
          await PolicyServiceClient.publishPolicy(secondPolicy.policy_id, secondPolicy.start_date)

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['deactivated'] })
          expect(results.length).toStrictEqual(1)
          expect(results[0]).toMatchObject(firstPolicy)
        })

        it('Can filter for expired policies', async () => {
          const policies = [PolicyFactory({ start_date: now() - days(2), end_date: now() - days(1) }), PolicyFactory()]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          // expiredPolicy is the first, cause ordered lists!
          const [expiredPolicy] = await Promise.all(
            policies.map(policy => PolicyServiceClient.publishPolicy(policy.policy_id, policy.start_date))
          )

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['expired'] })

          expect(results.length).toStrictEqual(1)
          expect(results[0]).toStrictEqual(expiredPolicy)
        })
      })

      describe('Multi-filter tests', () => {
        it('Can filter on draft & pending policies simultaneously', async () => {
          const policies = <const>[PolicyFactory({ start_date: now() + days(1) }), PolicyFactory()]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          const [policyToPublish] = policies

          await PolicyServiceClient.publishPolicy(policyToPublish.policy_id, yesterday())

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['pending', 'draft'] })

          expect(results.length).toStrictEqual(2)
        })

        it('Can filter on draft and active policies simultaneously', async () => {
          const policies = <const>[PolicyFactory({ start_date: now() - days(1) }), PolicyFactory()]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          const [policyToPublish] = policies

          await PolicyServiceClient.publishPolicy(policyToPublish.policy_id, policyToPublish.start_date)

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['active', 'draft'] })

          expect(results.length).toStrictEqual(2)
        })

        it('Can filter on active and deactivated policies simultaneously', async () => {
          const [firstPolicy, secondPolicy] = (() => {
            const firstPolicy = PolicyFactory({ start_date: yesterday() })
            const secondPolicy = PolicyFactory({ start_date: yesterday(), prev_policies: [firstPolicy.policy_id] })

            return [firstPolicy, secondPolicy]
          })()
          const policies = [firstPolicy, secondPolicy]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          await PolicyServiceClient.publishPolicy(firstPolicy.policy_id, firstPolicy.start_date)
          await PolicyServiceClient.publishPolicy(secondPolicy.policy_id, secondPolicy.start_date)

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['active', 'deactivated'] })

          expect(results.length).toStrictEqual(2)
        })

        it('Can filter on active and expired policies simultaneously', async () => {
          const policies = [
            PolicyFactory({ start_date: now() - days(2), end_date: now() - days(1) }),
            PolicyFactory({ start_date: now() - days(1) })
          ]

          await Promise.all(
            policies.map(policy =>
              createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                publish_date: now()
              })
            )
          )

          await Promise.all(
            policies.map(policy => PolicyServiceClient.publishPolicy(policy.policy_id, policy.start_date))
          )

          const { policies: results } = await PolicyServiceClient.readPolicies({ statuses: ['expired', 'active'] })

          expect(results.length).toStrictEqual(2)
        })

        describe('Superseding a policy changes its status', () => {
          it('Policy A is superseded by B, starting now', async () => {
            const [policyA, policyB] = (() => {
              const policyA = PolicyFactory({ start_date: yesterday() })
              const policyB = PolicyFactory({ start_date: yesterday(), prev_policies: [policyA.policy_id] })

              return [policyA, policyB]
            })()
            const policies = [policyA, policyB]

            await Promise.all(
              policies.map(policy =>
                createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                  publish_date: now()
                })
              )
            )
            /* publishing A turns it from 'draft' to 'active' */
            await PolicyServiceClient.publishPolicy(policyA.policy_id, policyA.start_date)

            const { policies: policies1 } = await PolicyServiceClient.readPolicies(
              { policy_ids: [policyA.policy_id, policyB.policy_id] },
              { withStatus: true }
            )
            expect(policies1.map(({ status }) => status)).toStrictEqual(['active', 'draft'])

            /* publishing B turns it from 'draft' to 'active', and turns A to 'deactivated' */
            await PolicyServiceClient.publishPolicy(policyB.policy_id, policyB.start_date)

            const { policies: policies2 } = await PolicyServiceClient.readPolicies(
              { policy_ids: [policyA.policy_id, policyB.policy_id], statuses: ['deactivated', 'active'] },
              { withStatus: true }
            )
            const policies2map = new Map(policies2.map(({ policy_id, status }) => [policy_id, status]))
            expect(policies2map.get(policyA.policy_id)).toStrictEqual('deactivated')
            expect(policies2map.get(policyB.policy_id)).toStrictEqual('active')
          })

          it('Policy A is superseded by B, but not deactivated until B-start_date', async () => {
            const [policyA, policyB] = (() => {
              const policyA = PolicyFactory({ start_date: yesterday() })
              const policyB = PolicyFactory({ start_date: now() + days(1), prev_policies: [policyA.policy_id] })

              return [policyA, policyB]
            })()
            const policies = [policyA, policyB]

            await Promise.all(
              policies.map(policy =>
                createPolicyAndGeographyFactory(PolicyServiceClient, GeographyServiceClient, policy, {
                  publish_date: now()
                })
              )
            )
            /* publishing A turns it from 'draft' to 'active' */
            await PolicyServiceClient.publishPolicy(policyA.policy_id, policyA.start_date)

            const { policies: policies1 } = await PolicyServiceClient.readPolicies(
              { policy_ids: [policyA.policy_id, policyB.policy_id] },
              { withStatus: true }
            )
            expect(policies1.map(({ status }) => status)).toStrictEqual(['active', 'draft'])

            /* publishing B turns it from 'draft' to 'pending', and A is /still/ active */
            await PolicyServiceClient.publishPolicy(policyB.policy_id, now())

            const { policies: policies2 } = await PolicyServiceClient.readPolicies(
              { policy_ids: [policyA.policy_id, policyB.policy_id], statuses: ['active', 'pending'] },
              { withStatus: true }
            )
            const policies2map = new Map(policies2.map(({ policy_id, status }) => [policy_id, status]))
            expect(policies2map.get(policyA.policy_id)).toStrictEqual('active')
            expect(policies2map.get(policyB.policy_id)).toStrictEqual('pending')
          })
        })
      })
    })
  })
})

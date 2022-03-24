import { days, hours, now, uuid, yesterday } from '@mds-core/mds-utils'
import { derivePolicyStatus } from '../repository/mappers'
import { PolicyFactory } from './helpers'

describe('Tests Model Mappers', () => {
  it("Should return 'draft'", () => {
    const policy = PolicyFactory()
    const { policy_id } = policy
    const mockPolicyEntity = {
      policy_id,
      start_date: now() + days(1),
      end_date: null,
      publish_date: null,
      policy_json: {
        ...policy,
        currency: null,
        provider_ids: [],
        end_date: null,
        prev_policies: [],
        start_date: now() + days(1),
        publish_date: null
      },
      superseded_by: null,
      superseded_at: null,
      id: 0
    }

    const status = derivePolicyStatus(mockPolicyEntity)

    expect(status).toBe('draft')
  })

  it("Should return 'pending'", () => {
    const policy = PolicyFactory()
    const { policy_id } = policy
    const mockPolicyEntity = {
      policy_id,
      start_date: now() + days(1),
      end_date: null,
      publish_date: yesterday(),
      policy_json: {
        ...policy,
        currency: null,
        provider_ids: [],
        end_date: null,
        prev_policies: [],
        start_date: now() + days(1),
        publish_date: yesterday()
      },
      superseded_by: null,
      superseded_at: null,
      id: 0
    }

    const status = derivePolicyStatus(mockPolicyEntity)

    expect(status).toBe('pending')
  })

  describe("Tests 'policy status' derivation", () => {
    it("Should return 'active'", () => {
      const policy = PolicyFactory()
      const { policy_id } = policy
      const mockPolicyEntity = {
        policy_id,
        start_date: yesterday(),
        end_date: null,
        publish_date: yesterday(),
        policy_json: {
          ...policy,
          currency: null,
          provider_ids: [],
          end_date: null,
          prev_policies: [],
          start_date: yesterday(),
          publish_date: yesterday()
        },
        superseded_by: null,
        superseded_at: null,
        id: 0
      }

      const status = derivePolicyStatus(mockPolicyEntity)

      expect(status).toBe('active')
    })
  })

  it("Should return 'expired'", () => {
    const policy = PolicyFactory()
    const { policy_id } = policy
    const mockPolicyEntity = {
      policy_id,
      start_date: now() - days(2),
      end_date: now() - days(1),
      publish_date: now() - days(2),
      policy_json: {
        ...policy,
        currency: null,
        provider_ids: [],
        end_date: now() - days(1),
        prev_policies: [],
        start_date: now() - days(2),
        publish_date: now() - days(2)
      },
      superseded_by: null,
      superseded_at: null,
      id: 0
    }

    const status = derivePolicyStatus(mockPolicyEntity)

    expect(status).toBe('expired')
  })

  it("Should return 'deactivated'", () => {
    const policy = PolicyFactory()
    const { policy_id } = policy
    const mockPolicyEntity = {
      policy_id,
      start_date: yesterday(),
      end_date: null,
      publish_date: yesterday(),
      policy_json: {
        ...policy,
        currency: null,
        provider_ids: [],
        end_date: null,
        prev_policies: [],
        start_date: yesterday(),
        publish_date: yesterday()
      },
      superseded_by: [uuid()],
      superseded_at: [now() - hours(1)],
      id: 0
    }

    const status = derivePolicyStatus(mockPolicyEntity)

    expect(status).toBe('deactivated')
  })
})

import { ValidationError } from '@mds-core/mds-schema-validators'
import { MICRO_MOBILITY_VEHICLE_EVENTS, TAXI_VEHICLE_EVENTS, TNC_VEHICLE_EVENT } from '@mds-core/mds-types'
import type { PolicyDomainCreateModel } from '../@types'
import { isValidPolicyDomainModel, validatePolicyDomainModel, validateRuleSchema } from '../service/validators'
import { PolicyFactory, RulesFactory } from './helpers'

describe('Tests Policy Validator', () => {
  describe('Rule Modality-State tests', () => {
    it('Tests Rules Schema validations', () => {
      const [rule] = RulesFactory({
        modality: 'micromobility',
        states: { available: MICRO_MOBILITY_VEHICLE_EVENTS }
      })

      expect(validateRuleSchema(rule)).not.toBeFalsy()
    })

    it('Tests Rules Schema validations - modality defaults to "micromobility"', () => {
      const [rule] = RulesFactory({
        states: { available: MICRO_MOBILITY_VEHICLE_EVENTS }
      })

      expect(validateRuleSchema(rule)).not.toBeFalsy()
    })

    it('Tests Micromobility State validation', () => {
      const policy2 = PolicyFactory({
        rules: RulesFactory({
          modality: 'micromobility',
          states: { available: MICRO_MOBILITY_VEHICLE_EVENTS }
        })
      })

      expect(() => validatePolicyDomainModel(policy2)).not.toThrowError(ValidationError)

      const policy = PolicyFactory({
        rules: RulesFactory({
          modality: 'micromobility',
          states: { available: ['NOT AN EVENT'] }
        })
      })

      expect(isValidPolicyDomainModel(policy)).toBeFalsy()

      expect(() => validatePolicyDomainModel(policy)).toThrowError(ValidationError)
    })

    it('Tests TNC State validation', () => {
      const policy = PolicyFactory({
        rules: RulesFactory({
          modality: 'tnc',
          states: { available: ['reservation_start', 'NOT A EVENT'] }
        })
      })

      expect(() => validatePolicyDomainModel(policy)).toThrowError(ValidationError)

      const policy2 = PolicyFactory({
        rules: RulesFactory({
          modality: 'tnc',
          states: { available: TNC_VEHICLE_EVENT.slice(0, 3) }
        })
      })

      expect(() => validatePolicyDomainModel(policy2)).not.toThrowError(ValidationError)
    })

    it('Tests Taxi State validation', () => {
      const policy = PolicyFactory({
        rules: RulesFactory({
          modality: 'taxi',
          states: { available: ['reservation_start', 'NOT A EVENT'] }
        })
      })

      expect(() => validatePolicyDomainModel(policy)).toThrowError(ValidationError)

      const policy2 = PolicyFactory({
        rules: RulesFactory({
          modality: 'taxi',
          states: { available: TAXI_VEHICLE_EVENTS.slice(0, 3) }
        })
      })

      expect(() => validatePolicyDomainModel(policy2)).not.toThrowError(ValidationError)
    })
  })

  it('Tests that rate policies require a currency', () => {
    const policy = PolicyFactory({
      rules: RulesFactory({
        modality: 'micromobility',
        rule_type: 'rate',
        states: { available: ['reservation_start'] }
      })
    })

    expect(() => validatePolicyDomainModel(policy)).toThrowError(ValidationError)

    const policyGood = PolicyFactory({
      rules: RulesFactory({
        modality: 'micromobility',
        rule_type: 'rate',
        states: { available: ['reservation_start'] }
      }),
      currency: 'USD'
    })

    expect(() => validatePolicyDomainModel(policyGood)).not.toThrowError(ValidationError)
  })

  it('Tests that policy without modality defined defaults to micrombility', () => {
    const policyShell = PolicyFactory()

    const { rules } = policyShell
    const policy = {
      ...policyShell,
      rules: rules.map(({ modality, ...r }) => ({
        ...r,
        states: { reserved: ['on_hours', 'provider_drop_off'] }
      }))
    }

    const result: PolicyDomainCreateModel = validatePolicyDomainModel(policy)
    expect(result.rules[0]?.modality).toStrictEqual('micromobility')
    expect(result).toMatchObject(policy)
  })

  it('Tests that policy with a rule having an invalid start_time rejects', () => {
    const policyShell = PolicyFactory()

    const { rules } = policyShell
    const policy = {
      ...policyShell,
      rules: rules.map(r => ({
        ...r,
        start_time: '10:00' // this is invalid because it's missing seconds
      }))
    }

    expect(() => validatePolicyDomainModel(policy)).toThrowError(ValidationError)
  })

  it('Tests that policy with a rule having an invalid end_time rejects', () => {
    const policyShell = PolicyFactory()

    const { rules } = policyShell
    const policy = {
      ...policyShell,
      rules: rules.map(r => ({
        ...r,
        end_time: '10:00' // this is invalid because it's missing seconds
      }))
    }

    expect(() => validatePolicyDomainModel(policy)).toThrowError(ValidationError)
  })

  it('Tests that policy with invalid propulsion types rejects', () => {
    const policyShell = PolicyFactory()

    const { rules } = policyShell
    const policy = {
      ...policyShell,
      rules: rules.map(r => ({
        ...r,
        propulsion_types: ['centipede'] // this is invalid because it's not a valid propulsion type
      }))
    }

    expect(() => validatePolicyDomainModel(policy)).toThrowError(ValidationError)
  })
})

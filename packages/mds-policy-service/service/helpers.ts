import { isDefined, minutes, now, uuid } from '@mds-core/mds-utils'
import type { PolicyDomainModel, Rule } from '../@types'
import type { IntentDraft, IntentRuleUserFields, INTENT_TYPE } from '../@types/intents'
import { BASE_POLICY_DEFAULTS, INTENT_RULE_CONSTANTS } from '../@types/intents'

export const TWENTY_MINUTES = minutes(20)
const POLICY_START_DATE_FUDGE_FACTOR = 1000

function ruleFieldToRule(intent_type: INTENT_TYPE, ruleField: IntentRuleUserFields): Rule {
  return { rule_id: uuid(), ...INTENT_RULE_CONSTANTS[intent_type], ...ruleField }
}

export function translateIntentToPolicy<I extends INTENT_TYPE>(draft: IntentDraft<I>): PolicyDomainModel {
  /* The spec says that the start_date must exceed the published_date by 20 minutes.
   * Putting this logic here for now because the only logical place among the service endpoints
   * to put it would be the publishing endpoint, and it feels a bit weird for the publishing endpoint
   * to alter the start_date.
   *
   * I'd like to wait to get a clearer sense of how the front-end flows for policy creation
   * will develop.
   */
  const { start_date } = draft.policy_fields
  if (!isDefined(start_date) || start_date - now() < TWENTY_MINUTES) {
    // Adding 1000 as a fudge factor to ensure that the start_date is
    // at least 20 minutes in the future.
    draft.policy_fields.start_date = now() + TWENTY_MINUTES + POLICY_START_DATE_FUDGE_FACTOR
  }

  const rules = Array.isArray(draft.rule_fields)
    ? draft.rule_fields.map(rule_field => ruleFieldToRule(draft.intent_type, rule_field))
    : [ruleFieldToRule(draft.intent_type, draft.rule_fields)]

  return {
    policy_id: uuid(),
    ...BASE_POLICY_DEFAULTS,
    ...draft.policy_fields,
    rules
  }
}

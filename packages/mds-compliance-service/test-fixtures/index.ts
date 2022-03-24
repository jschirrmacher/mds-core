import { now, uuid } from '@mds-core/mds-utils'
import type { ComplianceViolationDomainModel } from '../@types'

export const ComplianceViolationFactory = (
  overrides: Partial<ComplianceViolationDomainModel> = {}
): ComplianceViolationDomainModel => ({
  violation_id: uuid(),
  timestamp: now(),
  policy_id: uuid(), //FIXME
  provider_id: uuid(), //FIXME
  rule_id: uuid(),
  violation_details: {
    event_timestamp: now(),
    device_id: uuid(),
    trip_id: null
  },
  ...overrides
})

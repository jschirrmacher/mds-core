import type { MatchedVehicleInformation } from '@mds-core/mds-compliance-service'
import type { GeographyDomainModel } from '@mds-core/mds-geography-service'
import type { DeviceDomainModel } from '@mds-core/mds-ingest-service'
import { IngestServiceClient } from '@mds-core/mds-ingest-service'
import type {
  CountPolicy,
  PolicyDomainModel,
  Rule,
  RULE_TYPE,
  SpeedPolicy,
  TimePolicy
} from '@mds-core/mds-policy-service'
import { TIME_FORMAT } from '@mds-core/mds-policy-service'
import { ProviderServiceClient } from '@mds-core/mds-provider-service'
import type { UUID, VehicleEvent } from '@mds-core/mds-types'
import { areThereCommonElements, days, isDefined, now, RuntimeError } from '@mds-core/mds-utils'
import { DateTime, IANAZone } from 'luxon'
import type { ProviderInputs, VehicleEventWithTelemetry } from '../@types'
import { ComplianceEngineLogger as logger } from '../logger'
const { env } = process

const TWO_DAYS_IN_MS = 172800000

const isOfTimeFormat = (timeString: string): timeString is TIME_FORMAT => /^\d{2}:\d{2}:\d{2}$/.test(timeString)

export function getPolicyType(policy: PolicyDomainModel) {
  return policy.rules[0]?.rule_type
}

export const isCountPolicy = (policy: PolicyDomainModel): policy is CountPolicy =>
  policy.rules.every(({ rule_type }) => rule_type === 'count')

export const isTimePolicy = (policy: PolicyDomainModel): policy is TimePolicy =>
  policy.rules.every(({ rule_type }) => rule_type === 'time')

export const isSpeedPolicy = (policy: PolicyDomainModel): policy is SpeedPolicy =>
  policy.rules.every(({ rule_type }) => rule_type === 'speed')

export function generateDeviceMap(devices: DeviceDomainModel[]): { [d: string]: DeviceDomainModel } {
  return [...devices].reduce((deviceMapAcc: { [d: string]: DeviceDomainModel }, device: DeviceDomainModel) => {
    return Object.assign(deviceMapAcc, { [device.device_id]: device })
  }, {})
}

export function isPolicyUniversal(policy: PolicyDomainModel) {
  return !policy.provider_ids || policy.provider_ids.length === 0
}

export async function getAllInputs() {
  const provider_ids = (await ProviderServiceClient.getProviders({})).map(p => p.provider_id)
  const inputs = await Promise.all(provider_ids.map(provider_id => getProviderInputs(provider_id)))
  return inputs.reduce((acc: ProviderInputs, cur) => {
    acc[cur.provider_id] = cur
    return acc
  }, {})
}

/**
 *
 * @param provider_id Provider ID to query for
 * @param timestamp Timestamp to query state up till
 * @returns All events and devices for a given provider
 */
export async function getProviderInputs(provider_id: string, timestamp: number = now()) {
  const {
    events: eventsAcc,
    cursor: { next }
  } = await IngestServiceClient.getEventsUsingOptions({
    provider_ids: [provider_id],
    time_range: { start: timestamp - days(2), end: timestamp },
    grouping_type: 'latest_per_vehicle',
    order: { column: 'timestamp', direction: 'ASC' }
  })

  let cursor = next

  while (cursor !== null) {
    const {
      events,
      cursor: { next: nextCursor }
    } = await IngestServiceClient.getEventsUsingCursor(cursor)

    eventsAcc.push(...events)
    cursor = nextCursor
  }

  const deviceMap = (await IngestServiceClient.getDevices(eventsAcc.map(({ device_id }) => device_id))).reduce<{
    [k: string]: DeviceDomainModel
  }>((acc, device) => {
    acc[device.device_id] = device
    return acc
  }, {})

  return {
    filteredEvents: eventsAcc, // These events are pre-filtered from the service query where we provide a time range and pre-sorted by timestamp
    deviceMap,
    provider_id
  }
}

export function isPolicyActive(policy: Required<PolicyDomainModel>, end_time: number = now()): boolean {
  if (policy.status === undefined) {
    throw new Error('Policy has no defined status')
  }
  return policy.status === 'active'
}

/**
 * Luxon has a helper method for this `weekdayShort`, but it doesn't typecheck :^)
 */
const numericalWeekdayToLocale = (weekdayNum: number) => {
  if (weekdayNum < 1 || weekdayNum > 7) {
    throw new Error(`Invalid weekday number: ${weekdayNum}`)
  }

  const weekdayList = <const>['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return weekdayList[weekdayNum - 1]! // subtract 1 cause arrays are 0 indexed, but luxon provides weekdays in 1 | 2 | 3 | 4 | 5 | 6 | 7 form. (1 = monday) (7 = sunday)
}

/**
 *
 * @param param0 Object which contains a list of days
 * @returns If the current day is in the list of valid days
 */
const isCurrentDayInDays = ({ days }: Pick<Rule, 'days'>) => {
  const { TIMEZONE } = env

  if (!days || days.length === 0) return true

  const currentTime = DateTime.now().setZone(TIMEZONE)

  return days.includes(numericalWeekdayToLocale(currentTime.weekday))
}

/**
 *
 * @param start_time Time in HH:mm:ss format
 * @param end_time Time in HH:mm:ss format
 * @returns If the current local time is within the specified time range.
 *
 * Note: We can just do string comparison here for times, because the format should consistently be HH:mm:ss for all strings.
 */
const isCurrentTimeInInterval = ({ start_time, end_time }: Pick<Rule, 'start_time' | 'end_time'>) => {
  const { TIMEZONE } = env

  const currentTime = DateTime.now().setZone(TIMEZONE)
  const formattedCurrentTime = currentTime.toFormat(TIME_FORMAT)
  if (!isOfTimeFormat(formattedCurrentTime))
    throw new Error(`Current time is in invalid time format: ${formattedCurrentTime}`)

  if (start_time && end_time) {
    // The overnight use-case, e.g. if a rule starts at 7pm and ends at 5am.
    if (start_time >= end_time) return formattedCurrentTime >= start_time || formattedCurrentTime <= end_time

    // Daytime use-case, e.g. if a rule starts at 8am and ends at 5pm.
    return formattedCurrentTime >= start_time && formattedCurrentTime <= end_time
  }

  if (start_time) return formattedCurrentTime >= start_time // we'll assume that if there's no end time, the rule is active from the start_time until the end of the day

  if (end_time) return formattedCurrentTime <= end_time // we'll assume that if there's no start time, the rule is active from the beginning of the day until the end time

  return true
}

export function isRuleActive({ start_time, end_time, days }: Pick<Rule, 'start_time' | 'end_time' | 'days'>): boolean {
  if (!env.TIMEZONE) {
    throw new RuntimeError('TIMEZONE environment variable must be declared!')
  }

  if (!IANAZone.isValidZone(env.TIMEZONE)) {
    throw new RuntimeError(`TIMEZONE environment variable ${env.TIMEZONE} is not a valid timezone!`)
  }

  return isCurrentDayInDays({ days }) && isCurrentTimeInInterval({ start_time, end_time })
}

export function isInVehicleTypes(rule: Rule, device: Pick<DeviceDomainModel, 'vehicle_type'>): boolean {
  return (
    !rule.vehicle_types ||
    rule.vehicle_types.length === 0 ||
    (rule.vehicle_types && rule.vehicle_types.includes(device.vehicle_type))
  )
}

// Take a list of policies, and eliminate all those that have been superseded. Returns
// policies that have not been superseded.
// TODO: move to mds-policly-service
export function getSupersedingPolicies<P extends PolicyDomainModel>(policies: P[]): P[] {
  const prev_policies: string[] = policies.reduce((prev_policies_acc: string[], policy: PolicyDomainModel) => {
    if (policy.prev_policies) {
      prev_policies_acc.push(...policy.prev_policies)
    }
    return prev_policies_acc
  }, [])
  return policies.filter((policy: PolicyDomainModel) => {
    return !prev_policies.includes(policy.policy_id)
  })
}

/**  Keep events that are less than two days old.
 * @param events Events with no telemetry are not used to process compliance and will be filtered out.
 * @param end_time This is a somewhat arbitrary window of time.
 */
export function filterEvents(events: VehicleEvent[], end_time = now()): VehicleEvent[] {
  return events
    .filter((event: VehicleEvent) => {
      return event.telemetry && event.timestamp > end_time - TWO_DAYS_IN_MS
    })
    .sort((e_1, e_2) => {
      return e_1.timestamp - e_2.timestamp
    })
}

export function createMatchedVehicleInformation(
  device: DeviceDomainModel,
  event: VehicleEventWithTelemetry,
  speed?: number,
  rule_applied_id?: UUID,
  rules_matched?: UUID[]
): MatchedVehicleInformation {
  return {
    device_id: device.device_id,
    state: event.vehicle_state,
    event_types: event.event_types,
    timestamp: event.timestamp,
    rules_matched: rules_matched || [],
    rule_applied: rule_applied_id,
    speed,
    gps: {
      lat: event.telemetry.gps.lat,
      lng: event.telemetry.gps.lng
    }
  }
}

export function annotateVehicleMap<T extends Rule<Exclude<RULE_TYPE, 'rate'>>>(
  policy: PolicyDomainModel,
  events: VehicleEventWithTelemetry[],
  geographies: GeographyDomainModel[],
  vehicleMap: {
    [d: string]: { device: DeviceDomainModel; speed?: number; rule_applied?: UUID; rules_matched?: UUID[] }
  },
  matcherFunction: (
    rule: T,
    geographyArr: GeographyDomainModel[],
    device: DeviceDomainModel,
    event: VehicleEventWithTelemetry
  ) => boolean
): MatchedVehicleInformation[] {
  // For holding the final form of the relevant vehicle, event, and matching rule data.
  const vehiclesFoundMap: { [d: string]: MatchedVehicleInformation } = {}
  const filteredEvents = events.filter(event => {
    return Boolean(vehicleMap[event.device_id])
  }) as VehicleEventWithTelemetry[]
  policy.rules.forEach(rule => {
    filteredEvents.forEach(event => {
      const vehicle = vehicleMap[event.device_id]
      if (!vehicle) {
        logger.warn(`No vehicle entry found for event ${event.device_id}`)
        return // this should never happen, but better safe than sorry
      }
      const { device, speed, rule_applied, rules_matched = [] } = vehicle
      const { device_id } = device
      const { rule_id } = rule
      if (matcherFunction(rule as T, geographies, device, event)) {
        if (!vehiclesFoundMap[device_id]) {
          if (!rules_matched.includes(rule_id)) {
            rules_matched.push(rule_id)
          }
          vehiclesFoundMap[device_id] = createMatchedVehicleInformation(
            device,
            event,
            speed,
            rule_applied,
            rules_matched
          )
        } else if (!vehiclesFoundMap[device_id]?.rules_matched.includes(rule_id)) {
          vehiclesFoundMap[device_id]?.rules_matched.push(rule_id)
        }
      }
    })
  })
  return Object.values(vehiclesFoundMap)
}

export async function getProviderIDs(provider_ids: UUID[] | undefined | null) {
  if (!isDefined(provider_ids) || !Array.isArray(provider_ids) || provider_ids.length < 1) {
    return (await ProviderServiceClient.getProviders({})).map(p => p.provider_id)
  }
  return provider_ids
}

/**
 * Suppose we have an event with event_types `["trip_end", "battery_low"]`, and a
 * `vehicle_state` of `non_operational`, and a rule on a policy
 * where the `states` are `{ "non_operational": ["trip_end"] }`. That should be a match.
 *
 * The original solution to handling multiple `event_types` on an event was to
 * match on transient states, e.g. `["trip_end", "reservation_start"] would have
 * matched `states: { available: []}` because `trip_end` transitions to `available`
 * and only `available`, but this doesn't work if you have an event with
 * `["unspecified", "unspecified"]`. It's impossible to narrow the state down since
 * every state is valid in between those event types.
 */
export function isInStatesOrEvents(
  rule: Pick<Rule, 'states' | 'modality'>,
  device: Pick<DeviceDomainModel, 'modality'>,
  event: Pick<VehicleEvent, 'event_types' | 'vehicle_state'>
): boolean {
  const { states } = rule

  if ((rule.modality ?? 'micromobility') !== device.modality) return false

  // If no states are specified, then the rule applies to all VehicleStates.
  if (states === null || states === undefined || Object.keys(states).length === 0) return true

  const { vehicle_state } = event
  // FIXME It might be possible to avoid this `any` cast...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ruleEventTypes = (states as any)[vehicle_state]
  if (!ruleEventTypes) return false
  if (ruleEventTypes.length === 0) return true
  if (areThereCommonElements(event.event_types, ruleEventTypes)) return true
  return false
}

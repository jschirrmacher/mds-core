/*
    Copyright 2019 City of Los Angeles.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
 */

import { Device, Geography, Policy, VehicleEvent, UUID, CountRule, Telemetry } from '@mds-core/mds-types'

import { pointInShape, getPolygon, isInStatesOrEvents, isDefined } from '@mds-core/mds-utils'
import { ComplianceResult } from '../@types'
import { annotateVehicleMap, isInVehicleTypes, isPolicyActive, isRuleActive } from './helpers'

export function isCountRuleMatch(
  rule: CountRule,
  geographies: Geography[],
  device: Device,
  // We throw out events that have no telemetry, so events are guaranteed
  // to have telemetry.
  event: VehicleEvent & { telemetry: Telemetry }
) {
  if (isRuleActive(rule)) {
    for (const geography of rule.geographies) {
      if (isInStatesOrEvents(rule, event) && isInVehicleTypes(rule, device)) {
        const poly = getPolygon(geographies, geography)
        if (poly && pointInShape(event.telemetry.gps, poly)) {
          return true
        }
      }
    }
  }
  return false
}

/*
 * This one has the trickiest logic to understand. Basically, if a vehicle matches a rule, it is not
 * necessarily in violation of it. This is confusing because when a vehicle matches a speed rule or a
 * time rule, it's in violation of those rules. It's better to think of the vehicle as being captured
 * by a count rule.
 * Anyway, say a vehicle is captured by a count rule with a maximum of 5, and this is vehicle number
 * six. It overflows into evaluation for the next rule. If the vehicle is a match for the next rule,
 * and under that rule's maximum, it wouldn't count as violating anything. If a vehicle overflows, and
 * never matches for a subsequent rule, then it is considered in violation of the policy.
 */
export function processCountPolicy(
  policy: Policy,
  events: (VehicleEvent & { telemetry: Telemetry })[],
  geographies: Geography[],
  devicesToCheck: { [d: string]: Device }
): ComplianceResult | undefined {
  const matchedVehicles: { [d: string]: { device: Device; rule_applied: UUID; rules_matched?: UUID[] } } = {}
  const overflowedVehicles: { [d: string]: { device: Device; rules_matched: UUID[] } } = {}
  let countMinimumViolations = 0
  let excess_vehicles_count = 0
  if (isPolicyActive(policy)) {
    const sortedEvents = events.sort((e_1, e_2) => {
      return e_1.timestamp - e_2.timestamp
    })
    policy.rules.forEach(rule => {
      const maximum = isDefined(rule.maximum) ? rule.maximum : Number.POSITIVE_INFINITY
      const { rule_id } = rule
      // Think of `i` as indicating the # of matches for this rule seen so far.
      let i = 0
      sortedEvents.forEach(event => {
        if (devicesToCheck[event.device_id]) {
          const device = devicesToCheck[event.device_id]
          if (isCountRuleMatch(rule as CountRule, geographies, device, event)) {
            if (i < maximum) {
              matchedVehicles[device.device_id] = { device, rule_applied: rule_id, rules_matched: [rule_id] }
              /* eslint-reason need to remove matched vehicles */
              /* eslint-disable-next-line no-param-reassign */
              delete devicesToCheck[device.device_id]
              delete overflowedVehicles[device.device_id]
            } else if (overflowedVehicles[device.device_id]) {
              overflowedVehicles[device.device_id].rules_matched.push(rule_id)
            } else {
              overflowedVehicles[device.device_id] = {
                device,
                rules_matched: [rule.rule_id]
              }
            }
            // Increment whenever there's a match.
            i += 1
          }
        }
      })
      const minimum = rule.minimum == null ? Number.NEGATIVE_INFINITY : rule.minimum
      if (i < minimum) {
        countMinimumViolations += minimum - i
      }
    })
    excess_vehicles_count = Object.keys(overflowedVehicles).length
    const matchedVehiclesArr = annotateVehicleMap(policy, sortedEvents, geographies, matchedVehicles, isCountRuleMatch)
    const overflowedVehiclesArr = annotateVehicleMap(
      policy,
      sortedEvents,
      geographies,
      overflowedVehicles,
      isCountRuleMatch
    )

    return {
      vehicles_found: [...matchedVehiclesArr, ...overflowedVehiclesArr],
      excess_vehicles_count,
      total_violations: countMinimumViolations + excess_vehicles_count
    }
  }
}

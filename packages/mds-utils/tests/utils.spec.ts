/**
 * Copyright 2019 City of Los Angeles
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

import type { MicroMobilityVehicleEvent } from '@mds-core/mds-types'
import {
  MICRO_MOBILITY_EVENT_STATES_MAP,
  MICRO_MOBILITY_VEHICLE_EVENTS,
  MICRO_MOBILITY_VEHICLE_STATES
} from '@mds-core/mds-types'
import { isEventValid, stateTransitionDict } from '../state-machine'
import { filterDefined, isEventSequenceValid, normalizeToArray, routeDistance } from '../utils'

const Boston = { lat: 42.360081, lng: -71.058884 }
const LosAngeles = { lat: 34.052235, lng: -118.243683 }
const BostonToLA = 4169605.469765776

describe('Tests Utilities', () => {
  it('routeDistance: Verifies single point', () => {
    expect(routeDistance([Boston])).toStrictEqual(0)
  })

  it('routeDistance: Verifies 2 points', () => {
    expect(routeDistance([Boston, LosAngeles])).toStrictEqual(BostonToLA)
  })

  it('routeDistance: Verifies 2+ points', () => {
    expect(routeDistance([Boston, LosAngeles, Boston])).toStrictEqual(BostonToLA * 2)
  })

  describe('Filter empty', () => {
    it('Filters out null/undefined elements', () => {
      const arr = [1, 2, null, 3, undefined, 4]
      const actual = arr.filter(filterDefined())
      const expected = [1, 2, 3, 4]
      expect(actual).toStrictEqual(expected)
    })

    it('Does not filter 0 or "" (empty string) or [] (empty array)', () => {
      const arr = [1, 2, '', 3, [], 0]
      const actual = arr.filter(filterDefined())
      const expected = arr
      expect(actual).toStrictEqual(expected)
    })

    // Can't seem to get TS to go along with Sinon.spy()
    // See https://sinonjs.org/releases/latest/spies/

    // it('Calls logger.warn', () => {
    //   const spy = Sinon.spy(logger.warn)
    //   const oldLogWarn = logger.warn
    //   logger.warn = spy

    //   const arr = [1, 2, null, 3, undefined, 4]
    //   const actual = arr.filter(filterDefined())
    //   const expected = [1, 2, 3, 4]
    //   assert.deepStrictEqual(actual, expected)
    //   assert.equal(spy.calledTwice, true)
    //   Sinon.restore()
    //   logger.warn = oldLogWarn
    // })
  })

  describe('Normalize to array', () => {
    it('Normalizes undefined to empty array', () => {
      expect(normalizeToArray(undefined)).toStrictEqual([])
    })
    it('Normalizes single element into singleton array', () => {
      expect(normalizeToArray('test')).toStrictEqual(['test'])
    })
    it('Leaves array untouched', () => {
      expect(normalizeToArray(['test1', 'test2'])).toStrictEqual(['test1', 'test2'])
    })
  })

  describe('State machine', () => {
    it('Tests state transitions', () => {
      const events = MICRO_MOBILITY_VEHICLE_EVENTS
      const states = MICRO_MOBILITY_VEHICLE_STATES
      for (const event_type_A of events) {
        for (const eventAState of states) {
          const eventA = { vehicle_state: eventAState, event_types: [event_type_A] } as MicroMobilityVehicleEvent
          expect(isEventValid(eventA)).toStrictEqual(
            MICRO_MOBILITY_EVENT_STATES_MAP[event_type_A].includes(eventAState)
          )
          for (const event_type_B of events) {
            for (const eventBState of states) {
              const eventB = { vehicle_state: eventBState, event_types: [event_type_B] } as MicroMobilityVehicleEvent
              expect(isEventValid(eventB)).toStrictEqual(
                MICRO_MOBILITY_EVENT_STATES_MAP[event_type_B].includes(eventBState)
              )
              const actual = isEventSequenceValid(eventA, eventB, 'micromobility')
              const stateTransitionValidity = !!stateTransitionDict[eventAState][event_type_B]?.includes(eventBState)
              expect(actual).toStrictEqual(stateTransitionValidity)
            }
          }
        }
      }
    })

    it('isEventSequenceValid returns true when there are multiple valid event_types in an event', () => {
      const eventA = { vehicle_state: 'on_trip', event_types: ['trip_start'] } as MicroMobilityVehicleEvent
      const eventB = {
        vehicle_state: 'unknown',
        event_types: ['trip_leave_jurisdiction', 'comms_lost']
      } as MicroMobilityVehicleEvent
      expect(isEventSequenceValid(eventA, eventB, 'micromobility')).toBeTruthy()
    })

    it('isEventSequenceValid returns false when the multiple event_types are invalid', () => {
      const eventA = { vehicle_state: 'on_trip', event_types: ['trip_start'] } as MicroMobilityVehicleEvent
      const eventB = {
        vehicle_state: 'unknown',
        event_types: ['comms_lost', 'comms_lost']
      } as MicroMobilityVehicleEvent
      expect(!isEventSequenceValid(eventA, eventB, 'micromobility')).toBeTruthy()
    })
  })
})

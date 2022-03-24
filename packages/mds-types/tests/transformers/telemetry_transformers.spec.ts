/**
 * Copyright 2021 City of Los Angeles
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

import { convert_v0_4_1_telemetry_to_1_0_0 } from '../../transformers'
import type { Telemetry_v0_4_1 } from '../../transformers/@types'

const telemetry: Telemetry_v0_4_1 = {
  provider_id: 'baf215d4-8b4b-4be4-8189-980171a964ba',
  device_id: 'd0d9c274-773f-46c4-8c3a-f3cd35e4f99c',
  gps: {
    lat: 10,
    lng: 10
  },
  timestamp: Date.now()
}

describe('Test transformers', () => {
  it('checks the transformation between v0.4.1 and v1.0.0 Telemetry types', async () => {
    // undefined GPS heading is not transformed
    expect(convert_v0_4_1_telemetry_to_1_0_0(telemetry)).toEqual(telemetry)

    // null GPS heading is not transformed
    expect(convert_v0_4_1_telemetry_to_1_0_0({ ...telemetry, gps: { ...telemetry.gps, heading: null } })).toEqual({
      ...telemetry,
      gps: { ...telemetry.gps, heading: null }
    })

    // Clockwise (positive) GPS heading is not transformed
    expect(convert_v0_4_1_telemetry_to_1_0_0({ ...telemetry, gps: { ...telemetry.gps, heading: 180 } })).toEqual({
      ...telemetry,
      gps: { ...telemetry.gps, heading: 180 }
    })

    // Counter-clockwise (negative) GPS heading is transformed to clcckwuse (positive)
    expect(convert_v0_4_1_telemetry_to_1_0_0({ ...telemetry, gps: { ...telemetry.gps, heading: -180 } })).toEqual({
      ...telemetry,
      gps: { ...telemetry.gps, heading: 180 }
    })
  })
})

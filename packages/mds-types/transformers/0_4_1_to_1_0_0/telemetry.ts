import type { Telemetry_v0_4_1, Telemetry_v1_0_0 } from '../@types'

// The 0.4 and 1.0 telemetry shapes are the same, but in 0.4 clockwise (positive) GPS heading values are not enforced
export function convert_v0_4_1_telemetry_to_1_0_0(telemetry: Telemetry_v0_4_1): Telemetry_v1_0_0 {
  const {
    gps: { heading, ...gps }
  } = telemetry
  return heading && heading < 0
    ? {
        ...telemetry,
        gps: { ...gps, heading: heading + 360 }
      }
    : telemetry
}

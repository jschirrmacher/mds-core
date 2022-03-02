import { Enum } from '@mds-core/mds-types'

export const MICRO_MOBILITY_VEHICLE_EVENTS_v1_1_0 = [
  'agency_drop_off',
  'agency_pick_up',
  'battery_charged',
  'battery_low',
  'comms_lost',
  'comms_restored',
  'compliance_pick_up',
  'decommissioned',
  'located',
  'maintenance',
  'maintenance_pick_up',
  'missing',
  'off_hours',
  'on_hours',
  'provider_drop_off',
  'rebalance_pick_up',
  'reservation_cancel',
  'reservation_start',
  'system_resume',
  'system_suspend',
  'trip_cancel',
  'trip_end',
  'trip_enter_jurisdiction',
  'trip_leave_jurisdiction',
  'trip_start',
  'unspecified'
] as const
export type MICRO_MOBILITY_VEHICLE_EVENT_v1_1_0 = typeof MICRO_MOBILITY_VEHICLE_EVENTS_v1_1_0[number]

export const MICRO_MOBILITY_VEHICLE_EVENTS = MICRO_MOBILITY_VEHICLE_EVENTS_v1_1_0
export type MICRO_MOBILITY_VEHICLE_EVENT = MICRO_MOBILITY_VEHICLE_EVENT_v1_1_0

export const TAXI_VEHICLE_EVENTS = [
  'comms_lost',
  'comms_restored',
  'decommissioned',
  'maintenance_start',
  'maintenance_end',
  'driver_cancellation',
  'enter_jurisdiction',
  'leave_jurisdiction',
  'maintenance',
  'passenger_cancellation',
  'provider_cancellation',
  'recommissioned',
  'reservation_start',
  'reservation_stop',
  'service_end',
  'service_start',
  'trip_end',
  'trip_resume',
  'trip_start',
  'trip_stop'
] as const
export type TAXI_VEHICLE_EVENT = typeof TAXI_VEHICLE_EVENTS[number]

export const TNC_VEHICLE_EVENT = [
  'comms_lost',
  'comms_restored',
  'driver_cancellation',
  'enter_jurisdiction',
  'leave_jurisdiction',
  'passenger_cancellation',
  'provider_cancellation',
  'reservation_start',
  'reservation_stop',
  'service_end',
  'service_start',
  'trip_end',
  'trip_resume',
  'trip_start',
  'trip_stop',
  'unspecified'
] as const
export type TNC_VEHICLE_EVENT = typeof TNC_VEHICLE_EVENT[number]

export const TAXI_TRIP_EXIT_EVENTS: TAXI_VEHICLE_EVENT[] = [
  'trip_end',
  'leave_jurisdiction',
  'passenger_cancellation',
  'provider_cancellation',
  'driver_cancellation'
]

export const TNC_TRIP_EXIT_EVENTS: TNC_VEHICLE_EVENT[] = [
  'trip_end',
  'leave_jurisdiction',
  'passenger_cancellation',
  'provider_cancellation',
  'driver_cancellation'
]

export const VEHICLE_EVENTS_v1_1_0 = [
  ...new Set([...MICRO_MOBILITY_VEHICLE_EVENTS, ...TAXI_VEHICLE_EVENTS, ...TNC_VEHICLE_EVENT])
] as const
export type VEHICLE_EVENT_v1_1_0 = typeof VEHICLE_EVENTS[number]

export const VEHICLE_EVENTS = VEHICLE_EVENTS_v1_1_0
export type VEHICLE_EVENT = VEHICLE_EVENT_v1_1_0

export const AUDIT_EVENT_TYPES = Enum('start', 'note', 'summary', 'issue', 'telemetry', 'end')
export type AUDIT_EVENT_TYPE = keyof typeof AUDIT_EVENT_TYPES
export const AUDIT_EVENTS = <const>['start', 'note', 'summary', 'issue', 'telemetry', 'end']

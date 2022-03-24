import {
  convert_v0_4_1_vehicle_event_to_v1_0_0,
  convert_v1_0_0_vehicle_event_to_v0_4_1,
  UnsupportedEventTypeError
} from '../../transformers'
import type { VehicleEvent_v0_4_1, VehicleEvent_v1_0_0 } from '../../transformers/@types'

const TIME = Date.now()
const DEVICE_ID = 'd0d9c274-773f-46c4-8c3a-f3cd35e4f99c'
const PROVIDER_ID = 'baf215d4-8b4b-4be4-8189-980171a964ba'
const STOP_ID = '3f411cb1-a5a4-4b29-9e72-2714fdd24bc8'

describe('Test transformers', () => {
  describe('spot checks the transformation between v0.4.1 and v1.0.0 VehicleEvent types', () => {
    it('checks the provider_pick_up and charge combo translate correctly', async () => {
      const event: VehicleEvent_v0_4_1 = {
        device_id: DEVICE_ID,
        provider_id: PROVIDER_ID,
        timestamp: TIME,
        event_type: 'provider_pick_up',
        event_type_reason: 'charge',
        recorded: TIME,
        telemetry_timestamp: TIME,
        telemetry: {
          provider_id: PROVIDER_ID,
          device_id: DEVICE_ID,
          gps: {
            lat: 10,
            lng: 10
          },
          timestamp: TIME
        }
      }

      const transformedEvent = convert_v0_4_1_vehicle_event_to_v1_0_0(event)
      expect(transformedEvent).toEqual({
        device_id: DEVICE_ID,
        provider_id: PROVIDER_ID,
        timestamp: TIME,
        vehicle_state: 'removed',
        event_types: ['maintenance_pick_up'],
        recorded: TIME,
        telemetry_timestamp: TIME,
        telemetry: {
          provider_id: PROVIDER_ID,
          device_id: DEVICE_ID,
          gps: {
            lat: 10,
            lng: 10
          },
          timestamp: TIME
        },
        trip_id: null
      })
    })

    it('checks that the service_end and low_battery combo translate correctly', async () => {
      const event: VehicleEvent_v0_4_1 = {
        device_id: DEVICE_ID,
        provider_id: PROVIDER_ID,
        timestamp: TIME,
        event_type: 'service_end',
        event_type_reason: 'low_battery',
        recorded: TIME,
        telemetry_timestamp: TIME,
        telemetry: {
          provider_id: PROVIDER_ID,
          device_id: DEVICE_ID,
          gps: {
            lat: 10,
            lng: 10
          },
          timestamp: TIME
        }
      }

      const transformedEvent = convert_v0_4_1_vehicle_event_to_v1_0_0(event)
      expect(transformedEvent).toEqual({
        device_id: DEVICE_ID,
        provider_id: PROVIDER_ID,
        timestamp: TIME,
        vehicle_state: 'non_operational',
        event_types: ['battery_low'],
        recorded: TIME,
        telemetry_timestamp: TIME,
        telemetry: {
          provider_id: PROVIDER_ID,
          device_id: DEVICE_ID,
          gps: {
            lat: 10,
            lng: 10
          },
          timestamp: TIME
        },
        trip_id: null
      })
    })

    it('verifies the translation of trip_enter to on_trip', async () => {
      const event: VehicleEvent_v0_4_1 = {
        device_id: DEVICE_ID,
        provider_id: PROVIDER_ID,
        timestamp: TIME,
        event_type: 'trip_enter',
        recorded: TIME,
        telemetry_timestamp: TIME,
        telemetry: {
          provider_id: PROVIDER_ID,
          device_id: DEVICE_ID,
          gps: {
            lat: 10,
            lng: 10
          },
          timestamp: TIME
        }
      }

      const transformedEvent = convert_v0_4_1_vehicle_event_to_v1_0_0(event)

      expect(transformedEvent).toEqual({
        device_id: DEVICE_ID,
        provider_id: PROVIDER_ID,
        timestamp: TIME,
        vehicle_state: 'on_trip',
        event_types: ['trip_enter_jurisdiction'],
        recorded: TIME,
        telemetry_timestamp: TIME,
        telemetry: {
          provider_id: PROVIDER_ID,
          device_id: DEVICE_ID,
          gps: {
            lat: 10,
            lng: 10
          },
          timestamp: TIME
        },
        trip_id: null
      })
    })

    it('throws an error with the event_type `register`', async () => {
      const event: VehicleEvent_v0_4_1 = {
        device_id: DEVICE_ID,
        provider_id: PROVIDER_ID,
        timestamp: TIME,
        event_type: 'register',
        recorded: TIME,
        telemetry_timestamp: TIME,
        telemetry: {
          provider_id: PROVIDER_ID,
          device_id: DEVICE_ID,
          gps: {
            lat: 10,
            lng: 10
          },
          timestamp: TIME
        }
      }

      expect(() => convert_v0_4_1_vehicle_event_to_v1_0_0(event)).toThrowError(UnsupportedEventTypeError)
    })
  })

  it('spot checks the transformations between v1.0.0 VehicleEvent and v0.4.1 VehicleEvent when there are multiple event types', () => {
    const eventA: VehicleEvent_v1_0_0 = {
      device_id: DEVICE_ID,
      provider_id: PROVIDER_ID,
      timestamp: TIME,
      vehicle_state: 'on_trip',
      event_types: ['provider_drop_off', 'trip_start'],
      recorded: TIME,
      telemetry_timestamp: TIME,
      telemetry: {
        provider_id: PROVIDER_ID,
        device_id: DEVICE_ID,
        gps: {
          lat: 10,
          lng: 10
        },
        timestamp: TIME
      }
    }

    const [converted_eventA_1, converted_eventA_2] = convert_v1_0_0_vehicle_event_to_v0_4_1(eventA)
    expect(converted_eventA_1?.event_type).toEqual('provider_drop_off')
    expect(converted_eventA_2?.event_type).toEqual('trip_start')

    const eventB: VehicleEvent_v1_0_0 = {
      device_id: DEVICE_ID,
      provider_id: PROVIDER_ID,
      timestamp: TIME,
      vehicle_state: 'available',
      event_types: ['comms_lost', 'comms_restored'],
      telemetry_timestamp: TIME,
      telemetry: {
        provider_id: PROVIDER_ID,
        device_id: DEVICE_ID,
        timestamp: TIME,
        gps: {
          lat: 1000,
          lng: 1000,
          speed: 1,
          hdop: 5,
          heading: 5
        },
        stop_id: STOP_ID
      },
      recorded: TIME
    }

    const [converted_eventB_1, converted_eventB_2] = convert_v1_0_0_vehicle_event_to_v0_4_1(eventB)
    expect(converted_eventB_1?.event_type).toEqual('no_backconversion_available')
    expect(converted_eventB_2?.event_type).toEqual('no_backconversion_available')
    expect(converted_eventB_2?.telemetry).toEqual({
      provider_id: PROVIDER_ID,
      device_id: DEVICE_ID,
      timestamp: TIME,
      gps: {
        lat: 1000,
        lng: 1000,
        speed: 1,
        hdop: 5,
        heading: 5
      }
    })
  })
})

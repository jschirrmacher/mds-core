import cache from '@mds-core/mds-agency-cache'
import { ApiServer } from '@mds-core/mds-api-server'
import db from '@mds-core/mds-db'
import stream from '@mds-core/mds-stream'
import { uuid } from '@mds-core/mds-utils'
import { StatusCodes } from 'http-status-codes'
import supertest from 'supertest'
import { api } from '../api'
import {
  basicTripFlow,
  constructTripMetadata,
  fakeVehicle,
  POSTableVehicleEvent,
  postEvent,
  postTripMetadata,
  registerVehicleRequest
} from './taxi-test-helpers'

const HOSTNAME = process.env.AGENCY_URL ?? ''

describe('Taxi Tests', () => {
  const request = HOSTNAME ? supertest(HOSTNAME) : supertest(ApiServer(api))

  beforeAll(async () => {
    if (!HOSTNAME) await Promise.all([db.reinitialize(), cache.reinitialize()])
  })

  afterAll(async () => {
    if (!HOSTNAME) await Promise.all([cache.shutdown(), stream.shutdown(), db.shutdown()])
  })

  describe('Scenarios', () => {
    describe('1. Available for-hire', () => {
      it('1.a Taxi becomes available for-hire', async () => {
        const vehicle = fakeVehicle()
        const events: POSTableVehicleEvent[] = []

        await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)
        await postEvent(request, events, vehicle, StatusCodes.CREATED, {
          event_types: ['service_start'],
          vehicle_state: 'available'
        })
      })

      it('1.b Taxi stops being available for-hire', async () => {
        const vehicle = fakeVehicle()
        const events: POSTableVehicleEvent[] = []

        await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)
        await postEvent(request, events, vehicle, StatusCodes.CREATED, {
          event_types: ['service_end'],
          vehicle_state: 'non_operational'
        })
      })

      it('1.c Taxi driver takes a break', async () => {
        const vehicle = fakeVehicle()
        const events: POSTableVehicleEvent[] = []

        await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)
        await postEvent(request, events, vehicle, StatusCodes.CREATED, {
          event_types: ['service_start'],
          vehicle_state: 'available'
        })
        await postEvent(request, events, vehicle, StatusCodes.CREATED, {
          event_types: ['service_end'],
          vehicle_state: 'non_operational'
        })
      })
    })

    describe('2. Trips', () => {
      describe('2.a Reservation Methods', () => {
        it('2.a.i Taxi picks up and drops off a passenger who requested a ride by calling the taxi company', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)

          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(request, constructTripMetadata(events)).expect(StatusCodes.CREATED)
        })

        it('2.a.ii Taxi picks up and drops off a passenger who requested a ride using an app', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)
          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(request, constructTripMetadata(events, { reservation_method: 'app' })).expect(
            StatusCodes.CREATED
          )
        })

        it('2.a.iii Taxi picks up and drops off a passenger who hailed the taxi in the street', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)
          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(request, constructTripMetadata(events, { reservation_method: 'street_hail' })).expect(
            StatusCodes.CREATED
          )
        })

        it('2.a.iv Taxi picks up and drops off a passenger who requested a scheduled pickup at a specific time', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)
          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(
            request,
            constructTripMetadata(events, { reservation_method: 'app', reservation_type: 'scheduled' })
          ).expect(StatusCodes.CREATED)
        })
      })

      describe('2.b Wheelchair Passengers', () => {
        it('2.b.i Taxi picks up and drops off a passenger using a wheelchair', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)

          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(
            request,
            constructTripMetadata(events, { accessibility_options: ['wheelchair_accessible'] })
          ).expect(StatusCodes.CREATED)
        })
      })

      describe('2.c Fares', () => {
        it('2.c.i Taxi picks up and drops off a passenger who pays their fare using multiple payment methods', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)

          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(
            request,
            constructTripMetadata(events, {
              fare: {
                quoted_cost: 2000,
                actual_cost: 2500,
                components: {},
                currency: 'USD',
                payment_methods: ['cash', 'card']
              }
            })
          ).expect(StatusCodes.CREATED)
        })

        it('2.c.ii Taxi picks up and drops off a passenger who pays their fare using an equity program', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)

          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(
            request,
            constructTripMetadata(events, {
              fare: {
                quoted_cost: 2000,
                actual_cost: 2500,
                components: {},
                currency: 'USD',
                payment_methods: ['equity_program']
              }
            })
          ).expect(StatusCodes.CREATED)
        })

        it('2.c.iii Taxi picks up and drops off a passenger at the airport, incurring a fee', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)

          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(
            request,
            constructTripMetadata(events, {
              fare: {
                quoted_cost: 2000,
                actual_cost: 2500,
                components: {
                  LAX_Trip_Fee: 400
                },
                currency: 'USD',
                payment_methods: ['card']
              }
            })
          ).expect(StatusCodes.CREATED)
        })

        it('2.c.iv Taxi picks up a passenger and uses an express lane before dropping them off, incurring a fee', async () => {
          const events: POSTableVehicleEvent[] = []
          const vehicle = fakeVehicle()

          await registerVehicleRequest(request, vehicle).expect(StatusCodes.CREATED)

          await basicTripFlow(request, events, vehicle)

          await postTripMetadata(
            request,
            constructTripMetadata(events, {
              fare: {
                quoted_cost: 2000,
                actual_cost: 2500,
                components: {
                  '105_Express_Lane_Toll': 200
                },
                currency: 'USD',
                payment_methods: ['card']
              }
            })
          ).expect(StatusCodes.CREATED)
        })
      })

      describe('2.d Trip Reallocation', () => {
        it('2.d.i Tests reallocation', async () => {
          const events: POSTableVehicleEvent[] = []
          const firstVehicle = fakeVehicle()

          await registerVehicleRequest(request, firstVehicle).expect(StatusCodes.CREATED)

          const trip_id = uuid()

          await postEvent(request, events, firstVehicle, StatusCodes.CREATED, {
            event_types: ['service_start'],
            vehicle_state: 'available'
          })

          await postEvent(request, events, firstVehicle, StatusCodes.CREATED, {
            event_types: ['reservation_start'],
            vehicle_state: 'reserved',
            trip_state: 'reserved',
            trip_id
          })

          await postEvent(request, events, firstVehicle, StatusCodes.CREATED, {
            event_types: ['provider_cancellation'],
            vehicle_state: 'available',
            trip_id
          })

          const secondVehicle = fakeVehicle()

          await registerVehicleRequest(request, secondVehicle).expect(StatusCodes.CREATED)

          await basicTripFlow(request, events, secondVehicle, trip_id)

          await postTripMetadata(request, constructTripMetadata(events)).expect(StatusCodes.CREATED)
        })
      })
    })
  })
})

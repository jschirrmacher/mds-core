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

import { ModelMapper } from '@mds-core/mds-repository'
import type { EventWithDeviceAndTelemetryInfoDomainModel } from '../../@types'
import type { EventWithDeviceAndTelemetryInfoEntityModel } from '../views/event-with-device-and-telemetry-info'

type EventWithDeviceAndTelemetryInfoEntityToDomainOptions = Partial<{}>

export const EventWithDeviceAndTelemetryInfoEntityToDomain = ModelMapper<
  EventWithDeviceAndTelemetryInfoEntityModel,
  EventWithDeviceAndTelemetryInfoDomainModel,
  EventWithDeviceAndTelemetryInfoEntityToDomainOptions
>((entity, options) => {
  const {
    id,
    vehicle_id,
    vehicle_type,
    propulsion_types,
    year,
    mfgr,
    model,
    accessibility_options,
    modality,
    device_recorded,
    lat,
    lng,
    altitude,
    speed,
    heading,
    accuracy,
    hdop,
    satellites,
    charge,
    stop_id,
    telemetry_recorded,
    ...event
  } = entity
  const { device_id, provider_id } = event
  return {
    ...event,
    device: {
      device_id,
      provider_id,
      vehicle_id,
      vehicle_type,
      propulsion_types,
      year,
      mfgr,
      model,
      accessibility_options,
      modality,
      recorded: device_recorded
    },
    telemetry: {
      device_id,
      provider_id,
      timestamp: event.telemetry_timestamp ?? event.timestamp, // TODO: telemetry_timestamp should be NOT NULL
      gps: { lat, lng, altitude, speed, heading, accuracy, hdop, satellites },
      charge,
      stop_id,
      recorded: telemetry_recorded
    }
  }
})

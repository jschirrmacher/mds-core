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

import {
  ACCESSIBILITY_OPTION,
  MODALITY,
  Nullable,
  PROPULSION_TYPE,
  Timestamp,
  TRIP_STATE,
  UUID,
  VEHICLE_EVENT,
  VEHICLE_STATE,
  VEHICLE_TYPE
} from '@mds-core/mds-types'
import { ViewColumn, ViewEntity } from 'typeorm'
import { DeviceEntity } from '../entities/device-entity'
import { EventEntity } from '../entities/event-entity'
import { TelemetryEntity } from '../entities/telemetry-entity'
import { MigratedEntityModel } from '../mixins/migrated-entity'

export type EventWithDeviceAndTelemetryInfoEntityModel = Omit<
  EventEntity & DeviceEntity & TelemetryEntity,
  keyof MigratedEntityModel | 'annotation' | 'telemetry'
> & {
  device_recorded: DeviceEntity['recorded']
  telemetry_recorded: TelemetryEntity['recorded']
}

@ViewEntity({
  name: 'events_with_device_and_telemetry_info_view',
  expression: connection =>
    connection
      .createQueryBuilder()
      .select('event.id', 'id')
      .addSelect('event.recorded', 'recorded')
      .addSelect('event.device_id', 'device_id')
      .addSelect('event.provider_id', 'provider_id')
      .addSelect('event.timestamp', 'timestamp')
      .addSelect('event.event_types', 'event_types')
      .addSelect('event.vehicle_state', 'vehicle_state')
      .addSelect('event.trip_state', 'trip_state')
      .addSelect('event.telemetry_timestamp', 'telemetry_timestamp')
      .addSelect('event.trip_id', 'trip_id')
      .addSelect('device.vehicle_id', 'vehicle_id')
      .addSelect('device.vehicle_type', 'vehicle_type')
      .addSelect('device.propulsion_types', 'propulsion_types')
      .addSelect('device.year', 'year')
      .addSelect('device.mfgr', 'mfgr')
      .addSelect('device.model', 'model')
      .addSelect('device.accessibility_options', 'accessibility_options')
      .addSelect('device.modality', 'modality')
      .addSelect('device.recorded', 'device_recorded')
      .addSelect('telemetry.lat', 'lat')
      .addSelect('telemetry.lng', 'lng')
      .addSelect('telemetry.altitude', 'altitude')
      .addSelect('telemetry.speed', 'speed')
      .addSelect('telemetry.heading', 'heading')
      .addSelect('telemetry.accuracy', 'accuracy')
      .addSelect('telemetry.hdop', 'hdop')
      .addSelect('telemetry.satellites', 'satellites')
      .addSelect('telemetry.charge', 'charge')
      .addSelect('telemetry.stop_id', 'stop_id')
      .addSelect('telemetry.recorded', 'telemetry_recorded')
      .from(EventEntity, 'event')
      .innerJoin(DeviceEntity, 'device', 'device.device_id = event.device_id')
      .innerJoin(
        TelemetryEntity,
        'telemetry',
        'telemetry.device_id = event.device_id AND telemetry.timestamp = event.telemetry_timestamp'
      )
})
export class EventWithDeviceAndTelemetryInfoEntity implements EventWithDeviceAndTelemetryInfoEntityModel {
  @ViewColumn()
  id: number

  @ViewColumn()
  recorded: Timestamp

  @ViewColumn()
  device_id: UUID

  @ViewColumn()
  provider_id: UUID

  @ViewColumn()
  timestamp: Timestamp

  @ViewColumn()
  event_types: VEHICLE_EVENT[]

  @ViewColumn()
  vehicle_state: VEHICLE_STATE

  @ViewColumn()
  trip_state: Nullable<TRIP_STATE>

  @ViewColumn()
  telemetry_timestamp: Timestamp

  @ViewColumn()
  trip_id: Nullable<UUID>

  @ViewColumn()
  vehicle_id: string

  @ViewColumn()
  vehicle_type: VEHICLE_TYPE

  @ViewColumn()
  propulsion_types: PROPULSION_TYPE[]

  @ViewColumn()
  year: Nullable<number>

  @ViewColumn()
  mfgr: Nullable<string>

  @ViewColumn()
  model: Nullable<string>

  @ViewColumn()
  accessibility_options: Nullable<ACCESSIBILITY_OPTION[]>

  @ViewColumn()
  modality: MODALITY

  @ViewColumn()
  device_recorded: Timestamp

  @ViewColumn()
  lat: number

  @ViewColumn()
  lng: number

  @ViewColumn()
  altitude: Nullable<number>

  @ViewColumn()
  speed: Nullable<number>

  @ViewColumn()
  heading: Nullable<number>

  @ViewColumn()
  accuracy: Nullable<number>

  @ViewColumn()
  hdop: Nullable<number>

  @ViewColumn()
  satellites: Nullable<number>

  @ViewColumn()
  charge: Nullable<number>

  @ViewColumn()
  stop_id: Nullable<UUID>

  @ViewColumn()
  telemetry_recorded: Timestamp
}

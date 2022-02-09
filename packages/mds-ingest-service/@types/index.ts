/**
 * Copyright 2020 City of Los Angeles
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

import { DomainModelCreate, IdentityColumn, RecordedColumn } from '@mds-core/mds-repository'
import { RpcEmptyRequestContext, RpcRoute, RpcServiceDefinition } from '@mds-core/mds-rpc-common'
import {
  ACCESSIBILITY_OPTION,
  Device,
  MODALITY,
  Nullable,
  PROPULSION_TYPE,
  Telemetry,
  TelemetryData,
  Timestamp,
  TRIP_STATE,
  UUID,
  VehicleEvent,
  VEHICLE_EVENT,
  VEHICLE_STATE,
  VEHICLE_TYPE
} from '@mds-core/mds-types'
import { MigratedEntityModel } from '../repository/mixins/migrated-entity'

type ResponseWithCursor<T extends {}> = T & {
  cursor: {
    prev: Nullable<string>
    next: Nullable<string>
  }
}

export interface GetDevicesOptions {
  limit?: number
}

export type GetDevicesResponse = ResponseWithCursor<{
  devices: DeviceDomainModel[]
}>

export interface DeviceDomainModel extends RecordedColumn {
  device_id: UUID
  provider_id: UUID
  vehicle_id: string
  vehicle_type: VEHICLE_TYPE
  propulsion_types: PROPULSION_TYPE[]

  year: Nullable<number>
  mfgr: Nullable<string>
  model: Nullable<string>
  accessibility_options: Nullable<ACCESSIBILITY_OPTION[]>
  modality: MODALITY
}

export type DeviceDomainCreateModel = DomainModelCreate<Omit<DeviceDomainModel, keyof RecordedColumn>>

export type GpsData = Omit<TelemetryData, 'charge'>

export interface TelemetryDomainModel extends RecordedColumn {
  device_id: UUID
  provider_id: UUID
  timestamp: Timestamp
  gps: GpsData
  charge: Nullable<number>
  stop_id: Nullable<UUID>
}

export type TelemetryDomainCreateModel = DomainModelCreate<Omit<TelemetryDomainModel, keyof RecordedColumn | 'gps'>> & {
  gps: DomainModelCreate<GpsData>
}

export const GROUPING_TYPES = ['latest_per_vehicle', 'latest_per_trip', 'all_events'] as const
export type GROUPING_TYPE = typeof GROUPING_TYPES[number]

export type TimeRange = {
  start: Timestamp
  end: Timestamp
}

export const GetVehicleEventsOrderColumn = <const>['timestamp', 'provider_id', 'vehicle_state']

export type GetVehicleEventsOrderColumn = typeof GetVehicleEventsOrderColumn[number]

export const GetVehicleEventsOrderDirection = <const>['ASC', 'DESC']

export type GetVehicleEventsOrderDirection = typeof GetVehicleEventsOrderDirection[number]

export type GetVehicleEventsOrderOption = {
  column: GetVehicleEventsOrderColumn
  direction?: GetVehicleEventsOrderDirection
}

export interface GetVehicleEventsFilterParams {
  vehicle_types?: VEHICLE_TYPE[]
  propulsion_types?: PROPULSION_TYPE[]
  provider_ids?: UUID[]
  vehicle_states?: VEHICLE_STATE[]
  time_range?: TimeRange
  grouping_type: GROUPING_TYPE
  vehicle_id?: string
  device_ids?: UUID[]
  event_types?: VEHICLE_EVENT[]
  geography_ids?: UUID[]
  limit?: number
  order?: GetVehicleEventsOrderOption
}

export type GetVehicleEventsResponse = ResponseWithCursor<{
  events: EventDomainModel[]
}>

export interface ReadTripEventsQueryParams {
  skip?: UUID
  take?: number
  start_time?: number | string
  end_time?: number | string
  provider_id?: UUID
}

export interface ReadDeviceEventsQueryParams {
  skip?: UUID
  take?: number
  start_time?: number | string
  end_time?: number | string
  provider_id?: UUID
}

export interface EventDomainModel extends RecordedColumn {
  device_id: UUID
  provider_id: UUID
  timestamp: Timestamp
  event_types: VEHICLE_EVENT[]
  vehicle_state: VEHICLE_STATE
  trip_state: Nullable<TRIP_STATE>

  telemetry_timestamp: Timestamp
  telemetry: TelemetryDomainModel
  annotation: Nullable<EventAnnotationDomainModel>
  trip_id: Nullable<UUID>
}

export type EventDomainCreateModel = DomainModelCreate<
  Omit<EventDomainModel, keyof RecordedColumn | 'telemetry' | 'telemetry_timestamp'>
> & {
  telemetry: TelemetryDomainCreateModel
}

export type MigratedEventDomainModel = Omit<EventDomainModel & IdentityColumn, 'telemetry' | 'annotation'>

/**
 * Labels which can be used to annotate events.
 */
export interface DeviceLabel {
  vehicle_id: string
  vehicle_type: VEHICLE_TYPE
  propulsion_types: PROPULSION_TYPE[]
}

export interface GeographyLabel {
  geography_type: Nullable<string>
  geography_id: UUID
}

export interface GeographiesLabel {
  geographies: Array<GeographyLabel>
}

interface FlatGeographiesLabel {
  geography_ids: UUID[]
  geography_types: (string | null)[]
}

export interface LatencyLabel {
  latency_ms: Timestamp
}

export interface TelemetryLabel {
  telemetry_timestamp: Timestamp
  telemetry_gps_lat: number
  telemetry_gps_lng: number
  telemetry_gps_altitude: Nullable<number>
  telemetry_gps_heading: Nullable<number>
  telemetry_gps_speed: Nullable<number>
  telemetry_gps_accuracy: Nullable<number>
  telemetry_charge: Nullable<number>
}

/**
 * An object to persist the above (non-telemetry) event labels,
 * joinable to EventDomainModels by device_id + timestamp. Can
 * also join by events_row_id.
 */
export interface EventAnnotationDomainModel extends DeviceLabel, FlatGeographiesLabel, LatencyLabel, RecordedColumn {
  device_id: UUID
  timestamp: Timestamp
}

export type EventAnnotationDomainCreateModel = DomainModelCreate<
  Omit<EventAnnotationDomainModel, keyof RecordedColumn>
> & { events_row_id: number }

export type GetEventsWithDeviceAndTelemetryInfoOptions = Partial<{
  limit: number
  follow: boolean
  time_range: Partial<TimeRange>
  provider_ids: UUID[]
  device_ids: UUID[]
}>

export type EventWithDeviceAndTelemetryInfoDomainModel = Omit<EventDomainModel, 'annotation'> & {
  device: DeviceDomainModel
  telemetry: TelemetryDomainModel
}

export type GetEventsWithDeviceAndTelemetryInfoResponse = ResponseWithCursor<{
  events: EventWithDeviceAndTelemetryInfoDomainModel[]
}>

export interface IngestService {
  getDevicesUsingOptions: (options: GetDevicesOptions) => GetDevicesResponse
  getDevicesUsingCursor: (cursor: string) => GetDevicesResponse
  getEventsUsingOptions: (params: GetVehicleEventsFilterParams) => GetVehicleEventsResponse
  getEventsUsingCursor: (cursor: string) => GetVehicleEventsResponse
  getDevices: (device_ids: UUID[]) => DeviceDomainModel[]
  getLatestTelemetryForDevices: (device_ids: UUID[]) => TelemetryDomainModel[]
  writeEvents: (event: EventDomainCreateModel[]) => EventDomainModel[]
  writeEventAnnotations: (params: EventAnnotationDomainCreateModel[]) => EventAnnotationDomainModel[]
  /**
   * Gets all trip-related events grouped by trip_id, with an optional time_range.
   * When a time_range is supplied, all trip_ids within that time_range will be considered,
   * however some events for that trip_id may be outside of the time_range, and **will still be returned**.
   */
  getTripEvents: (params: ReadTripEventsQueryParams) => Record<UUID, EventDomainModel[]>
  getEventsWithDeviceAndTelemetryInfoUsingOptions: (
    options?: GetEventsWithDeviceAndTelemetryInfoOptions
  ) => GetEventsWithDeviceAndTelemetryInfoResponse
  getEventsWithDeviceAndTelemetryInfoUsingCursor: (cursor: string) => GetEventsWithDeviceAndTelemetryInfoResponse
  /**
   * Gets all events grouped by device_id, with an optional time_range.
   * When a time_range is supplied, only the events within that time range will be returned.
   */
  getDeviceEvents: (params: ReadDeviceEventsQueryParams) => Record<UUID, EventDomainModel[]>
}

export interface IngestMigrationService {
  writeMigratedDevice: (device: Device, migrated_from: MigratedEntityModel) => Nullable<DeviceDomainModel>
  writeMigratedVehicleEvent: (
    event: VehicleEvent,
    migrated_from: MigratedEntityModel
  ) => Nullable<MigratedEventDomainModel>
  writeMigratedTelemetry: (
    telemetry: Telemetry & Required<RecordedColumn>,
    migrated_from: MigratedEntityModel
  ) => Nullable<TelemetryDomainModel>
}

export const IngestServiceDefinition: RpcServiceDefinition<IngestService & IngestMigrationService> = {
  getDevices: RpcRoute<IngestService['getDevices']>(),
  getDevicesUsingOptions: RpcRoute<IngestService['getDevicesUsingOptions']>(),
  getDevicesUsingCursor: RpcRoute<IngestService['getDevicesUsingCursor']>(),
  getEventsUsingOptions: RpcRoute<IngestService['getEventsUsingOptions']>(),
  getEventsUsingCursor: RpcRoute<IngestService['getEventsUsingCursor']>(),
  getLatestTelemetryForDevices: RpcRoute<IngestService['getLatestTelemetryForDevices']>(),
  writeEvents: RpcRoute<IngestService['writeEvents']>(),
  writeEventAnnotations: RpcRoute<IngestService['writeEventAnnotations']>(),
  writeMigratedDevice: RpcRoute<IngestMigrationService['writeMigratedDevice']>(),
  writeMigratedVehicleEvent: RpcRoute<IngestMigrationService['writeMigratedVehicleEvent']>(),
  writeMigratedTelemetry: RpcRoute<IngestMigrationService['writeMigratedTelemetry']>(),
  getTripEvents: RpcRoute<IngestService['getTripEvents']>(),
  getEventsWithDeviceAndTelemetryInfoUsingOptions:
    RpcRoute<IngestService['getEventsWithDeviceAndTelemetryInfoUsingOptions']>(),
  getEventsWithDeviceAndTelemetryInfoUsingCursor:
    RpcRoute<IngestService['getEventsWithDeviceAndTelemetryInfoUsingCursor']>(),
  getDeviceEvents: RpcRoute<IngestService['getDeviceEvents']>()
}

export type IngestServiceRequestContext = RpcEmptyRequestContext

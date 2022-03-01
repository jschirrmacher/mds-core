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

import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateEventsWithDeviceAndTelemetryInfoView1633182766754 implements MigrationInterface {
  name = 'CreateEventsWithDeviceAndTelemetryInfoView1633182766754'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "events_with_device_and_telemetry_info_view" AS SELECT "event"."recorded" AS "recorded", "event"."id" AS "id", "event"."device_id" AS "device_id", "event"."provider_id" AS "provider_id", "event"."timestamp" AS "timestamp", "event"."event_types" AS "event_types", "event"."vehicle_state" AS "vehicle_state", "event"."trip_state" AS "trip_state", "event"."telemetry_timestamp" AS "telemetry_timestamp", "event"."trip_id" AS "trip_id", "device"."vehicle_id" AS "vehicle_id", "device"."vehicle_type" AS "vehicle_type", "device"."propulsion_types" AS "propulsion_types", "device"."year" AS "year", "device"."mfgr" AS "mfgr", "device"."model" AS "model", "device"."accessibility_options" AS "accessibility_options", "device"."modality" AS "modality", "device"."recorded" as "device_recorded", "telemetry"."lat" AS "lat", "telemetry"."lng" AS "lng", "telemetry"."altitude" AS "altitude", "telemetry"."speed" AS "speed", "telemetry"."heading" AS "heading", "telemetry"."accuracy" AS "accuracy", "telemetry"."hdop" AS "hdop", "telemetry"."satellites" AS "satellites", "telemetry"."charge" AS "charge", "telemetry"."stop_id" AS "stop_id", "telemetry"."recorded" as "telemetry_recorded" FROM "events" "event" LEFT JOIN "devices" "device" ON "device"."device_id" = "event"."device_id"  LEFT JOIN "telemetry" "telemetry" ON "telemetry"."device_id" = "event"."device_id" AND "telemetry"."timestamp" = "event"."telemetry_timestamp"`
    )
    await queryRunner.query(
      `INSERT INTO "ingest-migration-metadata" ("type", "schema", "name", "value") VALUES ($1, $2, $3, $4)`,
      [
        'VIEW',
        'public',
        'events_with_device_and_telemetry_info_view',
        'SELECT "event"."recorded" AS "recorded", "event"."id" AS "id", "event"."device_id" AS "device_id", "event"."provider_id" AS "provider_id", "event"."timestamp" AS "timestamp", "event"."event_types" AS "event_types", "event"."vehicle_state" AS "vehicle_state", "event"."trip_state" AS "trip_state", "event"."telemetry_timestamp" AS "telemetry_timestamp", "event"."trip_id" AS "trip_id", "device"."vehicle_id" AS "vehicle_id", "device"."vehicle_type" AS "vehicle_type", "device"."propulsion_types" AS "propulsion_types", "device"."year" AS "year", "device"."mfgr" AS "mfgr", "device"."model" AS "model", "device"."accessibility_options" AS "accessibility_options", "device"."modality" AS "modality", "telemetry"."lat" AS "lat", "telemetry"."lng" AS "lng", "telemetry"."altitude" AS "altitude", "telemetry"."speed" AS "speed", "telemetry"."heading" AS "heading", "telemetry"."accuracy" AS "accuracy", "telemetry"."hdop" AS "hdop", "telemetry"."satellites" AS "satellites", "telemetry"."charge" AS "charge", "telemetry"."stop_id" AS "stop_id" FROM "events" "event" LEFT JOIN "devices" "device" ON "device"."device_id" = "event"."device_id"  LEFT JOIN "telemetry" "telemetry" ON "telemetry"."device_id" = "event"."device_id" AND "telemetry"."timestamp" = "event"."telemetry_timestamp"'
      ]
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "ingest-migration-metadata" WHERE "type" = $1 AND "schema" = $2 AND "name" = $3`,
      ['VIEW', 'public', 'events_with_device_and_telemetry_info_view']
    )
    await queryRunner.query(`DROP VIEW "events_with_device_and_telemetry_info_view"`)
  }
}

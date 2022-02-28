import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeEventsWithDeviceAndTelemetryInfoToUseInnerJoin1634672590753 implements MigrationInterface {
  name = 'ChangeEventsWithDeviceAndTelemetryInfoToUseInnerJoin1634672590753'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "ingest-migration-metadata" WHERE "type" = $1 AND "schema" = $2 AND "name" = $3`,
      ['VIEW', 'public', 'events_with_device_and_telemetry_info_view']
    )
    await queryRunner.query(`DROP VIEW "events_with_device_and_telemetry_info_view"`)
    await queryRunner.query(
      `CREATE VIEW "events_with_device_and_telemetry_info_view" AS SELECT "event"."recorded" AS "recorded", "event"."id" AS "id", "event"."device_id" AS "device_id", "event"."provider_id" AS "provider_id", "event"."timestamp" AS "timestamp", "event"."event_types" AS "event_types", "event"."vehicle_state" AS "vehicle_state", "event"."trip_state" AS "trip_state", "event"."telemetry_timestamp" AS "telemetry_timestamp", "event"."trip_id" AS "trip_id", "device"."recorded" AS "device_recorded", "device"."vehicle_id" AS "vehicle_id", "device"."vehicle_type" AS "vehicle_type", "device"."propulsion_types" AS "propulsion_types", "device"."year" AS "year", "device"."mfgr" AS "mfgr", "device"."model" AS "model", "device"."accessibility_options" AS "accessibility_options", "device"."modality" AS "modality", "telemetry"."recorded" AS "telemetry_recorded", "telemetry"."lat" AS "lat", "telemetry"."lng" AS "lng", "telemetry"."altitude" AS "altitude", "telemetry"."speed" AS "speed", "telemetry"."heading" AS "heading", "telemetry"."accuracy" AS "accuracy", "telemetry"."hdop" AS "hdop", "telemetry"."satellites" AS "satellites", "telemetry"."charge" AS "charge", "telemetry"."stop_id" AS "stop_id" FROM "events" "event" INNER JOIN "devices" "device" ON "device"."device_id" = "event"."device_id"  INNER JOIN "telemetry" "telemetry" ON "telemetry"."device_id" = "event"."device_id" AND "telemetry"."timestamp" = "event"."telemetry_timestamp"`
    )
    await queryRunner.query(
      `INSERT INTO "ingest-migration-metadata" ("type", "schema", "name", "value") VALUES ($1, $2, $3, $4)`,
      [
        'VIEW',
        'public',
        'events_with_device_and_telemetry_info_view',
        'SELECT "event"."recorded" AS "recorded", "event"."id" AS "id", "event"."device_id" AS "device_id", "event"."provider_id" AS "provider_id", "event"."timestamp" AS "timestamp", "event"."event_types" AS "event_types", "event"."vehicle_state" AS "vehicle_state", "event"."trip_state" AS "trip_state", "event"."telemetry_timestamp" AS "telemetry_timestamp", "event"."trip_id" AS "trip_id", "device"."recorded" AS "device_recorded", "device"."vehicle_id" AS "vehicle_id", "device"."vehicle_type" AS "vehicle_type", "device"."propulsion_types" AS "propulsion_types", "device"."year" AS "year", "device"."mfgr" AS "mfgr", "device"."model" AS "model", "device"."accessibility_options" AS "accessibility_options", "device"."modality" AS "modality", "telemetry"."recorded" AS "telemetry_recorded", "telemetry"."lat" AS "lat", "telemetry"."lng" AS "lng", "telemetry"."altitude" AS "altitude", "telemetry"."speed" AS "speed", "telemetry"."heading" AS "heading", "telemetry"."accuracy" AS "accuracy", "telemetry"."hdop" AS "hdop", "telemetry"."satellites" AS "satellites", "telemetry"."charge" AS "charge", "telemetry"."stop_id" AS "stop_id" FROM "events" "event" INNER JOIN "devices" "device" ON "device"."device_id" = "event"."device_id"  INNER JOIN "telemetry" "telemetry" ON "telemetry"."device_id" = "event"."device_id" AND "telemetry"."timestamp" = "event"."telemetry_timestamp"'
      ]
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "ingest-migration-metadata" WHERE "type" = $1 AND "schema" = $2 AND "name" = $3`,
      ['VIEW', 'public', 'events_with_device_and_telemetry_info_view']
    )
    await queryRunner.query(`DROP VIEW "events_with_device_and_telemetry_info_view"`)
    await queryRunner.query(
      `CREATE VIEW "events_with_device_and_telemetry_info_view" AS SELECT "event"."recorded" AS "recorded", "event"."id" AS "id", "event"."device_id" AS "device_id", "event"."provider_id" AS "provider_id", "event"."timestamp" AS "timestamp", "event"."event_types" AS "event_types", "event"."vehicle_state" AS "vehicle_state", "event"."trip_state" AS "trip_state", "event"."telemetry_timestamp" AS "telemetry_timestamp", "event"."trip_id" AS "trip_id", "device"."vehicle_id" AS "vehicle_id", "device"."vehicle_type" AS "vehicle_type", "device"."propulsion_types" AS "propulsion_types", "device"."year" AS "year", "device"."mfgr" AS "mfgr", "device"."model" AS "model", "device"."accessibility_options" AS "accessibility_options", "device"."modality" AS "modality", "telemetry"."lat" AS "lat", "telemetry"."lng" AS "lng", "telemetry"."altitude" AS "altitude", "telemetry"."speed" AS "speed", "telemetry"."heading" AS "heading", "telemetry"."accuracy" AS "accuracy", "telemetry"."hdop" AS "hdop", "telemetry"."satellites" AS "satellites", "telemetry"."charge" AS "charge", "telemetry"."stop_id" AS "stop_id" FROM "events" "event" LEFT JOIN "devices" "device" ON "device"."device_id" = "event"."device_id"  LEFT JOIN "telemetry" "telemetry" ON "telemetry"."device_id" = "event"."device_id" AND "telemetry"."timestamp" = "event"."telemetry_timestamp"`
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
}

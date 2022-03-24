import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTelemetryAnnotationEntity1646881807158 implements MigrationInterface {
  name = 'AddTelemetryAnnotationEntity1646881807158'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "telemetry_annotations" ("recorded" bigint NOT NULL DEFAULT mds_epoch_ms(), "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "device_id" uuid NOT NULL, "provider_id" uuid NOT NULL, "timestamp" bigint NOT NULL, "h3_08" character varying(15) NOT NULL, "h3_09" character varying(15) NOT NULL, "h3_10" character varying(15) NOT NULL, "h3_11" character varying(15) NOT NULL, "h3_12" character varying(15) NOT NULL, "h3_13" character varying(15) NOT NULL, "telemetry_row_id" bigint NOT NULL, "geography_ids"  character varying(36) array NOT NULL, CONSTRAINT "telemetry_annotation_pkey" PRIMARY KEY ("device_id", "timestamp"))`
    )
    await queryRunner.query(`CREATE INDEX "idx_recorded_telemetry_annotation" ON "telemetry_annotations" ("recorded") `)
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_id_telemetry_annotation" ON "telemetry_annotations" ("id") `)
    await queryRunner.query(
      `CREATE INDEX "idx_provider_id_telemetry_annotation" ON "telemetry_annotations" ("provider_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "idx_timestamp_telemetry_annotation" ON "telemetry_annotations" ("timestamp") `
    )
    await queryRunner.query(`CREATE INDEX "idx_h3_08_telemetry_annotation" ON "telemetry_annotations" ("h3_08") `)
    await queryRunner.query(`CREATE INDEX "idx_h3_09_telemetry_annotation" ON "telemetry_annotations" ("h3_09") `)
    await queryRunner.query(`CREATE INDEX "idx_h3_10_telemetry_annotation" ON "telemetry_annotations" ("h3_10") `)
    await queryRunner.query(`CREATE INDEX "idx_h3_11_telemetry_annotation" ON "telemetry_annotations" ("h3_11") `)
    await queryRunner.query(`CREATE INDEX "idx_h3_12_telemetry_annotation" ON "telemetry_annotations" ("h3_12") `)
    await queryRunner.query(`CREATE INDEX "idx_h3_13_telemetry_annotation" ON "telemetry_annotations" ("h3_13") `)
    await queryRunner.query(
      `CREATE INDEX "idx_telemetry_row_id_telemetry_annotation" ON "telemetry_annotations" ("telemetry_row_id") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_h3_13_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_h3_12_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_h3_11_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_h3_10_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_h3_09_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_h3_08_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_timestamp_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_provider_id_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_id_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_recorded_telemetry_annotation"`)
    await queryRunner.query(`DROP INDEX "public"."idx_telemetry_row_id_telemetry_annotation"`)
    await queryRunner.query(`DROP TABLE "telemetry_annotations"`)
  }
}

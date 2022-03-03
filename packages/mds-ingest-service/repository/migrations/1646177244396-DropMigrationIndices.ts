import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropMigrationIndices1646177244396 implements MigrationInterface {
  name = 'DropMigrationIndices1646177244396'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_version_devices"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_id_devices"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_source_devices"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_version_events"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_id_events"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_source_events"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_version_telemetry"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_id_telemetry"`)
    await queryRunner.query(`DROP INDEX "public"."idx_migrated_from_source_telemetry"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_migrated_from_source_telemetry" ON "telemetry" ("migrated_from_source") `
    )
    await queryRunner.query(`CREATE INDEX "idx_migrated_from_id_telemetry" ON "telemetry" ("migrated_from_id") `)
    await queryRunner.query(
      `CREATE INDEX "idx_migrated_from_version_telemetry" ON "telemetry" ("migrated_from_version") `
    )
    await queryRunner.query(`CREATE INDEX "idx_migrated_from_source_events" ON "events" ("migrated_from_source") `)
    await queryRunner.query(`CREATE INDEX "idx_migrated_from_id_events" ON "events" ("migrated_from_id") `)
    await queryRunner.query(`CREATE INDEX "idx_migrated_from_version_events" ON "events" ("migrated_from_version") `)
    await queryRunner.query(`CREATE INDEX "idx_migrated_from_source_devices" ON "devices" ("migrated_from_source") `)
    await queryRunner.query(`CREATE INDEX "idx_migrated_from_id_devices" ON "devices" ("migrated_from_id") `)
    await queryRunner.query(`CREATE INDEX "idx_migrated_from_version_devices" ON "devices" ("migrated_from_version") `)
  }
}

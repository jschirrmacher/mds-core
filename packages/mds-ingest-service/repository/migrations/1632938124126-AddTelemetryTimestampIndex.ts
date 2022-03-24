import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTelemetryTimestampIndex1632938124126 implements MigrationInterface {
  name = 'AddTelemetryTimestampIndex1632938124126'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_timestamp_telemetry" ON "telemetry" ("timestamp") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_timestamp_telemetry"`)
  }
}

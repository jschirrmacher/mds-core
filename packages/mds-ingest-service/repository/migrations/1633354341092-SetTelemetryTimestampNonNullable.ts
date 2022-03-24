import type { MigrationInterface, QueryRunner } from 'typeorm'

export class SetTelemetryTimestampNonNullable1633354341092 implements MigrationInterface {
  name = 'SetTelemetryTimestampNonNullable1633354341092'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "telemetry_timestamp" SET NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "telemetry_timestamp" DROP NOT NULL`)
  }
}

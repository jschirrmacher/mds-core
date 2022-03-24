import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateComplianceSnapshotFailuresTable1634323054883 implements MigrationInterface {
  name = 'CreateComplianceSnapshotFailuresTable1634323054883'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "compliance_snapshot_failures" ("recorded" bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint, "id" BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL, "compliance_snapshot_id" uuid NOT NULL, "timestamp" bigint NOT NULL, CONSTRAINT "compliance_snapshot_failures_pkey" PRIMARY KEY ("compliance_snapshot_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "idx_recorded_compliance_snapshot_failures" ON "compliance_snapshot_failures" ("recorded") `
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_id_compliance_snapshot_failures" ON "compliance_snapshot_failures" ("id") `
    )
    // The following was missing from a previous migration
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_id_compliance_snapshots" ON "compliance_snapshots" ("id") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_id_compliance_snapshot_failures"`)
    await queryRunner.query(`DROP INDEX "idx_recorded_compliance_snapshot_failures"`)
    await queryRunner.query(`DROP TABLE "compliance_snapshot_failures"`)
    // The following was missing from a previous migration
    await queryRunner.query(`DROP INDEX "idx_id_compliance_snapshots"`)
  }
}

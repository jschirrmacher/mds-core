import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddComplianceViolations1632935069192 implements MigrationInterface {
  name = 'AddComplianceViolations1632935069192'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "compliance_violations" ("recorded" bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint, "id" BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL, "violation_id" uuid NOT NULL, "timestamp" bigint NOT NULL, "policy_id" uuid NOT NULL, "provider_id" uuid NOT NULL, "rule_id" uuid NOT NULL, "event_timestamp" bigint NOT NULL, "device_id" uuid NOT NULL, "trip_id" uuid, CONSTRAINT "compliance_violations_pkey" PRIMARY KEY ("violation_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "idx_recorded_compliance_violations" ON "compliance_violations" ("recorded") `
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_id_compliance_violations" ON "compliance_violations" ("id") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_id_compliance_violations"`)
    await queryRunner.query(`DROP INDEX "idx_recorded_compliance_violations"`)
    await queryRunner.query(`DROP TABLE "compliance_violations"`)
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddColumnsToPoliciesTable1634142716521 implements MigrationInterface {
  name = 'AddColumnsToPoliciesTable1634142716521'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "start_date" bigint`)
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "end_date" bigint`)
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "publish_date" bigint`)
    await queryRunner.query(`UPDATE "policies" SET
        "start_date" = CAST("policy_json"::json->>'start_date' AS bigint),
        "end_date" = CAST("policy_json"::json->>'end_date' AS bigint),
        "publish_date" = CAST("policy_json"::json->>'publish_date' AS bigint)
        `)
    await queryRunner.query(
      `UPDATE "policies" SET policy_json = policy_json::jsonb - 'start_date' - 'end_date' - 'publish_date'`
    )
    await queryRunner.query(`ALTER TABLE "policies" ALTER COLUMN "start_date" SET NOT NULL`)
    await queryRunner.query(`CREATE INDEX "idx_start_date_policies" ON "policies" ("start_date")`)
    await queryRunner.query(`CREATE INDEX "idx_end_date_policies" ON "policies" ("end_date")`)
    await queryRunner.query(`CREATE INDEX "idx_publish_date_policies" ON "policies" ("publish_date")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE POLICIES SET policy_json = policy_json::jsonb ||
      CONCAT('{"start_date":', COALESCE(TO_CHAR(start_date, '9999999999999'), 'null'), '}')::jsonb ||
      CONCAT('{"end_date":', COALESCE(TO_CHAR(end_date, '9999999999999'), 'null'), '}')::jsonb ||
      CONCAT('{"publish_date":', COALESCE(TO_CHAR(publish_date, '9999999999999'), 'null'), '}')::jsonb`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_start_date_policies"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_end_date_policies"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_publish_date_policies"`)
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "start_date"`)
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "end_date"`)
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "publish_date"`)
  }
}

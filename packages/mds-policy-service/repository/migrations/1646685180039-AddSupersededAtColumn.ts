import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupersededAtColumn1646685180039 implements MigrationInterface {
  name = 'AddSupersededAtColumn1646685180039'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "policies" ADD "superseded_at" BIGINT array`)

    await queryRunner.query(`update policies set superseded_at = subquery.superseded_at
    FROM (
    SELECT
      p.policy_id,
      ARRAY_AGG(pc.start_date) as superseded_at
    FROM
      policies p
      LEFT JOIN policies pc ON pc.policy_id = ANY (p.superseded_by)
      WHERE p.superseded_by IS NOT NULL
    GROUP BY 
      p.policy_id
    ) as subquery
    WHERE subquery.policy_id = policies.policy_id`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN "superseded_at"`)
  }
}

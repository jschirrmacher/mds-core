import type { MigrationInterface, QueryRunner } from 'typeorm'

export class DropRedundantIdentityColumnIndex1644684612646 implements MigrationInterface {
  name = 'DropRedundantIdentityColumnIndex1644684612646'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_id_collector_messages"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_id_collector_messages" ON "collector-messages" ("id") `)
  }
}

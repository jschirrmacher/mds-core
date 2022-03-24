import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeRecordedColumnDefaultExpression1644682437591 implements MigrationInterface {
  name = 'ChangeRecordedColumnDefaultExpression1644682437591'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attachments" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attachments" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
  }
}

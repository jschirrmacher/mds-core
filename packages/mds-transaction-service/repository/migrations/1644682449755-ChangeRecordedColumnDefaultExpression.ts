import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeRecordedColumnDefaultExpression1644682449755 implements MigrationInterface {
  name = 'ChangeRecordedColumnDefaultExpression1644682449755'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_operations" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
    await queryRunner.query(`ALTER TABLE "transaction_statuses" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
    await queryRunner.query(
      `ALTER TABLE "transaction_statuses" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
    await queryRunner.query(
      `ALTER TABLE "transaction_operations" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeRecordedColumnDefaultExpression1644682457317 implements MigrationInterface {
  name = 'ChangeRecordedColumnDefaultExpression1644682457317'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "compliance_snapshots" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
    await queryRunner.query(
      `ALTER TABLE "compliance_snapshot_failures" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`
    )
    await queryRunner.query(`ALTER TABLE "compliance_violations" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "compliance_violations" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
    await queryRunner.query(
      `ALTER TABLE "compliance_snapshot_failures" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
    await queryRunner.query(
      `ALTER TABLE "compliance_snapshots" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
  }
}

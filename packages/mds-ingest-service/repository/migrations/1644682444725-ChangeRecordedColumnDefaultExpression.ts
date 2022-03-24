import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeRecordedColumnDefaultExpression1644682444725 implements MigrationInterface {
  name = 'ChangeRecordedColumnDefaultExpression1644682444725'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
    await queryRunner.query(`ALTER TABLE "event_annotations" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
    await queryRunner.query(`ALTER TABLE "telemetry" ALTER COLUMN "recorded" SET DEFAULT mds_epoch_ms()`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "telemetry" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
    await queryRunner.query(
      `ALTER TABLE "event_annotations" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
    await queryRunner.query(
      `ALTER TABLE "devices" ALTER COLUMN "recorded" SET DEFAULT ((date_part('epoch', now()) * (1000)))`
    )
  }
}

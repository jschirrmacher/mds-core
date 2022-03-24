import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddViolatingVehiclesColumn1638812382755 implements MigrationInterface {
  name = 'AddViolatingVehiclesColumn1638812382755'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "compliance_snapshots" ADD "violating_vehicles" jsonb NOT NULL DEFAULT '[]'`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "compliance_snapshots" DROP COLUMN "violating_vehicles"`)
  }
}

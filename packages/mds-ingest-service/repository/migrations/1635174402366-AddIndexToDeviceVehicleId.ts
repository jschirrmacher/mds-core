import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexToDeviceVehicleId1635174402366 implements MigrationInterface {
  name = 'AddIndexToDeviceVehicleId1635174402366'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_lower_vehicle_id" ON "devices" (lower(vehicle_id))`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_lower_vehicle_id"`)
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CopyIngestMigrationMetadata1645465504597 implements MigrationInterface {
  name = 'CopyIngestMigrationMetadata1645465504597'

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('typeorm_metadata')) {
      await queryRunner.query(`INSERT INTO "ingest-migration-metadata" SELECT * FROM "typeorm_metadata"`)
      await queryRunner.query(`DROP TABLE "typeorm_metadata"`)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Do Nothing
  }
}

/**
 * Copyright 2019 City of Los Angeles
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { MigrationInterface, QueryRunner } from 'typeorm'
import { MdsNamingStrategy } from './naming-strategies'

const strategy = new MdsNamingStrategy()

export const RepositoryMigrations = (migrationTableName: string): (Function | string)[] => {
  const migrationIndexName = strategy.indexName(migrationTableName, ['name'])

  return [
    class CreateRepository0000000000001 implements MigrationInterface {
      name = 'CreateRepository0000000000001'

      public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "${migrationIndexName}" ON "${migrationTableName}" ("name") `)
      }

      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "${migrationIndexName}"`)
      }
    },

    class CreateMdsTimestampFunction1644677707319 implements MigrationInterface {
      name = 'CreateMdsTimestampFunction1644677707319'

      public async up(queryRunner: QueryRunner): Promise<void> {
        // Since the function exists at the schema level use pg_advisory_xact_lock to prevent
        // "tuple concurrently updated" failures in the event that multiple repositories attempt
        // to create the function concurrently. The advisory lock key is a "random" signed
        // 64-bit BIGINT value (which can't be represented in JavaScript). The lock is released
        // automatically at the end of the transaction block.

        const AdvisoryLockKey = '4575138969721245264'

        await queryRunner.query(`
          BEGIN TRANSACTION;
            SELECT pg_advisory_xact_lock(${AdvisoryLockKey});
            CREATE OR REPLACE FUNCTION mds_epoch_ms() RETURNS BIGINT LANGUAGE SQL AS 'SELECT (EXTRACT(epoch FROM now()) * 1000)::BIGINT';
          COMMIT TRANSACTION;`)
      }

      public async down(queryRunner: QueryRunner): Promise<void> {
        // Since the function exists at the schema level it must not be
        // dropped because it may still be in use by other repositories
      }
    }
  ]
}

/**
 * Copyright 2021 City of Los Angeles
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

import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * This migration was created to workaround a TypeORM bug where the "typeorm_metadata" table is created by
 * the "typeorm migration:generate" command and not added to the migration. Without this, migrations that
 * create a Postgres VIEW only work on the machine that the migration was generated on. Ideally, TypeORM
 * would get the view definition using "pg_get_viewdef" or some other mechanism rather than relying on this
 * metadata table. This is a really bad design to require a shared table for tracking CREATE VIEW DDL statements.
 *
 * See: https://github.com/typeorm/typeorm/issues/4923
 *
 * Update: 2/19/2022 - The above referenced issue has been resolved.
 *
 * See: https://github.com/typeorm/typeorm/pull/4956
 *
 * TypeORM still requires the "typeorm_metadata" table, but as of 0.2.41 it generates the table when migrations are
 * run rather than when they are generated. This migration is no longer necessary and is being disabled for any future
 * repository deployments. This operation probably should have lived in mds-repository to begin with along with other
 * database level migrations rather than here in mds-ingest-service.
 */
export class CreateTypeormMetadataTable1633181195937 implements MigrationInterface {
  name = 'CreateTypeormMetadataTable1633181195937'

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* Disabled 2/19/2022 */
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /* Disabled 2/19/2022 */
  }
}

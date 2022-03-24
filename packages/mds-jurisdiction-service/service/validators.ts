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

import { SchemaValidator } from '@mds-core/mds-schema-validators'
import type { CreateJurisdictionDomainModel } from '../@types'

const uuidSchema = <const>{ type: 'string', format: 'uuid' }
const stringSchema = <const>{ type: 'string', transform: ['trim'], minLength: 1 }
const timestampSchema = <const>{ type: 'integer', minimum: 100_000_000_000, maximum: 99_999_999_999_999 }

export const { validate: ValidateJurisdictionForCreate } = SchemaValidator<CreateJurisdictionDomainModel>({
  $id: 'Jurisdiction',
  type: 'object',
  properties: {
    jurisdiction_id: { ...uuidSchema, nullable: true, default: null },
    agency_key: stringSchema,
    agency_name: stringSchema,
    geography_id: uuidSchema,
    timestamp: { ...timestampSchema, nullable: true, default: null }
  },
  required: ['agency_key', 'agency_name', 'geography_id']
})

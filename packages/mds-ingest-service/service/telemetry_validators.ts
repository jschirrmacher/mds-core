/**
 * Copyright 2020 City of Los Angeles
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

import type { Schema } from '@mds-core/mds-schema-validators'
import { SchemaValidator } from '@mds-core/mds-schema-validators'
import type {
  TelemetryAnnotationDomainCreateModel,
  TelemetryAnnotationDomainModel,
  TelemetryDomainCreateModel,
  TelemetryDomainModel
} from '../@types'
import { nullableFloat, nullableInteger, timestampSchema, uuidSchema } from './util_schemas'

export const telemetryDomainCreateModelSchema: Schema<TelemetryDomainCreateModel> = <const>{
  $id: 'Telemetry',
  type: 'object',
  properties: {
    device_id: uuidSchema,
    provider_id: uuidSchema,
    timestamp: timestampSchema,
    gps: {
      type: 'object',
      properties: {
        lat: { type: 'number', format: 'float' },
        lng: { type: 'number', format: 'float' },
        // ⬇⬇⬇ NULLABLE/OPTIONAL PROPERTIES ⬇⬇⬇
        altitude: nullableFloat,
        heading: { ...nullableFloat, minimum: 0, exclusiveMaximum: 360 },
        speed: nullableFloat,
        accuracy: nullableFloat,
        hdop: nullableFloat,
        satellites: nullableInteger
      },
      required: ['lat', 'lng']
    },
    // ⬇⬇⬇ NULLABLE/OPTIONAL PROPERTIES ⬇⬇⬇
    charge: { ...nullableFloat, minimum: 0, maximum: 1.0 },
    stop_id: { ...uuidSchema, nullable: true, default: null }
  },
  required: ['device_id', 'provider_id', 'timestamp', 'gps']
}

export const telemetryAnnotationDomainCreateModelSchema: Schema<TelemetryAnnotationDomainCreateModel> = <const>{
  $id: 'TelemetryAnnotation',
  type: 'object',
  properties: {
    device_id: uuidSchema,
    provider_id: uuidSchema,
    timestamp: timestampSchema,
    h3_08: { type: 'string' },
    h3_09: { type: 'string' },
    h3_10: { type: 'string' },
    h3_11: { type: 'string' },
    h3_12: { type: 'string' },
    h3_13: { type: 'string' },
    telemetry_row_id: { type: 'integer' },
    geography_ids: { type: 'array', items: uuidSchema }
  },
  required: [
    'device_id',
    'provider_id',
    'timestamp',
    'h3_08',
    'h3_09',
    'h3_10',
    'h3_11',
    'h3_12',
    'h3_13',
    'telemetry_row_id',
    'geography_ids'
  ]
}

export const telemetryAnnotationDomainModelSchema = (): Schema<TelemetryAnnotationDomainModel> => {
  return telemetryAnnotationDomainCreateModelSchema as Schema<TelemetryAnnotationDomainModel>
}

export const telemetryDomainModelSchema = (): Schema<TelemetryDomainModel> => {
  const { required, $id, type, properties } = telemetryDomainCreateModelSchema
  const domainSchema = {
    $id,
    type,
    properties: { ...properties, recorded: timestampSchema },
    required: [...required, 'recorded']
  }
  return domainSchema as Schema<TelemetryDomainModel>
}

export const { validate: validateTelemetryDomainModel, $schema: TelemetrySchema } =
  SchemaValidator<TelemetryDomainModel>(telemetryDomainModelSchema(), { useDefaults: true })

export const { validate: validateTelemetryDomainCreateModel, $schema: TelemetryCreateSchema } =
  SchemaValidator<TelemetryDomainCreateModel>(telemetryDomainCreateModelSchema, { useDefaults: true })

export const { validate: validateTelemetryAnnotationDomainCreateModel, $schema: TelemetryAnnotationCreateSchema } =
  SchemaValidator<TelemetryAnnotationDomainCreateModel>(telemetryAnnotationDomainCreateModelSchema, {
    useDefaults: true
  })

export const { validate: validateTelemetryAnnotationDomainModel, $schema: TelemetryAnnotationSchema } =
  SchemaValidator<TelemetryAnnotationDomainModel>(telemetryAnnotationDomainModelSchema(), { useDefaults: true })

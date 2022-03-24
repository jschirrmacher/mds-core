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

import type { JSONSchemaType } from '@mds-core/mds-schema-validators'
import { SchemaValidator } from '@mds-core/mds-schema-validators'
import { AUDIT_EVENTS, VEHICLE_EVENTS } from '@mds-core/mds-types'
import type { AuditAttachmentDomainModel, AuditDomainModel, AuditEventDomainModel, AuditTelemetry } from '../@types'

const uuidSchema = <const>{ type: 'string', format: 'uuid' }
const enumSchema = <T>(enumType: T[]) => <const>{ type: 'string', enum: enumType }
const timestampSchema = <const>{ type: 'integer', minimum: 100_000_000_000, maximum: 99_999_999_999_999 }

export const { validate: validateAuditDomainModel, isValid: isValidAuditDomainModel } =
  SchemaValidator<AuditDomainModel>({
    $id: 'Audit',
    type: 'object',
    properties: {
      audit_trip_id: uuidSchema,
      audit_device_id: uuidSchema,
      audit_subject_id: { type: 'string' },
      provider_id: uuidSchema,
      provider_name: { type: 'string' },
      provider_vehicle_id: { type: 'string' },
      provider_device_id: { ...uuidSchema, nullable: true, default: null },
      timestamp: timestampSchema
    },
    required: [
      'audit_trip_id',
      'audit_device_id',
      'audit_subject_id',
      'provider_id',
      'provider_name',
      'provider_vehicle_id'
    ]
  })

const nullableFloat = <const>{ type: 'number', format: 'float', nullable: true, default: null }
const nullableInteger = <const>{ type: 'integer', nullable: true, default: null }

export const auditTelemetryDomainCreateModelSchema: JSONSchemaType<AuditTelemetry> = <const>{
  $id: 'Telemetry',
  type: 'object',
  properties: {
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
  required: ['gps']
}

export const { validate: validateAuditEventDomainModel, isValid: isValidAuditEventDomainModel } =
  SchemaValidator<AuditEventDomainModel>({
    $id: 'AuditEvent',
    type: 'object',
    properties: {
      audit_trip_id: uuidSchema,
      timestamp: { type: 'integer' },
      audit_event_id: uuidSchema,
      audit_event_type: enumSchema([...AUDIT_EVENTS, ...VEHICLE_EVENTS]),
      audit_issue_code: { type: 'string', nullable: true, default: null },
      audit_subject_id: { type: 'string' },
      note: { type: 'string', nullable: true, default: null },
      telemetry: auditTelemetryDomainCreateModelSchema
    },
    required: ['audit_trip_id', 'timestamp', 'audit_event_id', 'audit_event_type', 'audit_subject_id']
  })

export const { validate: validateAuditAttachmentDomainModel, isValid: isValidAuditAttachmentDomainModel } =
  SchemaValidator<AuditAttachmentDomainModel>({
    $id: 'AuditAttachment',
    type: 'object',
    properties: {
      audit_trip_id: uuidSchema,
      attachment_id: uuidSchema
    },
    required: ['audit_trip_id', 'attachment_id']
  })

export const { validate: validateAuditTelemetryDomainCreateModel, isValid: isValidAuditTelemetryDomainCreateModel } =
  SchemaValidator<AuditTelemetry>(auditTelemetryDomainCreateModelSchema, {
    useDefaults: true
  })

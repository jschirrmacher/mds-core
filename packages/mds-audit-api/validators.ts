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

import { TelemetryCreateSchema } from '@mds-core/mds-ingest-service'
import { SchemaValidator } from '@mds-core/mds-schema-validators'
import { AUDIT_EVENT_TYPES, VEHICLE_EVENTS } from '@mds-core/mds-types'
import {
  AuditApiAuditEndRequest,
  AuditApiAuditNoteRequest,
  AuditApiAuditStartRequest,
  AuditApiVehicleEventRequest
} from './types'

const uuidSchema = <const>{ type: 'string', format: 'uuid' }
const timestampSchema = <const>{ type: 'integer', minimum: 100_000_000_000, maximum: 99_999_999_999_999 }

export const { validate: validateAuditApiAuditStartRequest } = SchemaValidator<AuditApiAuditStartRequest['body']>(
  {
    $id: 'AuditApiAuditStartRequest',
    type: 'object',
    properties: {
      timestamp: timestampSchema,
      provider_id: uuidSchema,
      provider_vehicle_id: { type: 'string', maxLength: 255 },
      audit_event_id: uuidSchema,
      audit_device_id: uuidSchema,
      telemetry: { ...TelemetryCreateSchema, nullable: true, default: null }
    },
    required: ['audit_event_id', 'audit_device_id', 'provider_id', 'provider_vehicle_id', 'timestamp']
  },
  { allErrors: true, removeAdditional: true }
)

export const { validate: validateUUID } = SchemaValidator<string>(uuidSchema)
export const { validate: validateTimestamp } = SchemaValidator<number>(timestampSchema)

export const { validate: validateAuditApiVehicleEventRequest } = SchemaValidator<AuditApiVehicleEventRequest['body']>({
  $id: 'AuditApiVehicleEventRequest',
  type: 'object',
  properties: {
    event_type: { type: 'string', enum: VEHICLE_EVENTS },
    timestamp: timestampSchema,
    telemetry: { ...TelemetryCreateSchema, nullable: true, default: null },
    audit_event_id: uuidSchema,
    trip_id: uuidSchema
  },
  required: ['event_type', 'timestamp']
})

export const { validate: validateAuditApiAuditNoteRequest } = SchemaValidator<AuditApiAuditNoteRequest['body']>({
  $id: 'AuditApiAuditNoteRequest',
  type: 'object',
  properties: {
    audit_event_id: uuidSchema,
    audit_event_type: {
      type: 'string',
      enum: [AUDIT_EVENT_TYPES.issue, AUDIT_EVENT_TYPES.note, AUDIT_EVENT_TYPES.summary]
    },
    timestamp: timestampSchema,
    telemetry: { ...TelemetryCreateSchema, nullable: true, default: null },
    audit_issue_code: { type: 'string', maxLength: 31, nullable: true, default: null },
    note: { type: 'string', maxLength: 255, nullable: true, default: null }
  },
  required: ['audit_event_id', 'audit_event_type', 'timestamp'],
  if: {
    properties: {
      audit_event_type: { enum: [AUDIT_EVENT_TYPES.note, AUDIT_EVENT_TYPES.summary] }
    },
    required: ['audit_event_type']
  },
  then: {
    required: ['note']
  }
})

export const { validate: validateAuditApiAuditEndRequest, isValid: isValidAuditApiAuditEndRequest } = SchemaValidator<
  AuditApiAuditEndRequest['body']
>({
  $id: 'AuditApiAuditEndRequest',
  type: 'object',
  properties: {
    audit_event_id: uuidSchema,
    audit_event_type: { type: 'string' },
    timestamp: timestampSchema,
    telemetry: { ...TelemetryCreateSchema, nullable: true, default: null }
  },
  required: ['audit_event_id', 'timestamp', 'audit_event_type']
})

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

import { EventSchema } from '@mds-core/mds-ingest-service'
import { JSONSchemaType, SchemaObject, SchemaValidator } from '@mds-core/mds-schema-validators'
import { UUID, VEHICLE_TYPES } from '@mds-core/mds-types'
import {
  ComplianceViolationDetailsDomainModel,
  CurbUseDetailsDomainModel,
  CustomReceiptDetailsDomainModel,
  FEE_TYPE,
  ReceiptDomainModel,
  SORTABLE_COLUMN,
  SORT_DIRECTION,
  TransactionDomainModel,
  TransactionOperationDomainModel,
  TransactionSearchParams,
  TransactionStatusDomainModel,
  TRANSACTION_OPERATION_TYPE,
  TRANSACTION_STATUS_TYPE,
  TripReceiptDetailsDomainModel
} from '../@types'

const uuidSchema = <const>{ type: 'string', format: 'uuid' }

const timestampSchema = <const>{
  type: 'integer',
  minimum: 100_000_000_000,
  maximum: 99_999_999_999_999
}

const nullableTimestamp = <const>{ ...timestampSchema, nullable: true, default: null }
const nullableString = <const>{ type: 'string', nullable: true, default: null }
const nullableNumber = <const>{ type: 'number', nullable: true, default: null }
const { $id, ...TelemetrySchemaNoId } = EventSchema.properties.telemetry
const { $id: tId, ...EventSchemaNoId } = EventSchema
const usableEventSchema = {
  ...EventSchemaNoId,
  properties: { ...EventSchemaNoId.properties, telemetry: TelemetrySchemaNoId }
}

const tripReceiptSchema: JSONSchemaType<TripReceiptDetailsDomainModel> = {
  type: 'object',
  properties: {
    trip_id: uuidSchema,
    start_timestamp: timestampSchema,
    end_timestamp: timestampSchema,
    start_geography_id: { ...uuidSchema, nullable: true, default: null },
    start_geography_type: { type: 'string' },
    end_geography_id: { ...uuidSchema, nullable: true, default: null },
    end_geography_type: { type: 'string' },
    duration: { type: 'integer', nullable: true, default: null },
    distance: { type: 'number', format: 'float', nullable: true, default: null },
    trip_events: { type: 'array', items: usableEventSchema }
  },
  required: ['start_timestamp', 'end_timestamp', 'trip_events', 'trip_id']
}

/**
 * Currently unused, but could be!
 */
const curbUseSchema: JSONSchemaType<CurbUseDetailsDomainModel> = {
  type: 'object',
  properties: {
    trip_id: uuidSchema,
    start_timestamp: timestampSchema,
    end_timestamp: timestampSchema,
    vehicle_type: { type: 'string', enum: [...VEHICLE_TYPES] },
    geography_id: { ...uuidSchema, nullable: true },
    duration: { type: 'integer' }, // duration of the trip in seconds
    trip_events: { type: 'array', items: usableEventSchema } // Events which occurred in the trip
  },
  required: ['duration', 'end_timestamp', 'geography_id', 'start_timestamp', 'trip_events', 'trip_id', 'vehicle_type']
}

export const { validate: validateTransactionSearchParams } = SchemaValidator<TransactionSearchParams>(
  {
    $id: 'TransactionSearchParams',
    type: 'object',
    properties: {
      provider_id: { ...uuidSchema, nullable: true, default: null },
      start_timestamp: nullableTimestamp,
      end_timestamp: nullableTimestamp,
      search_text: nullableString,
      start_amount: nullableNumber,
      end_amount: nullableNumber,
      fee_type: { type: 'string', enum: [...FEE_TYPE, null], nullable: true, default: null },
      before: nullableString,
      after: nullableString,
      limit: { type: 'integer', nullable: true, minimum: 1, maximum: 1000, default: 10 },
      order: {
        type: 'object',
        nullable: true,
        properties: {
          column: { type: 'string', enum: SORTABLE_COLUMN },
          direction: { type: 'string', enum: SORT_DIRECTION }
        },
        required: ['column', 'direction']
      }
    }
  },
  { useDefaults: true }
)

const complianceViolationDetailsSchema: JSONSchemaType<ComplianceViolationDetailsDomainModel> = {
  type: 'object',
  description: 'Receipt details which provide a pointer to an MDS Compliance Violation.',
  properties: {
    violation_id: uuidSchema,
    trip_id: { ...uuidSchema, nullable: true, default: null },
    policy_id: uuidSchema
  },
  required: ['violation_id']
}

const customReceiptDetailsSchema: JSONSchemaType<CustomReceiptDetailsDomainModel> = {
  type: 'object',
  properties: {
    custom_description: { type: 'string' }
  },
  required: ['custom_description']
}

const receiptDomainSchema = <const>{
  type: 'object',
  properties: {
    receipt_id: uuidSchema,
    timestamp: timestampSchema,
    origin_url: {
      description: 'Where did this transaction originate?',
      type: 'string',
      format: 'uri',
      example: 'https://mds.coruscant.com/compliance/snapshot/c78280ff-4e58-4e30-afa9-d72673037799'
    },
    receipt_details: {
      anyOf: [tripReceiptSchema, complianceViolationDetailsSchema, curbUseSchema, customReceiptDetailsSchema]
    }
  },
  required: ['origin_url', 'receipt_details', 'receipt_id', 'timestamp']
}

const {
  $schema: { $schema, ...receiptSchema }
} = SchemaValidator<ReceiptDomainModel>(receiptDomainSchema, { keywords: ['example'] })

export const { validate: validateTransactionDomainModel, $schema: TransactionSchema } =
  SchemaValidator<TransactionDomainModel>(
    {
      $id: 'Transaction',
      type: 'object',
      properties: {
        transaction_id: uuidSchema,
        provider_id: { ...uuidSchema, description: 'What Provider is being charged for this transaction?' },
        device_id: { ...uuidSchema, nullable: true },
        timestamp: timestampSchema,
        fee_type: { type: 'string', enum: [...FEE_TYPE] },
        amount: { type: 'integer' },
        receipt: receiptSchema
      },
      required: ['amount', 'device_id', 'fee_type', 'provider_id', 'receipt', 'timestamp', 'transaction_id']
    },
    { keywords: ['example'] }
  )

export const { validate: validateTransactionOperationDomainModel, $schema: TransactionOperationSchema } =
  SchemaValidator<TransactionOperationDomainModel>({
    $id: 'TransactionOperation',
    type: 'object',
    properties: {
      transaction_id: uuidSchema,
      operation_id: uuidSchema,
      timestamp: timestampSchema,
      operation_type: { type: 'string', enum: [...TRANSACTION_OPERATION_TYPE] },
      author: { description: 'Who/what executed this operation?', type: 'string' }
    },
    required: ['author', 'operation_id', 'operation_type', 'timestamp', 'transaction_id']
  })

export const { validate: validateTransactionStatusDomainModel, $schema: TransactionStatusSchema } =
  SchemaValidator<TransactionStatusDomainModel>({
    $id: 'TransactionStatus',
    type: 'object',
    properties: {
      transaction_id: uuidSchema,
      status_id: uuidSchema,
      timestamp: timestampSchema,
      status_type: { type: 'string', enum: [...TRANSACTION_STATUS_TYPE] },
      author: { description: 'Who/what updated the status of the transaction?', type: 'string' }
    },
    required: ['author', 'status_id', 'status_type', 'timestamp', 'transaction_id']
  })

export const { validate: validateTransactionId } = SchemaValidator<UUID>(uuidSchema)

export const { validate: validateTransactionIds } = SchemaValidator<UUID[]>({
  type: 'array',
  maxItems: 100,
  items: uuidSchema
})

export const schemas: SchemaObject[] = [TransactionSchema, TransactionOperationSchema, TransactionStatusSchema]

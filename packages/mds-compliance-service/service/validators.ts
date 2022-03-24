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

import type { SchemaObject } from '@mds-core/mds-schema-validators'
import { SchemaValidator } from '@mds-core/mds-schema-validators'
import { VEHICLE_EVENTS, VEHICLE_STATES } from '@mds-core/mds-types'
import type {
  ComplianceSnapshotDomainModel,
  ComplianceViolationDomainModel,
  GetComplianceSnapshotsByTimeIntervalOptions,
  MatchedVehicleInformation
} from '../@types'

const uuidSchema = <const>{ type: 'string', format: 'uuid' }
const timestampSchema = <const>{ type: 'integer', minimum: 100_000_000_000, maximum: 99_999_999_999_999 }
const vehicleStatusSchema = <const>{ type: 'string', enum: VEHICLE_STATES }
const vehicleEventTypeSchema = <const>{ type: 'string', enum: VEHICLE_EVENTS }

export const { $schema: matchedVehicleInformationSchema } = SchemaValidator<MatchedVehicleInformation>({
  type: 'object',
  properties: {
    device_id: uuidSchema,
    rule_applied: { ...uuidSchema, nullable: true, default: null },
    rules_matched: { type: 'array', items: uuidSchema },
    state: vehicleStatusSchema,
    event_types: { type: 'array', items: vehicleEventTypeSchema },
    timestamp: timestampSchema,
    gps: {
      type: 'object',
      properties: {
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lng: { type: 'number', minimum: -180, maximum: 180 }
      },
      required: ['lat', 'lng']
    },
    speed: { type: 'number', nullable: true, default: null }
  },
  required: ['device_id', 'rules_matched', 'event_types', 'state', 'timestamp', 'gps']
})

export const { validate: validateComplianceSnapshotDomainModel } = SchemaValidator<ComplianceSnapshotDomainModel>({
  $id: 'ComplianceSnapshotDomainModel',
  type: 'object',
  properties: {
    compliance_snapshot_id: uuidSchema,
    compliance_as_of: timestampSchema,
    provider_id: uuidSchema,
    policy: {
      $id: 'Policy',
      type: 'object',
      properties: { policy_id: uuidSchema, name: { type: 'string' } },
      required: ['name', 'policy_id']
    },
    vehicles_found: { type: 'array', items: matchedVehicleInformationSchema },
    excess_vehicles_count: { type: 'integer' },
    total_violations: { type: 'integer' },
    violating_vehicles: { type: 'array', items: matchedVehicleInformationSchema }
  },
  required: [
    'compliance_as_of',
    'compliance_snapshot_id',
    'excess_vehicles_count',
    'policy',
    'provider_id',
    'total_violations',
    'vehicles_found',
    'violating_vehicles'
  ]
})

export const { validate: validateGetComplianceSnapshotsByTimeIntervalOptions } =
  SchemaValidator<GetComplianceSnapshotsByTimeIntervalOptions>(
    {
      $id: 'GetComplianceSnapshotsByTimeIntervalOptions',
      type: 'object',
      dynamicDefaults: {
        end_time: 'timestamp'
      },
      properties: {
        start_time: timestampSchema,
        end_time: { ...timestampSchema, nullable: true },
        provider_ids: { type: 'array', items: uuidSchema, nullable: true },
        policy_ids: { type: 'array', items: uuidSchema, nullable: true }
      },
      required: ['start_time'],
      allOf: [
        {
          if: { properties: { end_time: { type: 'number' } }, required: ['end_time'] },
          then: {
            properties: {
              start_time: {
                ...timestampSchema,
                maximum: { $data: '1/end_time' },
                errorMessage: 'should be less than end_time'
              }
            }
          }
        }
      ]
    },
    { useDefaults: true, $data: true, allErrors: true }
  )

export const { validate: validateComplianceViolationDomainModel, $schema: ComplianceViolationSchema } =
  SchemaValidator<ComplianceViolationDomainModel>({
    $id: 'ComplianceViolation',
    type: 'object',
    properties: {
      violation_id: uuidSchema,
      timestamp: timestampSchema,
      policy_id: uuidSchema,
      provider_id: uuidSchema,
      rule_id: uuidSchema,
      violation_details: {
        type: 'object',
        properties: {
          event_timestamp: timestampSchema,
          device_id: uuidSchema,
          trip_id: { ...uuidSchema, nullable: true, default: null }
        },
        required: ['event_timestamp', 'device_id']
      }
    },
    required: ['violation_id', 'timestamp', 'policy_id', 'provider_id', 'rule_id', 'violation_details']
  })

export const schemas: SchemaObject[] = [ComplianceViolationSchema]

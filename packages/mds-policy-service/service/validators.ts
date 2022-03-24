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
import type {
  MICRO_MOBILITY_VEHICLE_EVENT,
  MICRO_MOBILITY_VEHICLE_STATE,
  TAXI_VEHICLE_EVENT,
  TAXI_VEHICLE_STATE
} from '@mds-core/mds-types'
import {
  ACCESSIBILITY_OPTIONS,
  DAYS_OF_WEEK,
  MICRO_MOBILITY_VEHICLE_EVENTS,
  MICRO_MOBILITY_VEHICLE_STATES,
  PROPULSION_TYPES,
  SERVICE_TYPE,
  TAXI_VEHICLE_EVENTS,
  TAXI_VEHICLE_STATES,
  TNC_VEHICLE_EVENT,
  TNC_VEHICLE_STATE,
  TRANSACTION_TYPE,
  VEHICLE_TYPES
} from '@mds-core/mds-types'
import type { PolicyDomainCreateModel, PolicyMetadataDomainModel, PresentationOptions, Rule } from '../@types'
import { RATE_RECURRENCE_VALUES, RULE_TYPE_LIST } from '../@types'

const uuidSchema = <const>{ type: 'string', format: 'uuid' }

// Timestamp Schema that ensures milliseconds

const timestampSchema = <const>{
  type: 'integer',
  minimum: 100_000_000_000,
  maximum: 99_999_999_999_999
}

const enumSchema = <T>(enumType: T) => <const>{ type: 'string', enum: enumType }

/**
 * `modality` can be null, and defaults to 'micromobility'. The way to express this in AJV / JSONSChema
 * is to only specify `required:` in the other cases.
 */

const stateModalitySchema = <T extends string, P>(constString: T, props: P) =>
  <const>{
    properties: {
      modality: {
        type: 'string',
        enum: [constString]
      },
      states: { type: 'object', properties: props, nullable: true }
    },
    ...(constString === 'micromobility' ? {} : { required: ['modality'] })
  }

const checkRateFieldsIfConditionSchema = <const>{
  if: {
    properties: {
      rules: {
        type: 'array',
        contains: {
          type: 'object',
          properties: {
            rule_type: { type: 'string', const: 'rate' }
          }
        }
      }
    }
  },
  then: {
    properties: {
      currency: { type: 'string' }
    },
    required: ['currency']
  }
}

type MICRO_MOBILITY_VEHICLE_EVENT_ARRAY_ENUM = {
  type: 'array'
  items: { type: 'string'; enum: MICRO_MOBILITY_VEHICLE_EVENT[] | [] }
  nullable: true
}

const micromobilityStateMap = MICRO_MOBILITY_VEHICLE_STATES.reduce<{
  [k in MICRO_MOBILITY_VEHICLE_STATE]?: MICRO_MOBILITY_VEHICLE_EVENT_ARRAY_ENUM
}>((acc, state) => {
  acc[state] = {
    type: 'array',
    items: enumSchema([...MICRO_MOBILITY_VEHICLE_EVENTS]),
    nullable: true
  }
  return acc
}, {})

type TNC_VEHICLE_EVENT_ARRAY_ENUM = {
  type: 'array'
  items: { type: 'string'; enum: TNC_VEHICLE_EVENT[] | [] }
  nullable: true
}

const tncStateMap = TNC_VEHICLE_STATE.reduce<{
  [k in TNC_VEHICLE_STATE]?: TNC_VEHICLE_EVENT_ARRAY_ENUM
}>((acc, state) => {
  acc[state] = { type: 'array', items: enumSchema([...TNC_VEHICLE_EVENT]), nullable: true }
  return acc
}, {})

type TAXI_VEHICLE_EVENT_ARRAY_ENUM = {
  type: 'array'
  items: { type: 'string'; enum: TAXI_VEHICLE_EVENT[] | [] }
  nullable: true
}

const taxiStateMap = TAXI_VEHICLE_STATES.reduce<{ [k in TAXI_VEHICLE_STATE]?: TAXI_VEHICLE_EVENT_ARRAY_ENUM }>(
  (acc, state) => {
    acc[state] = { type: 'array', items: enumSchema([...TAXI_VEHICLE_EVENTS]), nullable: true }
    return acc
  },
  {}
)

export const ruleSchema: JSONSchemaType<Rule> = <const>{
  $id: 'BaseRule',
  type: 'object',
  properties: {
    accessibility_options: { type: 'array', items: { type: 'string', enum: ACCESSIBILITY_OPTIONS }, nullable: true },
    days: { type: 'array', items: { type: 'string', enum: Object.values(DAYS_OF_WEEK) }, nullable: true },
    end_time: { type: 'string', nullable: true, pattern: '^\\d{2}:\\d{2}:\\d{2}$' },
    geographies: { type: 'array', items: uuidSchema },
    maximum: { type: 'number', nullable: true },
    messages: {
      $id: 'PolicyMessage',
      type: 'object',
      required: [],
      nullable: true,
      default: null
    },
    minimum: { type: 'number', nullable: true },
    modality: { type: 'string', nullable: true, default: 'micromobility' },
    name: { type: 'string' },
    rule_id: uuidSchema,
    rule_type: {
      type: 'string',
      enum: RULE_TYPE_LIST
    },
    rule_units: { type: 'string', nullable: true, default: null },
    rate_amount: { type: 'number', nullable: true, default: null },
    rate_recurrence: { type: 'string', enum: [null, ...RATE_RECURRENCE_VALUES], nullable: true, default: null },
    states: { type: 'object', nullable: true, default: null }, // default to micromobility state map
    start_time: { type: 'string', nullable: true, pattern: '^\\d{2}:\\d{2}:\\d{2}$' },
    value_url: { type: 'string', nullable: true },
    vehicle_types: { type: 'array', items: enumSchema(VEHICLE_TYPES), nullable: true },
    service_types: { type: 'array', items: enumSchema(SERVICE_TYPE), nullable: true, default: null },
    transaction_types: { type: 'array', items: enumSchema(TRANSACTION_TYPE), nullable: true, default: null },
    propulsion_types: { type: 'array', items: enumSchema(PROPULSION_TYPES), nullable: true, default: null }
  },
  oneOf: [
    stateModalitySchema('micromobility', micromobilityStateMap),
    stateModalitySchema('tnc', tncStateMap),
    stateModalitySchema('taxi', taxiStateMap)
  ],
  required: ['geographies', 'name', 'rule_id', 'rule_type', 'states']
}

export const { validate: validateRuleSchema } = SchemaValidator<Rule>(ruleSchema)

export const {
  validate: validatePolicyDomainModel,
  isValid: isValidPolicyDomainModel,
  $schema: PolicyDomainModelSchema
} = SchemaValidator<PolicyDomainCreateModel>(
  {
    $id: 'PolicyDomainCreateModel',
    type: 'object',
    properties: {
      policy_id: uuidSchema,
      name: { type: 'string' },
      currency: { type: 'string', nullable: true, default: null },
      description: { type: 'string' },
      provider_ids: { type: 'array', items: uuidSchema, nullable: true, default: null },
      start_date: timestampSchema,
      end_date: { ...timestampSchema, nullable: true, default: null },
      prev_policies: { type: 'array', items: uuidSchema, nullable: true, default: null },
      publish_date: { ...timestampSchema, nullable: true, default: null },
      rules: {
        type: 'array',
        items: ruleSchema
      }
    },
    oneOf: [checkRateFieldsIfConditionSchema],
    required: ['policy_id', 'name', 'description', 'start_date', 'rules']
  },
  { allErrors: true, useDefaults: true }
)

export const { validate: validatePolicyMetadataDomainModel, isValid: isValidPolicyMetadataDomainModel } =
  SchemaValidator<PolicyMetadataDomainModel>({
    $id: 'PolicyMetadataDomainModel',
    type: 'object',
    properties: {
      policy_id: { type: 'string', format: 'uuid' },
      policy_metadata: { type: 'object' }
    },
    required: ['policy_id']
  })

export const { validate: validatePresentationOptions, isValid: isValidPresentationOptions } =
  SchemaValidator<PresentationOptions>({
    $id: 'PresentationOptions',
    type: 'object',
    properties: {
      withStatus: { type: 'boolean', nullable: true, default: null }
    }
  })

export const schemas = [PolicyDomainModelSchema]

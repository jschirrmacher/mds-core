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

import { SchemaValidator, ValidationError } from '@mds-core/mds-schema-validators'
import type { UUID } from '@mds-core/mds-types'
import Ajv from 'ajv'
import gjv from 'geojson-validation'
import type {
  GeographyDomainCreateModel,
  GeographyDomainModel,
  GeographyMetadataDomainCreateModel,
  GetGeographiesOptions,
  GetPublishedGeographiesOptions
} from '../@types'
import { GeographyServiceLogger } from '../logger'

const ajvWithGeoJSON = new Ajv({ allErrors: true }).addKeyword({
  keyword: 'valid_geojson',
  schema: false,
  type: 'object',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate: (geography_json: any) => {
    try {
      const messageOrResponse = gjv.valid(geography_json, true)
      if (messageOrResponse.length < 1) {
        return true
      } else {
        throw new ValidationError(messageOrResponse.join(','))
      }
    } catch (error) {
      GeographyServiceLogger.error(`geojson-validation error`, { error })
      return false
    }
  }
})

const uuidSchema = <const>{ type: 'string', format: 'uuid' }

export const { validate: validateGeographyDomainCreateModel, isValid: isValidGeographyDomainCreateModel } =
  SchemaValidator<GeographyDomainCreateModel>(
    {
      $id: 'GeographyCreate',
      type: 'object',
      properties: {
        geography_id: uuidSchema,
        name: { type: 'string', maxLength: 255, nullable: true, default: null },
        description: { type: 'string', maxLength: 255, nullable: true, default: null },
        effective_date: { type: 'integer', nullable: true, default: null },
        prev_geographies: { type: 'array', items: uuidSchema, nullable: true, default: null },
        geography_json: {
          type: 'object',
          required: ['features', 'type'],
          valid_geojson: true
        }
      },
      additionalProperties: false,
      required: ['geography_id', 'geography_json']
    },
    { allErrors: true },
    ajvWithGeoJSON
  )

export const { validate: validateGeographyDomainModel, isValid: isValidGeographyDomainModel } =
  SchemaValidator<GeographyDomainModel>(
    {
      $id: 'Geography',
      type: 'object',
      properties: {
        geography_id: uuidSchema,
        name: { type: 'string', maxLength: 255, nullable: true, default: null },
        description: { type: 'string', maxLength: 255, nullable: true, default: null },
        effective_date: { type: 'integer', nullable: true, default: null },
        prev_geographies: { type: 'array', items: uuidSchema, nullable: true, default: null },
        publish_date: { type: 'integer', nullable: true, default: null },
        geography_json: {
          type: 'object',
          required: ['features', 'type'],
          valid_geojson: true
        }
      },
      additionalProperties: false,
      required: ['geography_id', 'geography_json']
    },
    { allErrors: true },
    ajvWithGeoJSON
  )

export const {
  validate: validateGeographyMetadataDomainCreateModel,
  isValid: isValidGeographyMetadataDomainCreateModel
} = SchemaValidator<GeographyMetadataDomainCreateModel>({
  $id: 'GeographyMetadata',
  type: 'object',
  properties: {
    geography_id: uuidSchema,
    geography_metadata: { type: 'object', nullable: true, default: null }
  },
  required: ['geography_id']
})

export const { validate: validateGetGeographiesOptions, isValid: isValidGetGeographiesOptions } =
  SchemaValidator<GetGeographiesOptions>({
    $id: 'GetGeographyOptions',
    type: 'object',
    properties: {
      includeMetadata: { type: 'boolean', nullable: true, default: false },
      includeGeographyJSON: { type: 'boolean', nullable: true, default: true },
      includeHidden: { type: 'boolean', nullable: true, default: true }
    }
  })

export const { validate: validateGetPublishedGeographiesOptions, isValid: isValidGetPublishedGeographiesOptions } =
  SchemaValidator<GetPublishedGeographiesOptions>({
    $id: 'GetPublishedGeographiesOptions',
    type: 'object',
    properties: {
      includeMetadata: { type: 'boolean', nullable: true, default: false },
      includeGeographyJSON: { type: 'boolean', nullable: true, default: true },
      includeHidden: { type: 'boolean', nullable: true, default: true },
      publishedAfter: { type: 'integer', nullable: true }
    }
  })

export const { validate: validateUuids, isValid: isValidUuids } = SchemaValidator<UUID[]>({
  type: 'array',
  items: {
    type: 'string',
    format: 'uuid'
  }
})

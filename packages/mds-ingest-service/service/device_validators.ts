import { SchemaValidator } from '@mds-core/mds-schema-validators'
import { ACCESSIBILITY_OPTIONS, MODALITIES, PROPULSION_TYPES, VEHICLE_TYPES } from '@mds-core/mds-types'
import type { DeviceDomainModel, GetDeviceOptions, GetDevicesOptions } from '../@types'
import { nullableInteger, nullableString, nullableUUID, timestampSchema, uuidSchema } from './util_schemas'

export const { validate: validateGetDevicesOptions } = SchemaValidator<GetDevicesOptions>({
  type: 'object',
  properties: {
    limit: { type: 'integer', nullable: true, default: null },
    provider_id: nullableUUID
  },
  additionalProperties: false,
  required: []
})

export const { validate: validateGetDeviceOptions } = SchemaValidator<GetDeviceOptions>({
  type: 'object',
  properties: {
    device_id: uuidSchema,
    provider_id: nullableUUID
  },
  additionalProperties: false,
  required: []
})

export const { validate: validateDeviceDomainModel, $schema: DeviceSchema } = SchemaValidator<DeviceDomainModel>(
  {
    $id: 'Device',
    type: 'object',
    properties: {
      device_id: uuidSchema,
      provider_id: uuidSchema,
      vehicle_id: {
        type: 'string'
      },
      vehicle_type: { type: 'string', enum: VEHICLE_TYPES },
      propulsion_types: {
        type: 'array',
        items: {
          type: 'string',
          enum: PROPULSION_TYPES
        }
      },
      accessibility_options: {
        type: 'array',
        items: {
          type: 'string',
          enum: ACCESSIBILITY_OPTIONS
        },
        default: []
      },
      modality: { type: 'string', enum: MODALITIES, default: 'micromobility' },
      recorded: timestampSchema,
      // ⬇⬇⬇ NULLABLE/OPTIONAL PROPERTIES ⬇⬇⬇
      year: nullableInteger,
      mfgr: nullableString,
      model: nullableString
    },
    required: ['device_id', 'provider_id', 'vehicle_id', 'vehicle_type', 'propulsion_types', 'recorded']
  },
  { useDefaults: true }
)

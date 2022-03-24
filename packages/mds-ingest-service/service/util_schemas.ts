import { SchemaValidator } from '@mds-core/mds-schema-validators'
import type { UUID } from '@mds-core/mds-types'

export const uuidSchema = <const>{ type: 'string', format: 'uuid' }
export const timestampSchema = <const>{
  type: 'integer',
  minimum: 100_000_000_000,
  maximum: 99_999_999_999_999
}

export const nullableUUID = <const>{
  type: 'string',
  format: 'uuid',
  nullable: true,
  default: null
}

export const nullableInteger = <const>{
  type: 'integer',
  nullable: true,
  default: null
}

export const nullableFloat = <const>{
  type: 'number',
  format: 'float',
  nullable: true,
  default: null
}

export const nullableString = <const>{ type: 'string', nullable: true, default: null }

export const { validate: validateUUIDs } = SchemaValidator<UUID[]>({
  type: 'array',
  items: uuidSchema
})

export const nullableArray = <T>(enums: T[]) => {
  return <const>{ type: 'array', items: { type: 'string', enum: enums }, nullable: true }
}

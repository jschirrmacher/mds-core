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

import { ValidationError } from '@mds-core/mds-utils'
import Ajv, { JSONSchemaType, Options, ValidateFunction } from 'ajv'
import withErrors from 'ajv-errors'
import withFormats from 'ajv-formats'
import dynamicDefaults from 'ajv-keywords/dist/definitions/dynamicDefaults'
import transform from 'ajv-keywords/dist/definitions/transform'
import Joi from 'joi'

export type { JSONSchemaType, SchemaObject } from 'ajv'
export * from './generators'
// Export an example schema for testing purposes
export * from './tests/test.schema'
export * from './v0_4_1'
export * from './validators'

export type Schema<T> = JSONSchemaType<T>

export type SchemaValidator<T> = {
  validate: (input: unknown) => T
  isValid: (input: unknown) => input is T
  $schema: Schema<T> & { $schema: string }
}

export const SchemaValidator = <T>(
  schema: Schema<T>,
  options: Options = { allErrors: true },
  ajv?: Ajv
): SchemaValidator<T> => {
  const $schema = Object.assign({ $schema: 'http://json-schema.org/draft-07/schema#' }, schema)
  let ajvInstance = ajv || new Ajv(options)
  /* the ajv-errors plugin throws an error when allErrors is not true */
  if (options.allErrors === true) {
    if (!ajvInstance.getKeyword('errorMessage')) {
      ajvInstance = withErrors(ajvInstance)
    }
  }
  if (!ajvInstance.getKeyword('dynamicDefaults')) {
    ajvInstance.addKeyword(dynamicDefaults())
  }
  if (!ajvInstance.getKeyword('transform')) {
    ajvInstance.addKeyword(transform())
  }

  const validator: ValidateFunction<T> = withFormats(ajvInstance, [
    'duration',
    'uuid',
    'uri',
    'email',
    'float'
  ]).compile($schema)
  return {
    validate: (input: unknown) => {
      if (!validator(input)) {
        const [{ instancePath, message } = { instancePath: 'Data', message: 'is invalid' }] = validator.errors ?? []
        throw new ValidationError(`${instancePath} ${message}`, validator.errors)
      }
      return input
    },
    isValid: (input: unknown): input is T => validator(input),
    $schema
  }
}

/**
 * @deprecated JSON Schema based validation is preferable to Joi. Please use the SchemaValidator instead.
 */
export const schemaValidator = <T>(
  schema: Joi.Schema,
  options?: Joi.ValidationOptions
): Omit<SchemaValidator<T>, '$schema'> => ({
  validate: (input: unknown): T => {
    const { error, value } = schema.validate(input, options)
    if (error) {
      throw new ValidationError(error.message, input)
    }
    return value as T
  },
  isValid: (input: unknown): input is T => !schema.validate(input, options).error
})

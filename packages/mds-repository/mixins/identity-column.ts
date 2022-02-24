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

import { AnyConstructor } from '@mds-core/mds-types'
import { Column, Index } from 'typeorm'
import { ColumnCommonOptions } from 'typeorm/decorator/options/ColumnCommonOptions'
import { ColumnWithWidthOptions } from 'typeorm/decorator/options/ColumnWithWidthOptions'
import { BigintTransformer } from '../transformers'

export type IdentityColumn = { id: number }

export type IdentityColumnCreateModel<T> = T extends IdentityColumn ? Omit<T, keyof IdentityColumn> : T

// Property decorator to emit GENERATED ALWAYS AS IDENTITY
const GeneratedAlwaysAsIdentity = (
  options: Omit<
    ColumnWithWidthOptions & ColumnCommonOptions,
    'type' | 'generated' | 'generatedIdentity' | 'insert' | 'transformer'
  > = {}
): PropertyDecorator => {
  return (target, propertyKey) => {
    Column({
      type: 'bigint',
      generated: 'identity',
      generatedIdentity: 'ALWAYS',
      insert: false,
      transformer: BigintTransformer,
      ...options
    })(target, propertyKey)
    // Only generate a unique index on the column when it's not part of the entity's primary key
    if (!options.primary) {
      Index({ unique: true })(target, propertyKey)
    }
  }
}

export const IdentityColumn = <T extends AnyConstructor>(
  EntityClass: T,
  options: ColumnWithWidthOptions & ColumnCommonOptions = {}
) => {
  abstract class IdentityColumnMixin extends EntityClass implements IdentityColumn {
    @GeneratedAlwaysAsIdentity(options)
    id: number
  }
  return IdentityColumnMixin
}

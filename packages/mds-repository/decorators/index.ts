/**
 * Forces a `reflect-metadata` `design:type` decorator.
 * Useful in cases that things like TypeORM fail to generate the proper decorators based on your type definitions (e.g. if you use type composition, or indexed access types.)
 * @param value Constructor for type to force.
 * @example
 * DesignType(Number)
 * DesignType(String)
 */

import { Column } from 'typeorm'
import type { ColumnCommonOptions } from 'typeorm/decorator/options/ColumnCommonOptions'
import type { ColumnWithLengthOptions } from 'typeorm/decorator/options/ColumnWithLengthOptions'
import type { TransformerOptions } from '../transformers'
import { BigintTransformer, LowercaseTransformer, UppercaseTransformer } from '../transformers'

type DesignTypeValue = Parameters<typeof Reflect.metadata>[1]
export const DesignType = (value: DesignTypeValue): PropertyDecorator => Reflect.metadata('design:type', value)

export type LowercaseColumnOptions = Omit<
  ColumnCommonOptions & ColumnWithLengthOptions & TransformerOptions,
  'transformer'
>

export const LowercaseColumn = ({ direction, ...options }: LowercaseColumnOptions = {}): PropertyDecorator =>
  Column('varchar', { ...options, transformer: LowercaseTransformer({ direction }) })

export type UppercaseColumnOptions = Omit<
  ColumnCommonOptions & ColumnWithLengthOptions & TransformerOptions,
  'transformer'
>

export const UppercaseColumn = ({ direction, ...options }: UppercaseColumnOptions = {}): PropertyDecorator =>
  Column('varchar', { ...options, transformer: UppercaseTransformer({ direction }) })

export type BigintColumnOptions = Omit<ColumnCommonOptions & ColumnWithLengthOptions, 'transformer'>

export const BigintColumn = (options: BigintColumnOptions = {}): PropertyDecorator =>
  Column('bigint', { ...options, transformer: BigintTransformer })

export type TimestampColumnOptions = BigintColumnOptions

export const TimestampColumn =
  (options: TimestampColumnOptions = {}): PropertyDecorator =>
  (target, propertyKey) =>
    [BigintColumn(options), DesignType(Number)].forEach(decorator => decorator(target, propertyKey))

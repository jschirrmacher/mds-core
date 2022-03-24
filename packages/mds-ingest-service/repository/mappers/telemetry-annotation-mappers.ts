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

import type { IdentityColumn, RecordedColumn } from '@mds-core/mds-repository'
import { ModelMapper } from '@mds-core/mds-repository'
import type { Timestamp } from '@mds-core/mds-types'
import type { TelemetryAnnotationDomainCreateModel, TelemetryAnnotationDomainModel } from '../../@types'
import type { TelemetryAnnotationEntityModel } from '../entities/telemetry-annotation-entity'

type TelemetryAnnotationEntityToDomainOptions = Partial<{}>

export const TelemetryAnnotationEntityToDomain = ModelMapper<
  TelemetryAnnotationEntityModel,
  TelemetryAnnotationDomainModel,
  TelemetryAnnotationEntityToDomainOptions
>((entity, options) => {
  const { id, recorded, ...domain } = entity
  return { ...domain }
})

export const TelemetryAnnotationEntityToDomainWithIdentityColumn = ModelMapper<
  TelemetryAnnotationEntityModel,
  TelemetryAnnotationDomainModel & IdentityColumn,
  TelemetryAnnotationEntityToDomainOptions
>((entity, options) => {
  const { id } = entity
  return { ...TelemetryAnnotationEntityToDomain.map(entity, options), id }
})

type TelemetryAnnotationEntityCreateOptions = Partial<{
  recorded: Timestamp
}>

export type TelemetryAnnotationEntityCreateModel = Omit<
  TelemetryAnnotationEntityModel,
  keyof IdentityColumn | keyof RecordedColumn
>

export const TelemetryAnnotationDomainToEntityCreate = ModelMapper<
  TelemetryAnnotationDomainCreateModel,
  TelemetryAnnotationEntityCreateModel,
  TelemetryAnnotationEntityCreateOptions
>(({ ...domain }, options) => {
  const { recorded } = options ?? {}

  return {
    recorded,
    ...domain
  }
})

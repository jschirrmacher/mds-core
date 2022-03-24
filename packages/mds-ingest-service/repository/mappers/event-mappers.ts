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
import type { Nullable, Timestamp } from '@mds-core/mds-types'
import type {
  EventAnnotationDomainModel,
  EventDomainCreateModel,
  EventDomainModel,
  MigratedEventDomainModel,
  TelemetryDomainModel
} from '../../@types'
import type { EventEntityModel } from '../entities/event-entity'
import type { MigratedEntityModel } from '../mixins/migrated-entity'
import { EventAnnotationEntityToDomain } from './event-annotation-mappers'
import { TelemetryEntityToDomain } from './telemetry-mappers'

type EventEntityToDomainOptions = Partial<{}>

export const EventEntityToDomain = ModelMapper<EventEntityModel, EventDomainModel, EventEntityToDomainOptions>(
  (entity, options) => {
    const {
      id,
      telemetry: telemetry_entity,
      annotation: annotation_entity,
      migrated_from_source,
      migrated_from_version,
      migrated_from_id,
      ...domain
    } = entity
    const telemetry: TelemetryDomainModel = TelemetryEntityToDomain.map(telemetry_entity)
    const annotation: Nullable<EventAnnotationDomainModel> = annotation_entity
      ? EventAnnotationEntityToDomain.map(annotation_entity)
      : null
    return { telemetry, annotation, ...domain }
  }
)

/**
 * Slightly weird mapper that is used only for migrated events
 * @deprecated
 */
export const MigratedEventEntityToDomainWithIdentityColumn = ModelMapper<
  EventEntityModel,
  MigratedEventDomainModel,
  EventEntityToDomainOptions
>((entity, options) => {
  const { id, telemetry, annotation, migrated_from_source, migrated_from_version, migrated_from_id, ...domain } = entity
  return { id, ...domain }
})

type EventEntityCreateOptions = Partial<{
  recorded: Timestamp
}>

export type EventEntityCreateModel = Omit<
  EventEntityModel,
  keyof IdentityColumn | keyof RecordedColumn | keyof MigratedEntityModel | 'telemetry' | 'annotation'
>

export const EventDomainToEntityCreate = ModelMapper<
  EventDomainCreateModel,
  EventEntityCreateModel,
  EventEntityCreateOptions
>(({ telemetry, trip_id = null, trip_state = null, ...domain }, options) => {
  const { recorded } = options ?? {}

  const { timestamp: telemetry_timestamp } = telemetry

  return {
    trip_id,
    trip_state,
    recorded,
    telemetry_timestamp,
    ...domain
  }
})

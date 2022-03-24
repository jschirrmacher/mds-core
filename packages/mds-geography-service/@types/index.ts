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

import type { DomainModelCreate } from '@mds-core/mds-repository'
import type { RpcEmptyRequestContext, RpcServiceDefinition } from '@mds-core/mds-rpc-common'
import { RpcRoute } from '@mds-core/mds-rpc-common'
import type { Nullable, Timestamp, UUID } from '@mds-core/mds-types'
import type { FeatureCollection } from 'geojson'

export interface GeographyDomainModel {
  geography_id: UUID
  name: Nullable<string>
  description: Nullable<string>
  effective_date: Nullable<Timestamp>
  publish_date: Nullable<Timestamp>
  prev_geographies: Nullable<UUID[]>
  geography_json: FeatureCollection
}

export type GeographyDomainCreateModel = DomainModelCreate<Omit<GeographyDomainModel, 'publish_date'>>

export interface GeographyMetadataDomainModel<M extends {} = {}> {
  geography_id: UUID
  geography_metadata: Nullable<M>
}

export type GeographyMetadataDomainCreateModel = DomainModelCreate<GeographyMetadataDomainModel>

export type GetGeographiesOptions = Partial<{
  includeMetadata: boolean
  includeGeographyJSON: boolean
  includeHidden: boolean
}>

export interface PublishGeographyParams {
  publish_date?: Timestamp
  geography_id: UUID
}

export type GetPublishedGeographiesOptions = GetGeographiesOptions &
  Partial<{
    publishedAfter: Timestamp
  }>

export type GeographyWithMetadataDomainModel<M extends Record<string, any> = Record<string, any>> =
  GeographyDomainModel & Partial<Pick<GeographyMetadataDomainModel<M>, 'geography_metadata'>>

export interface GeographyService {
  getGeography: (
    geography_id: GeographyDomainModel['geography_id'],
    options?: GetGeographiesOptions
  ) => GeographyWithMetadataDomainModel | undefined
  getGeographies: (options?: GetGeographiesOptions) => GeographyWithMetadataDomainModel[]
  getUnpublishedGeographies: (options?: GetGeographiesOptions) => GeographyWithMetadataDomainModel[]
  getPublishedGeographies: (options?: GetPublishedGeographiesOptions) => GeographyWithMetadataDomainModel[]
  writeGeographies: (geographies: GeographyDomainCreateModel[]) => GeographyDomainModel[]
  writeGeographiesMetadata: (metadata: GeographyMetadataDomainCreateModel[]) => GeographyMetadataDomainModel[]
  deleteGeographyAndMetadata: (geography_id: UUID) => UUID
  editGeography: (geography: GeographyDomainCreateModel) => GeographyDomainModel
  editGeographyMetadata: (geography: GeographyMetadataDomainCreateModel) => GeographyMetadataDomainModel
  publishGeography: (params: PublishGeographyParams) => GeographyDomainModel
  getGeographiesByIds: (geography_ids: UUID[]) => Nullable<GeographyDomainModel>[]
}

export const GeographyServiceDefinition: RpcServiceDefinition<GeographyService> = {
  getGeography: RpcRoute<GeographyService['getGeography']>(),
  getGeographies: RpcRoute<GeographyService['getGeographies']>(),
  getUnpublishedGeographies: RpcRoute<GeographyService['getUnpublishedGeographies']>(),
  getPublishedGeographies: RpcRoute<GeographyService['getPublishedGeographies']>(),
  writeGeographies: RpcRoute<GeographyService['writeGeographies']>(),
  writeGeographiesMetadata: RpcRoute<GeographyService['writeGeographiesMetadata']>(),
  deleteGeographyAndMetadata: RpcRoute<GeographyService['deleteGeographyAndMetadata']>(),
  editGeography: RpcRoute<GeographyService['editGeography']>(),
  editGeographyMetadata: RpcRoute<GeographyService['editGeographyMetadata']>(),
  publishGeography: RpcRoute<GeographyService['publishGeography']>(),
  getGeographiesByIds: RpcRoute<GeographyService['getGeographiesByIds']>()
}

export type GeographyServiceRequestContext = RpcEmptyRequestContext

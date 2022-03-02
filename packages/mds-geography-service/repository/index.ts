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

import { InsertReturning, ReadWriteRepository, RepositoryError } from '@mds-core/mds-repository'
import { UUID } from '@mds-core/mds-types'
import { AlreadyPublishedError, NotFoundError, testEnvSafeguard } from '@mds-core/mds-utils'
import { FindManyOptions, In, IsNull, MoreThan, Not } from 'typeorm'
import {
  GeographyDomainCreateModel,
  GeographyDomainModel,
  GeographyMetadataDomainCreateModel,
  GeographyMetadataDomainModel,
  GeographyWithMetadataDomainModel,
  GetGeographiesOptions,
  GetPublishedGeographiesOptions,
  PublishGeographyParams
} from '../@types'
import { GeographyEntity } from './entities/geography-entity'
import { GeographyMetadataEntity } from './entities/geography-metadata-entity'
import {
  GeographyDomainToEntityCreate,
  GeographyEntityToDomain,
  GeographyMetadataDomainToEntityCreate,
  GeographyMetadataEntityToDomain
} from './mappers'
import migrations from './migrations'

export const GeographyRepository = ReadWriteRepository.Create(
  'geographies',
  { entities: [GeographyEntity, GeographyMetadataEntity], migrations },
  repository => {
    const getGeographyMetadataMap = async (
      geographies: GeographyDomainModel[]
    ): Promise<Map<GeographyDomainModel['geography_id'], GeographyMetadataDomainModel['geography_metadata']>> => {
      try {
        const connection = await repository.connect('ro')
        return new Map(
          geographies.length > 0
            ? (
                await connection.getRepository(GeographyMetadataEntity).find({
                  where: { geography_id: In(geographies.map(geography => geography.geography_id)) }
                })
              ).map(entity => [entity.geography_id, entity.geography_metadata])
            : []
        )
      } catch (error) /* istanbul ignore next */ {
        throw RepositoryError(error)
      }
    }

    const findGeographies = async (
      where: FindManyOptions<GeographyEntity>['where'],
      { includeMetadata = false, includeGeographyJSON = true, includeHidden = false }: GetGeographiesOptions = {}
    ): Promise<GeographyWithMetadataDomainModel[]> => {
      try {
        const connection = await repository.connect('ro')

        const select = [
          ...(<const>[
            'g.geography_id',
            'g.name',
            'g.description',
            'g.effective_date',
            'g.publish_date',
            'g.prev_geographies'
          ]),
          ...(includeGeographyJSON ? <const>['g.geography_json'] : [])
        ]

        const query = connection
          .getRepository(GeographyEntity)
          .createQueryBuilder('g')
          .select(select)
          .where(where ?? {})

        if (!includeHidden) {
          query
            .leftJoin('geography_metadata', 'gm', 'gm.geography_id = g.geography_id')
            .andWhere(
              "(gm.geography_metadata::json->>'hidden' is null or (gm.geography_metadata::json->'hidden' is not null and (gm.geography_metadata::json->>'hidden')::boolean = false))"
            )
        }

        const entities = await query.getMany()
        const geographies = entities.map(GeographyEntityToDomain.mapper())

        if (includeMetadata) {
          const metadata = await getGeographyMetadataMap(geographies)
          return geographies.map(geography => ({
            ...geography,
            geography_metadata: metadata.get(geography.geography_id) ?? null
          }))
        }

        return geographies
      } catch (error) /* istanbul ignore next */ {
        throw RepositoryError(error)
      }
    }

    const getGeography = async (
      geography_id: GeographyDomainModel['geography_id'],
      options: GetGeographiesOptions
    ): Promise<GeographyWithMetadataDomainModel | undefined> => {
      const [geography = undefined] = await findGeographies({ geography_id }, options)
      return geography
    }

    return {
      getGeography,

      getGeographies: async (options: GetGeographiesOptions) => findGeographies({}, options),

      getUnpublishedGeographies: async (options: GetGeographiesOptions) =>
        findGeographies({ publish_date: IsNull() }, options),

      getPublishedGeographies: async ({ publishedAfter, ...options }: GetPublishedGeographiesOptions) =>
        findGeographies(
          publishedAfter ? { publish_date: MoreThan(publishedAfter) } : { publish_date: Not(IsNull()) },
          options
        ),

      writeGeographies: async (geographies: GeographyDomainCreateModel[]): Promise<GeographyDomainModel[]> => {
        if (geographies.length > 0) {
          try {
            const connection = await repository.connect('rw')

            const { raw: entities = [] }: InsertReturning<GeographyEntity> = await connection
              .getRepository(GeographyEntity)
              .createQueryBuilder()
              .insert()
              .values(geographies.map(GeographyDomainToEntityCreate.mapper()))
              .returning('*')
              .execute()
            return entities.map(GeographyEntityToDomain.mapper())
          } catch (error) {
            throw RepositoryError(error)
          }
        }
        return []
      },

      writeGeographiesMetadata: async (
        metadata: GeographyMetadataDomainCreateModel[]
      ): Promise<GeographyMetadataDomainModel[]> => {
        if (metadata.length > 0) {
          try {
            const connection = await repository.connect('rw')
            const { raw: entities = [] }: InsertReturning<GeographyMetadataEntity> = await connection
              .getRepository(GeographyMetadataEntity)
              .createQueryBuilder()
              .insert()
              .values(metadata.map(GeographyMetadataDomainToEntityCreate.mapper()))
              .onConflict('("geography_id") DO UPDATE SET "geography_metadata" = EXCLUDED."geography_metadata"')
              .returning('*')
              .execute()
            return entities.map(GeographyMetadataEntityToDomain.mapper())
          } catch (error) {
            throw RepositoryError(error)
          }
        }
        return []
      },

      publishGeography: async (params: PublishGeographyParams) => {
        const { geography_id, publish_date = Date.now() } = params
        const existingGeo = await getGeography(geography_id, {})
        if (!existingGeo) {
          throw new NotFoundError('cannot find Geography')
        }
        if (!!existingGeo.publish_date) {
          throw new Error('Cannot edit published Geography')
        }
        try {
          const connection = await repository.connect('rw')
          const {
            raw: [updated]
          } = await connection
            .getRepository(GeographyEntity)
            .createQueryBuilder()
            .update()
            .set({ publish_date })
            .where({ geography_id })
            .andWhere('publish_date IS NULL')
            .returning('*')
            .execute()
          return GeographyEntityToDomain.map(updated)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      editGeography: async (geography: GeographyDomainCreateModel) => {
        const existingGeo = await getGeography(geography.geography_id, {})
        if (!existingGeo) {
          throw new NotFoundError('cannot find Geography')
        }
        if (!!existingGeo.publish_date) {
          throw new Error('Cannot edit published Geography')
        }
        try {
          const { geography_id } = geography
          const connection = await repository.connect('rw')
          const {
            raw: [updated]
          } = await connection
            .getRepository(GeographyEntity)
            .createQueryBuilder()
            .update()
            .set(GeographyDomainToEntityCreate.map(geography))
            .where({ geography_id })
            .andWhere('publish_date IS NULL')
            .returning('*')
            .execute()
          return GeographyEntityToDomain.map(updated)
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      /**
       * Fetches geographies by ids, returns null for ids that don't exist in the database. Note: order is important!
       */
      getGeographiesByIds: async (geographyIds: string[]): Promise<GeographyDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')
          const entities = await connection.getRepository(GeographyEntity).find({
            where: { geography_id: In(geographyIds) }
          })

          return entities.map(GeographyEntityToDomain.mapper())
        } catch (error) /* istanbul ignore next */ {
          throw RepositoryError(error)
        }
      },

      isPublished: (geography: GeographyDomainModel) => {
        return Boolean(geography.publish_date)
      },

      /**
       * Deletes geographyMetadata by geography_id
       * @param geography_id
       * @returns geography_id
       */
      deleteGeographyMetadata: async (geography_id: UUID): Promise<UUID> => {
        try {
          const connection = await repository.connect('rw')
          await connection.getRepository(GeographyMetadataEntity).delete({ geography_id })
          return geography_id
        } catch (err) {
          throw RepositoryError(err)
        }
      },

      /**
       * Deletes geography by geography_id.
       * Throws NotFoundError if does not exist.
       * Throws AlreadyPublishedError if publish date is not null.
       * @param geography_id
       * @returns geography_id
       */
      deleteGeography: async (geography_id: UUID): Promise<UUID> => {
        const existingGeo = await GeographyRepository.getGeography(geography_id, {})
        if (!existingGeo) {
          throw new NotFoundError('cannot find Geography')
        }
        if (GeographyRepository.isPublished(existingGeo)) {
          throw new AlreadyPublishedError('Cannot delete an already published geography')
        }
        try {
          const connection = await repository.connect('rw')
          await connection
            .getRepository(GeographyEntity)
            .createQueryBuilder()
            .delete()
            .where({ geography_id })
            .andWhere('publish_date IS NULL')
            .execute()
          return geography_id
        } catch (err) {
          throw RepositoryError(err)
        }
      },

      /**
       * Nukes everything from orbit. Boom.
       */
      deleteAll: async () => {
        testEnvSafeguard()
        try {
          const connection = await repository.connect('rw')
          await connection
            .getRepository(GeographyEntity)
            .query('TRUNCATE "geographies", "geography_metadata" RESTART IDENTITY')
        } catch (error) {
          throw RepositoryError(error)
        }
      }
    }
  }
)

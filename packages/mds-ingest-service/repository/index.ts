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

import type { InsertReturning } from '@mds-core/mds-repository'
import { ReadWriteRepository, RepositoryError } from '@mds-core/mds-repository'
import type { Nullable, UUID } from '@mds-core/mds-types'
import { head, isDefined, isUUID, tail, testEnvSafeguard, ValidationError, zip } from '@mds-core/mds-utils'
import type { SelectQueryBuilder } from 'typeorm'
import { Any } from 'typeorm'
import type { Cursor, PagingResult } from 'typeorm-cursor-pagination'
import { buildPaginator } from 'typeorm-cursor-pagination'
import type {
  DeviceDomainCreateModel,
  DeviceDomainModel,
  EventAnnotationDomainCreateModel,
  EventAnnotationDomainModel,
  EventDomainCreateModel,
  EventDomainModel,
  GetDeviceOptions,
  GetDevicesOptions,
  GetDevicesResponse,
  GetEventsWithDeviceAndTelemetryInfoOptions,
  GetEventsWithDeviceAndTelemetryInfoResponse,
  GetVehicleEventsFilterParams,
  GetVehicleEventsOrderOption,
  GetVehicleEventsResponse,
  ReadDeviceEventsQueryParams,
  ReadTripEventsQueryParams,
  TelemetryAnnotationDomainCreateModel,
  TelemetryDomainCreateModel,
  TelemetryDomainModel
} from '../@types'
import entities from './entities'
import { DeviceEntity } from './entities/device-entity'
import { EventAnnotationEntity } from './entities/event-annotation-entity'
import { EventEntity } from './entities/event-entity'
import { TelemetryAnnotationEntity } from './entities/telemetry-annotation-entity'
import { TelemetryEntity } from './entities/telemetry-entity'
import {
  DeviceDomainToEntityCreate,
  DeviceEntityToDomain,
  EventAnnotationDomainToEntityCreate,
  EventAnnotationEntityToDomain,
  EventDomainToEntityCreate,
  EventEntityToDomain,
  EventWithDeviceAndTelemetryInfoEntityToDomain,
  TelemetryDomainToEntityCreate,
  TelemetryEntityToDomain
} from './mappers'
import {
  TelemetryAnnotationDomainToEntityCreate,
  TelemetryAnnotationEntityToDomain
} from './mappers/telemetry-annotation-mappers'
import migrations from './migrations'
import views from './views'
import type { EventWithDeviceAndTelemetryInfoEntityModel } from './views/event-with-device-and-telemetry-info'
import { EventWithDeviceAndTelemetryInfoEntity } from './views/event-with-device-and-telemetry-info'

type WithCursorOptions<P extends object> = P & Cursor

const base64encode = (data: string) => Buffer.from(data, 'utf-8').toString('base64')
const base64decode = (data: string) => Buffer.from(data, 'base64').toString('utf-8')

const buildCursor = <T extends {}>(options: WithCursorOptions<T>) => base64encode(JSON.stringify(options))

const parseCursor = <T extends {}>(cursor: string): WithCursorOptions<T> => {
  try {
    return JSON.parse(base64decode(cursor))
  } catch (error) {
    throw new ValidationError('Invalid cursor', error)
  }
}

export const IngestRepository = ReadWriteRepository.Create(
  'ingest',
  { entities: [...entities, ...views], migrations },
  repository => {
    const getEventsWithDeviceAndTelemetryInfo = async ({
      provider_ids,
      device_ids,
      time_range,
      limit = 100,
      follow = false,
      ...cursor
    }: WithCursorOptions<GetEventsWithDeviceAndTelemetryInfoOptions>): Promise<GetEventsWithDeviceAndTelemetryInfoResponse> => {
      const paginationKeys: Array<keyof EventWithDeviceAndTelemetryInfoEntityModel> = ['id']

      const buildPrevCursor = (
        options: GetEventsWithDeviceAndTelemetryInfoOptions,
        nextBeforeCursor: Nullable<string>,
        entities: EventWithDeviceAndTelemetryInfoEntityModel[]
      ) =>
        nextBeforeCursor === null && options.follow && entities.length > 0
          ? buildCursor<GetEventsWithDeviceAndTelemetryInfoOptions>({
              ...options,
              beforeCursor: base64encode(paginationKeys.map(key => `${key}:${head(entities)[key]}`).join(',')),
              afterCursor: null
            })
          : nextBeforeCursor &&
            buildCursor<GetEventsWithDeviceAndTelemetryInfoOptions>({
              ...options,
              beforeCursor: nextBeforeCursor,
              afterCursor: null
            })

      const buildNextCursor = (
        options: GetEventsWithDeviceAndTelemetryInfoOptions,
        nextAfterCursor: Nullable<string>,
        entities: EventWithDeviceAndTelemetryInfoEntityModel[]
      ) =>
        nextAfterCursor === null && options.follow && entities.length > 0
          ? buildCursor<GetEventsWithDeviceAndTelemetryInfoOptions>({
              ...options,
              beforeCursor: null,
              afterCursor: base64encode(paginationKeys.map(key => `${key}:${tail(entities)[key]}`).join(','))
            })
          : nextAfterCursor &&
            buildCursor<GetEventsWithDeviceAndTelemetryInfoOptions>({
              ...options,
              beforeCursor: null,
              afterCursor: nextAfterCursor
            })

      try {
        const connection = await repository.connect('ro')

        const query = connection.getRepository(EventWithDeviceAndTelemetryInfoEntity).createQueryBuilder('events')

        if (provider_ids?.length) {
          query.andWhere('provider_id = ANY(:provider_ids)', { provider_ids })
        }

        if (device_ids?.length) {
          query.andWhere('device_id = ANY(:device_ids)', { device_ids })
        }

        if (time_range?.start) {
          query.andWhere('timestamp >= :start', time_range)
        }

        if (time_range?.end) {
          query.andWhere('timestamp <= :end', time_range)
        }

        const {
          data: entities,
          cursor: { beforeCursor: nextBeforeCursor, afterCursor: nextAfterCursor }
        } = await buildPaginator({
          alias: query.alias,
          entity: EventWithDeviceAndTelemetryInfoEntity,
          query: {
            limit,
            order: 'ASC',
            afterCursor: cursor.afterCursor ?? undefined,
            beforeCursor: cursor.beforeCursor ?? undefined
          },
          paginationKeys
        }).paginate(query)

        const options = { limit, follow, time_range, provider_ids, device_ids }

        return {
          events: entities.map(EventWithDeviceAndTelemetryInfoEntityToDomain.mapper()),
          cursor: {
            prev: buildPrevCursor(options, nextBeforeCursor, entities),
            next: buildNextCursor(options, nextAfterCursor, entities)
          }
        }
      } catch (error) {
        throw RepositoryError(error)
      }
    }

    const createTelemetriesEntityReturning = async (telemetries: TelemetryDomainCreateModel[]) => {
      try {
        const connection = await repository.connect('rw')
        const { raw: entities }: InsertReturning<TelemetryEntity> = await connection
          .getRepository(TelemetryEntity)
          .createQueryBuilder()
          .insert()
          .values(telemetries.map(TelemetryDomainToEntityCreate.mapper()))
          .returning('*')
          .execute()
        return entities
      } catch (error) {
        throw RepositoryError(error)
      }
    }
    const getDevicesQuery = async ({
      limit = 100,
      provider_id,
      beforeCursor,
      afterCursor
    }: WithCursorOptions<GetDevicesOptions>): Promise<GetDevicesResponse> => {
      try {
        const connection = await repository.connect('ro')
        const query = connection.createQueryBuilder(DeviceEntity, 'device')
        if (isDefined(provider_id)) {
          query.where('device.provider_id = :provider_id', { provider_id })
        }

        const pager = buildPaginator({
          entity: DeviceEntity,
          alias: 'device',
          paginationKeys: ['recorded', 'id'],
          query: {
            limit,
            beforeCursor: beforeCursor ?? undefined,
            afterCursor: afterCursor ?? undefined
          }
        })

        const {
          data,
          cursor: { beforeCursor: nextBeforeCursor, afterCursor: nextAfterCursor }
        } = await pager.paginate(query)

        const cursor = { limit }

        return {
          devices: data.map(DeviceEntityToDomain.mapper()),
          cursor: {
            prev:
              nextBeforeCursor &&
              buildCursor<GetDevicesOptions>({ ...cursor, beforeCursor: nextBeforeCursor, afterCursor: null }),
            next:
              nextAfterCursor &&
              buildCursor<GetDevicesOptions>({ ...cursor, beforeCursor: null, afterCursor: nextAfterCursor })
          }
        }
      } catch (error) {
        throw RepositoryError(error)
      }
    }
    const getEvents = async (
      params: WithCursorOptions<GetVehicleEventsFilterParams>
    ): Promise<GetVehicleEventsResponse> => {
      const {
        time_range,
        geography_ids,
        grouping_type = 'latest_per_vehicle',
        event_types,
        vehicle_states,
        vehicle_types,
        vehicle_id,
        device_ids,
        propulsion_types,
        provider_ids,
        limit = 100,
        beforeCursor,
        afterCursor,
        order
      } = params

      try {
        const connection = await repository.connect('ro')

        const query = connection
          .getRepository(EventEntity)
          .createQueryBuilder('events')
          .innerJoin(qb => qb.from(DeviceEntity, 'd'), 'devices', 'devices.device_id = events.device_id')
          .innerJoinAndMapOne(
            'events.telemetry',
            TelemetryEntity,
            'telemetry',
            'telemetry.device_id = events.device_id AND telemetry.timestamp = events.telemetry_timestamp'
          )

        if (geography_ids) {
          query.innerJoin('events.annotation', 'annotation', 'annotation.geography_ids && :geography_ids', {
            geography_ids
          })
        } else {
          query.leftJoinAndSelect('events.annotation', 'annotation')
        }

        if (grouping_type === 'latest_per_vehicle') {
          query.innerJoin(
            qb => {
              const subquery = qb
                .select(
                  'device_id, id as event_id, RANK() OVER (PARTITION BY device_id ORDER BY timestamp DESC) AS rownum'
                )
                .from(EventEntity, 'e')
              return time_range ? subquery.where('timestamp >= :start AND timestamp <= :end', time_range) : subquery
            },
            'last_device_event',
            'last_device_event.event_id = events.id AND last_device_event.rownum = 1'
          )
        }

        if (grouping_type === 'latest_per_trip') {
          query.innerJoin(
            qb => {
              const subquery = qb
                .select('trip_id, id as event_id, RANK() OVER (PARTITION BY trip_id ORDER BY timestamp DESC) AS rownum')
                .from(EventEntity, 'e')
              return time_range ? subquery.where('timestamp >= :start AND timestamp <= :end', time_range) : subquery
            },
            'last_trip_event',
            'last_trip_event.event_id = events.id AND last_trip_event.rownum = 1'
          )
        }

        if (grouping_type === 'all_events' && time_range) {
          query.andWhere('events.timestamp >= :start AND events.timestamp <= :end', time_range)
        }

        if (event_types) {
          query.andWhere('events.event_types && :event_types', { event_types })
        }

        if (propulsion_types) {
          query.andWhere('devices.propulsion_types && :propulsion_types', { propulsion_types })
        }

        if (device_ids) {
          query.andWhere('events.device_id = ANY(:device_ids)', { device_ids })
        }

        if (vehicle_types) {
          query.andWhere('devices.vehicle_type = ANY(:vehicle_types)', { vehicle_types })
        }

        if (vehicle_states) {
          query.andWhere('events.vehicle_state = ANY(:vehicle_states)', { vehicle_states })
        }

        if (vehicle_id) {
          query.andWhere('lower(devices.vehicle_id) = :vehicle_id', { vehicle_id: vehicle_id.toLowerCase() })
        }

        if (provider_ids && provider_ids.every(isUUID)) {
          query.andWhere('events.provider_id = ANY(:provider_ids)', { provider_ids })
        }

        const {
          data,
          cursor: { beforeCursor: nextBeforeCursor, afterCursor: nextAfterCursor }
        } = await paginateEventTelemetry(query, limit, beforeCursor, afterCursor, order)

        const cursor = {
          time_range,
          geography_ids,
          grouping_type,
          event_types,
          vehicle_states,
          vehicle_types,
          vehicle_id,
          device_ids,
          propulsion_types,
          provider_ids,
          limit,
          order
        }

        return {
          events: data.map(EventEntityToDomain.mapper()),
          cursor: {
            prev:
              nextBeforeCursor &&
              buildCursor<GetVehicleEventsFilterParams>({
                ...cursor,
                beforeCursor: nextBeforeCursor,
                afterCursor: null
              }),
            next:
              nextAfterCursor &&
              buildCursor<GetVehicleEventsFilterParams>({
                ...cursor,
                beforeCursor: null,
                afterCursor: nextAfterCursor
              })
          }
        }
      } catch (error) {
        throw RepositoryError(error)
      }
    }

    /**
     * TypeORM does not handle joined-models and pagination very well, at all.
     * The second you supply a .take(N) value, it follows a completely different builder plan
     * to generate your results in a two-phase query. The results were at least 100x slower
     * than just doing a join and parsing the objects.
     *
     * this method is yanked from the `typeorm-cursor-pagination/Paginator.paginate()` source,
     * and avoids calling .getMany()
     */
    const paginateEventTelemetry = async (
      query: SelectQueryBuilder<EventEntity>,
      limit: number,
      beforeCursor: string | null,
      afterCursor: string | null,
      order?: GetVehicleEventsOrderOption
    ): Promise<PagingResult<EventEntity>> => {
      const pager = buildPaginator({
        entity: EventEntity,
        alias: 'events',
        paginationKeys: [order?.column ?? 'timestamp', 'id'],
        query: {
          limit,
          order: order?.direction ?? (order?.column === undefined ? 'DESC' : 'ASC'),
          beforeCursor: beforeCursor ?? undefined, // typeorm-cursor-pagination type weirdness
          afterCursor: afterCursor ?? undefined // typeorm-cursor-pagination type weirdness
        }
      })

      /* you have to manually declare a limit, since we're skipping the .take() call that normally happens in .getMany() */
      query.limit(limit + 1)
      const pagedQuery: SelectQueryBuilder<{
        event: EventEntity
        telemetry: TelemetryEntity
        annotation: EventAnnotationEntity
      }> = pager['appendPagingQuery'](query)
      /**
       * results are selected as JSON, so that we can skip the TypeORM entity builder.
       */
      pagedQuery.select(
        'row_to_json(events.*) as event, row_to_json(telemetry.*) as telemetry, row_to_json(annotation.*) as annotation'
      )
      const results: { event: EventEntity; telemetry: TelemetryEntity; annotation: EventAnnotationEntity }[] =
        await pagedQuery.getRawMany()
      const entities = results.map(({ event, telemetry, annotation }) => ({ ...event, telemetry, annotation }))
      const hasMore = entities.length > (limit || 100)
      if (hasMore) {
        entities.splice(entities.length - 1, 1)
      }
      if (entities.length === 0) {
        return pager['toPagingResult'](entities)
      }
      if (!pager['hasAfterCursor']() && pager['hasBeforeCursor']()) {
        entities.reverse()
      }
      if (pager['hasBeforeCursor']() || hasMore) {
        pager['nextAfterCursor'] = pager['encode'](entities[entities.length - 1])
      }
      if (pager['hasAfterCursor']() || (hasMore && pager['hasBeforeCursor']())) {
        pager['nextBeforeCursor'] = pager['encode'](entities[0])
      }
      return pager['toPagingResult'](entities) as PagingResult<EventEntity>
    }

    return {
      createEvents: async (events: EventDomainCreateModel[]): Promise<EventDomainModel[]> => {
        try {
          const telemetryEntities = await createTelemetriesEntityReturning(events.map(({ telemetry }) => telemetry))

          const connection = await repository.connect('rw')
          const { raw: eventEntities }: InsertReturning<EventEntity> = await connection
            .getRepository(EventEntity)
            .createQueryBuilder()
            .insert()
            .values(events.map(EventDomainToEntityCreate.mapper()))
            .returning('*')
            .execute()

          return zip(eventEntities, telemetryEntities, (event, telemetry) =>
            EventEntityToDomain.map({
              ...event,
              telemetry
            })
          )
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createTelemetries: async (telemetries: TelemetryDomainCreateModel[]) => {
        try {
          const entities = await createTelemetriesEntityReturning(telemetries)
          return entities.map(TelemetryEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createTelemetryAnnotations: async (telemetryAnnotations: TelemetryAnnotationDomainCreateModel[]) => {
        try {
          const connection = await repository.connect('rw')
          const { raw: entities }: InsertReturning<TelemetryAnnotationEntity> = await connection
            .getRepository(TelemetryAnnotationEntity)
            .createQueryBuilder()
            .insert()
            .values(telemetryAnnotations.map(TelemetryAnnotationDomainToEntityCreate.mapper()))
            .returning('*')
            .execute()

          return entities.map(TelemetryAnnotationEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createDevices: async (events: DeviceDomainCreateModel[]) => {
        try {
          const connection = await repository.connect('rw')
          const { raw: entities }: InsertReturning<DeviceEntity> = await connection
            .getRepository(DeviceEntity)
            .createQueryBuilder()
            .insert()
            .values(events.map(DeviceDomainToEntityCreate.mapper()))
            .returning('*')
            .execute()
          return entities.map(DeviceEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      createEventAnnotations: async (
        eventAnnotations: EventAnnotationDomainCreateModel[]
      ): Promise<EventAnnotationDomainModel[]> => {
        try {
          const connection = await repository.connect('rw')
          const { raw: entities }: InsertReturning<EventAnnotationEntity> = await connection
            .getRepository(EventAnnotationEntity)
            .createQueryBuilder()
            .insert()
            .values(eventAnnotations.map(EventAnnotationDomainToEntityCreate.mapper()))
            .returning('*')
            .execute()
          return entities.map(EventAnnotationEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getDevices: async (device_ids: UUID[]): Promise<DeviceDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')
          const entities = await connection
            .getRepository(DeviceEntity)
            .find(device_ids ? { where: { device_id: Any(device_ids) } } : {})
          return entities.map(DeviceEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getDevice: async (options: GetDeviceOptions): Promise<DeviceDomainModel | undefined> => {
        try {
          const { device_id, provider_id } = options
          const connection = await repository.connect('ro')
          const query = connection
            .getRepository(DeviceEntity)
            .createQueryBuilder('devices')
            .where('"device_id" = :device_id', { device_id })

          if (provider_id) {
            query.andWhere('"provider_id" = :provider_id', { provider_id })
          }

          const entity = await query.getOne()
          if (isDefined(entity)) {
            return DeviceEntityToDomain.map(entity)
          }
          return entity
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getDevicesUsingOptions: async (options: GetDevicesOptions): Promise<GetDevicesResponse> =>
        getDevicesQuery({ ...options, beforeCursor: null, afterCursor: null }),

      getDevicesUsingCursor: async (cursor: string): Promise<GetDevicesResponse> =>
        getDevicesQuery(parseCursor<GetDevicesOptions>(cursor)),

      getEventsUsingOptions: async (options: GetVehicleEventsFilterParams): Promise<GetVehicleEventsResponse> =>
        getEvents({ ...options, beforeCursor: null, afterCursor: null, limit: options.limit ?? 100 }),

      getEventsUsingCursor: async (cursor: string): Promise<GetVehicleEventsResponse> =>
        getEvents(parseCursor<GetVehicleEventsFilterParams>(cursor)),

      getTripEvents: async (params: ReadTripEventsQueryParams) => {
        const { skip, take = 100, start_time, end_time, provider_id } = params
        try {
          const connection = await repository.connect('rw')
          const tripIdQuery = connection
            .getRepository(EventEntity)
            .createQueryBuilder()
            .select('distinct trip_id')
            .limit(take)

          if (start_time) tripIdQuery.where('timestamp >= :start_time', { start_time })
          if (end_time) tripIdQuery.andWhere('timestamp <= :end_time', { end_time })
          if (provider_id) tripIdQuery.andWhere('provider_id = :provider_id', { provider_id })
          if (skip) tripIdQuery.andWhere('trip_id > :skip', { skip })

          const bigQuery = connection
            .createQueryBuilder()
            .select('et.trip_id, array_agg(row_to_json(et.*) ORDER BY et.timestamp) AS events')
            .from(
              qb =>
                qb
                  .select('e.*, to_json(t.*) AS telemetry')
                  .from('events', 'e')
                  .innerJoin(
                    'telemetry',
                    't',
                    `e.device_id = t.device_id AND e.telemetry_timestamp = t.timestamp AND e.trip_id IN (${tripIdQuery.getQuery()})`
                  ),
              'et'
            )
            .setParameters(tripIdQuery.getParameters())
            .groupBy('et.trip_id')
            .orderBy('et.trip_id')

          const entities: { trip_id: UUID; events: EventEntity[] }[] = await bigQuery.execute()

          return entities.reduce<Record<UUID, EventDomainModel[]>>((acc, { trip_id, events }) => {
            const mappedEvents = events.map(EventEntityToDomain.map)
            return Object.assign(acc, { [trip_id]: mappedEvents })
          }, {})
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getDeviceEvents: async (params: ReadDeviceEventsQueryParams) => {
        const { skip, take = 100, start_time, end_time, provider_id } = params
        try {
          const connection = await repository.connect('rw')

          const bigQuery = connection
            .createQueryBuilder()
            .select('et.device_id, array_agg(row_to_json(et.*) ORDER BY et.timestamp) AS events')
            .from(qb => {
              /**
               * JOIN events and telemetry
               */
              qb.select('e.*, to_json(t.*) AS telemetry')
                .from('events', 'e')
                .innerJoin('telemetry', 't', `e.device_id = t.device_id AND e.telemetry_timestamp = t.timestamp`)

              /**
               * Add query filters
               */
              if (start_time) qb.where('e.timestamp >= :start_time', { start_time })
              if (end_time) qb.andWhere('e.timestamp <= :end_time', { end_time })
              if (provider_id) qb.andWhere('e.provider_id = :provider_id', { provider_id })
              if (skip) qb.andWhere('e.device_id > :skip', { skip })

              return qb
            }, 'et')
            .groupBy('et.device_id')
            .orderBy('et.device_id')
            .limit(take)

          const entities: { device_id: UUID; events: EventEntity[] }[] = await bigQuery.execute()

          return entities.reduce<Record<UUID, EventDomainModel[]>>((acc, { device_id, events }) => {
            const mappedEvents = events.map(EventEntityToDomain.map)
            return Object.assign(acc, { [device_id]: mappedEvents })
          }, {})
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getLatestTelemetryForDevices: async (device_ids: UUID[]): Promise<TelemetryDomainModel[]> => {
        try {
          const connection = await repository.connect('ro')

          /**
           * Run the query within a transaction so we can safely disable bitmapscan
           * https://github.com/typeorm/typeorm/blob/master/docs/transactions.md
           */
          const entities = await connection.transaction(async manager => {
            await manager.query(`select set_config('enable_bitmapscan','off', true)`)
            return await manager
              .createQueryBuilder(TelemetryEntity, 'telemetry')
              .distinctOn(['device_id'])
              .orderBy('device_id', 'DESC')
              .addOrderBy('timestamp', 'DESC')
              .where('device_id = ANY (:device_ids)', { device_ids })
              .getMany()
          })

          return entities.map(TelemetryEntityToDomain.mapper())
        } catch (error) {
          throw RepositoryError(error)
        }
      },

      getEventsWithDeviceAndTelemetryInfoUsingOptions: async (
        options: GetEventsWithDeviceAndTelemetryInfoOptions
      ): Promise<GetEventsWithDeviceAndTelemetryInfoResponse> =>
        getEventsWithDeviceAndTelemetryInfo({ ...options, beforeCursor: null, afterCursor: null }),

      getEventsWithDeviceAndTelemetryInfoUsingCursor: async (
        cursor: string
      ): Promise<GetEventsWithDeviceAndTelemetryInfoResponse> =>
        getEventsWithDeviceAndTelemetryInfo(parseCursor<GetEventsWithDeviceAndTelemetryInfoOptions>(cursor)),

      /**
       * Nukes everything from orbit. Boom.
       */

      deleteAll: async () => {
        testEnvSafeguard()
        try {
          const connection = await repository.connect('rw')
          await connection
            .getRepository(EventEntity)
            .query('TRUNCATE "events", "devices", "telemetry", "event_annotations" RESTART IDENTITY')
        } catch (error) {
          throw RepositoryError(error)
        }
      }
    }
  }
)

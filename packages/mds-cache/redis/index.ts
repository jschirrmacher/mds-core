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

import type { Nullable, Timestamp, TimestampInSeconds } from '@mds-core/mds-types'
import { ClientDisconnectedError, ExceptionMessages, isDefined } from '@mds-core/mds-utils'
import type Redis from 'ioredis'
import type { RedisKey, RedisValue } from 'ioredis'
import type { OrderedFields } from '../@types'
import { initClient } from './helpers/client'

export type ExpireAtOptions = {
  key: RedisKey
  timeInSeconds?: TimestampInSeconds
  timeInMs?: Timestamp
}

export const RedisCache = () => {
  let client: Nullable<Redis> = null

  /**
   * If the client is defined, the closure is called, otherwise throws an error
   * @param exec called with a Redis client, returns the result
   * @returns same as what the exec returns
   * @throws ClientDisconnectedError
   */
  const safelyExec = async <T>(exec: (theClient: Redis) => T) => {
    if (isDefined(client)) {
      return exec(client)
    }
    throw new ClientDisconnectedError(ExceptionMessages.INITIALIZE_CLIENT_MESSAGE)
  }

  return {
    initialize: async () => {
      if (client) {
        await client.disconnect()
      }
      client = await initClient()
    },
    shutdown: async () => {
      if (isDefined(client)) {
        client.disconnect()
      }
      client = null
    },
    multi: async () => safelyExec(theClient => theClient.multi()),

    get: async (key: RedisKey) => safelyExec(theClient => theClient.get(key)),

    mget: async (keys: RedisKey[]) => safelyExec(theClient => theClient.mget(keys)),

    set: async (key: RedisKey, val: RedisValue) => safelyExec(theClient => theClient.set(key, val)),

    mset: async (data: { [key: string]: RedisValue } | string[]) => safelyExec(theClient => theClient.mset(data)),

    /**
     * Expires a key at Unix time in seconds, or time in milliseconds.
     * Don't add both parameters, only one of them will be used.
     */
    expireat: async (options: ExpireAtOptions) => {
      const { key, timeInSeconds, timeInMs } = options
      if (timeInSeconds) {
        return safelyExec(theClient => theClient.expireat(key, timeInSeconds))
      }
      if (timeInMs) {
        return safelyExec(theClient => theClient.pexpireat(key, timeInMs))
      }
    },

    dbsize: async () => safelyExec(theClient => theClient.dbsize()),

    del: async (...keys: RedisKey[]) => safelyExec(theClient => theClient.del(keys)),

    flushdb: async () => safelyExec(theClient => theClient.flushdb()),

    sadd: async (key: RedisKey, val: RedisValue) => safelyExec(theClient => theClient.sadd(key, val)),

    srem: async (key: RedisKey, val: RedisValue) => safelyExec(theClient => theClient.srem(key, val)),

    smembers: async (key: RedisKey) => safelyExec(theClient => theClient.smembers(key)),

    lpush: async (key: RedisKey, val: RedisValue) => safelyExec(theClient => theClient.lpush(key, val)),

    rpush: async (key: RedisKey, val: RedisValue) => safelyExec(theClient => theClient.rpush(key, val)),

    lrange: async (key: RedisKey, min: number, max: number) => safelyExec(theClient => theClient.lrange(key, min, max)),

    hset: async (
      key: RedisKey,
      ...data: [{ [key: string]: RedisValue }] | [RedisKey, RedisValue][] | [RedisKey, RedisValue]
    ) => {
      /* We need to do tons of type coercion in here due to poor typing in DefinitelyTyped... I am so sorry. */
      const isTupleArr = (d: unknown[]): d is [RedisKey, RedisValue][] => Array.isArray(d[0])

      const isSingleTuple = (d: unknown[]): d is [RedisKey, RedisValue] => typeof d[0] === 'string'

      return safelyExec(theClient => {
        if (isTupleArr(data)) {
          const args = [key, ...data.flat()] as [key: RedisKey, field: string, value: RedisValue]
          return theClient.hset(...args)
        }

        if (isSingleTuple(data)) {
          const args = [key, ...data] as [key: RedisKey, field: string, value: RedisValue]
          return theClient.hset(...args)
        }

        const [first] = data
        const args = [key, first] as unknown as [key: RedisKey, field: string, value: RedisValue]
        return theClient.hset(...args)
      })
    },
    hmset: async (key: RedisKey, data: { [key: string]: RedisValue }) =>
      safelyExec(theClient => theClient.hmset(key, data)),

    hdel: async (key: RedisKey, ...fields: RedisKey[]) => safelyExec(theClient => theClient.hdel(key, ...fields)),

    hgetall: async (key: RedisKey) => safelyExec(theClient => theClient.hgetall(key)),

    info: async () => safelyExec(theClient => theClient.info()),

    keys: async (pattern: string) => safelyExec(theClient => theClient.keys(pattern)),

    zadd: async (key: RedisKey, fields: OrderedFields | (string | number)[]) =>
      safelyExec(theClient => {
        const entries: (string | number)[] = !Array.isArray(fields)
          ? Object.entries(fields).reduce((acc: (number | string)[], [field, value]) => [...acc, value, field], [])
          : fields
        return theClient.zadd(key, ...entries)
      }),

    zrem: async (key: RedisKey, val: RedisValue) => safelyExec(theClient => theClient.zrem(key, val)),

    zrangebyscore: async (key: RedisKey, min: string | number, max: string | number) =>
      safelyExec(theClient => theClient.zrangebyscore(key, min, max)),

    zremrangebyscore: async (key: RedisKey, min: string | number, max: string | number) =>
      safelyExec(theClient => theClient.zremrangebyscore(key, min, max)),

    geoadd: async (key: RedisKey, longitude: number, latitude: number, member: RedisKey) =>
      safelyExec(theClient => theClient.geoadd(key, longitude, latitude, member)),

    georadius: async (key: RedisKey, longitude: number, latitude: number, radius: number, unit: string) =>
      safelyExec(theClient => theClient.georadius(key, longitude, latitude, radius, unit)),

    /* TODO: Improve multi call response structure */
    multihgetall: async (key: RedisKey) => safelyExec(theClient => theClient.multi().hgetall(key).exec())
  }
}

export type RedisCache = ReturnType<typeof RedisCache>

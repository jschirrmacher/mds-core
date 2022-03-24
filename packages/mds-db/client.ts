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

import AwaitLock from 'await-lock'
import { DbLogger } from './logger'
import type { MDSPostgresClient, SqlVals } from './sql-utils'
import { configureClient, logSql } from './sql-utils'

const { env } = process

let writeableCachedClient: MDSPostgresClient | null = null
let readOnlyCachedClient: MDSPostgresClient | null = null

async function setupClient(useWriteable: boolean): Promise<MDSPostgresClient> {
  const { PG_HOST, PG_HOST_READER, PG_NAME, PG_PASS, PG_PASS_READER, PG_PORT, PG_USER, PG_USER_READER } = env

  const info = {
    client_type: useWriteable ? 'writeable' : 'readonly',
    database: PG_NAME,
    user: (useWriteable ? PG_USER : PG_USER_READER) || PG_USER,
    host: (useWriteable ? PG_HOST : PG_HOST_READER) || PG_HOST || 'localhost',
    port: Number(PG_PORT) || 5432
  }

  DbLogger.info('connecting to postgres', { info })

  const client = configureClient({ ...info, password: (useWriteable ? PG_PASS : PG_PASS_READER) || PG_PASS })

  try {
    await client.connect()
    client.setConnected(true)
    return client
  } catch (error) {
    DbLogger.error('postgres connection error', { error })
    client.setConnected(false)
    throw error
  }
}

const readOnlyClientLock = new AwaitLock()
export async function getReadOnlyClient(): Promise<MDSPostgresClient> {
  await readOnlyClientLock.acquireAsync()
  try {
    if (!readOnlyCachedClient || !readOnlyCachedClient.connected) {
      readOnlyCachedClient = await setupClient(false)
    }
    return readOnlyCachedClient
  } catch (error) {
    readOnlyCachedClient = null
    DbLogger.error('postgres connection error', { error })
    throw error
  } finally {
    readOnlyClientLock.release()
  }
}

const writeableClientLock = new AwaitLock()
export async function getWriteableClient(): Promise<MDSPostgresClient> {
  await writeableClientLock.acquireAsync()
  try {
    if (!writeableCachedClient || !writeableCachedClient.connected) {
      writeableCachedClient = await setupClient(true)
    }
    return writeableCachedClient
  } catch (error) {
    writeableCachedClient = null
    DbLogger.error('postgres connection error', { error })
    throw error
  } finally {
    writeableClientLock.release()
  }
}

// This should never be exported outside of this package, to prevent risk of SQL injection.
// Only functions in this module should ever call it.

/* eslint-reason ambigous helper function that wraps a query as Readonly */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function makeReadOnlyQuery(sql: string, vals?: SqlVals): Promise<any[]> {
  try {
    const values = vals?.values()
    const client = await getReadOnlyClient()
    await logSql(sql)
    const result = await client.query(sql, values)
    return result.rows
  } catch (error) {
    DbLogger.error(`error with SQL query ${sql}`, { error })
    throw error
  }
}

export async function getLatestTime(table: string, field: string): Promise<number> {
  const client = await getReadOnlyClient()

  const sql = `SELECT ${field} FROM ${table} ORDER BY ${field} DESC LIMIT 1`

  await logSql(sql)
  const res = await client.query(sql)
  if (res.rows.length === 1) {
    return res.rows[0][field] as number
  }
  return 0 // no latest trip time, start from Dawn Of Time
}

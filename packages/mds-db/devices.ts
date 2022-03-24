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

import type { DeviceDomainCreateModel, DeviceDomainModel } from '@mds-core/mds-ingest-service'
import { IngestServiceClient } from '@mds-core/mds-ingest-service'
import type { DeviceID, UUID } from '@mds-core/mds-types'
import { csv, isDefined, isUUID, NotFoundError, now } from '@mds-core/mds-utils'
import type { QueryResult } from 'pg'
import { getReadOnlyClient, getWriteableClient } from './client'
import { DbLogger } from './logger'
import schema from './schema'
import { cols_sql, logSql, SqlVals, vals_list, vals_sql } from './sql-utils'

export async function readDevicesByVehicleId(
  provider_id: UUID,
  vehicle_id: UUID,
  ...alternate_vehicle_ids: UUID[]
): Promise<DeviceDomainModel[]> {
  const client = await getReadOnlyClient()
  const vehicle_ids = [...new Set([vehicle_id, ...alternate_vehicle_ids])]
  const vals = new SqlVals()
  const sql = `SELECT * FROM ${schema.TABLE.devices} WHERE provider_id=${vals.add(
    provider_id
  )} AND translate(vehicle_id, translate(lower(vehicle_id), 'abcdefghijklmnopqrstuvwxyz1234567890', ''), '') ILIKE ANY(ARRAY[${vehicle_ids
    .map(id => vals.add(id))
    .join(', ')}]) ORDER BY "id" DESC`

  const values = vals.values()
  await logSql(sql, values)
  const result = await client.query(sql, values)
  if (result.rows.length !== 1) {
    const error = `device associated with vehicle ${
      vehicle_ids.length === 1 ? vehicle_id : `(${csv(vehicle_ids)})`
    } for provider ${provider_id}: rows=${result.rows.length}`
    DbLogger.warn(error)
  }
  if (result.rows.length === 0) {
    throw new NotFoundError('No device found', { provider_id, vehicle_ids })
  }
  return result.rows as DeviceDomainModel[]
}

export async function readDeviceIds(provider_id?: UUID, skip?: number, take?: number): Promise<DeviceID[]> {
  // read from pg
  const client = await getReadOnlyClient()
  let sql = `SELECT device_id, provider_id FROM ${schema.TABLE.devices}`
  const vals = new SqlVals()
  if (isUUID(provider_id)) {
    sql += ` WHERE provider_id= ${vals.add(provider_id)}`
  }
  sql += ' ORDER BY recorded'
  if (typeof skip === 'number' && skip >= 0) {
    sql += ` OFFSET ${vals.add(skip)}`
  }
  if (typeof take === 'number' && take >= 0) {
    sql += ` LIMIT ${vals.add(take)}`
  }
  const values = vals.values()
  await logSql(sql, values)
  const res = await client.query(sql, values)
  return res.rows
}

export async function readDeviceList(device_ids: UUID[]): Promise<DeviceDomainModel[]> {
  if (device_ids.length === 0) {
    return []
  }
  const client = await getReadOnlyClient()
  const vals = new SqlVals()
  const sql = `SELECT * FROM ${schema.TABLE.devices} WHERE device_id IN (${device_ids.map(device_id =>
    vals.add(device_id)
  )})`
  const values = vals.values()
  await logSql(sql, values)
  const result = await client.query(sql, values)
  return result.rows
}

export async function writeDevice(device: DeviceDomainModel): Promise<DeviceDomainModel> {
  const client = await getWriteableClient()
  const sql = `INSERT INTO ${schema.TABLE.devices} (${cols_sql(schema.TABLE_COLUMNS.devices)}) VALUES (${vals_sql(
    schema.TABLE_COLUMNS.devices
  )}) RETURNING *`
  const values = vals_list(schema.TABLE_COLUMNS.devices, { ...device, recorded: now() })
  await logSql(sql, values)
  const {
    rows: [recorded_device]
  }: { rows: DeviceDomainModel[] } = await client.query(sql, values)

  if (!recorded_device) {
    throw new Error('Failed to write device')
  }

  return { ...device, ...recorded_device }
}

export async function updateDevice(
  device_id: UUID,
  provider_id: UUID,
  changes: Partial<DeviceDomainCreateModel>
): Promise<DeviceDomainModel> {
  const client = await getWriteableClient()

  const sql = `UPDATE ${schema.TABLE.devices} SET vehicle_id = $1 WHERE device_id = $2`
  const values = [changes.vehicle_id, device_id]
  await logSql(sql, values)
  const res = await client.query(sql, values)

  if (res.rowCount === 0) {
    throw new NotFoundError('not found')
  } else {
    const device = await IngestServiceClient.getDevice({ device_id, provider_id })
    if (!isDefined(device)) {
      throw new NotFoundError(`device_id ${device_id} not found`)
    }

    return device
  }
}

export async function wipeDevice(device_id: UUID): Promise<QueryResult> {
  const client = await getWriteableClient()
  const sql =
    `BEGIN;` +
    ` DELETE FROM ${schema.TABLE.devices} WHERE device_id='${device_id}';` +
    ` DELETE FROM ${schema.TABLE.telemetry} WHERE device_id='${device_id}';` +
    ` DELETE FROM ${schema.TABLE.events} WHERE device_id='${device_id}';` +
    ` COMMIT;`
  await logSql(sql)
  const res = await client.query(sql)
  // this returns a list of objects that represent the commands that just ran
  return res
}

import {
  UUID,
  MDSPolicy,
  Timestamp,
  Recorded,
  MDSPolicyMetadata,
  Nullable,
  MDSBaseRule,
  RULE_TYPE,
  BasePolicy,
  BaseRule,
  VEHICLE_STATE,
  VEHICLE_EVENT
} from '@mds-core/mds-types'
import {
  now,
  NotFoundError,
  BadParamsError,
  AlreadyPublishedError,
  DependencyMissingError,
  ConflictError
} from '@mds-core/mds-utils'
import logger from '@mds-core/mds-logger'

import schema from './schema'

import { vals_sql, cols_sql, vals_list, SqlVals } from './sql-utils'

import { isGeographyPublished } from './geographies'
import { getReadOnlyClient, getWriteableClient } from './client'

export async function readPolicies<
  S extends string,
  E extends string,
  RuleType extends RULE_TYPE,
  R extends BaseRule<S, E, RuleType>,
  P extends BasePolicy<S, E, RuleType, R> // <S, E, RuleType, R>
>(params?: {
  policy_id?: UUID
  rule_id?: UUID
  name?: string
  description?: string
  start_date?: Timestamp
  get_unpublished?: Nullable<boolean>
  get_published?: Nullable<boolean>
}): Promise<P[]> {
  // use params to filter
  // query
  // return policies
  const client = await getReadOnlyClient()

  // TODO more params
  let sql = `select * from ${schema.TABLE.policies}`
  const conditions = []
  const vals = new SqlVals()
  if (params) {
    if (params.policy_id) {
      conditions.push(`policy_id = ${vals.add(params.policy_id)}`)
    }

    if (params.rule_id) {
      conditions.push(
        `EXISTS(SELECT FROM json_array_elements(policy_json->'rules') elem WHERE (elem->'rule_id')::jsonb ? '${params.rule_id}')`
      )
    }

    if (params.get_unpublished) {
      conditions.push(`policy_json->>'publish_date' IS NULL`)
    }

    if (params.get_published) {
      conditions.push(`policy_json->>'publish_date' IS NOT NULL`)
    }

    if (params.get_unpublished && params.get_published) {
      throw new BadParamsError('cannot have get_unpublished and get_published both be true')
    }

    if (params.start_date) {
      conditions.push(`policy_json->>'start_date' >= '${params.start_date}'`)
    }
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`
  }
  const values = vals.values()
  const res = await client.query(sql, values)
  return res.rows.map(row => row.policy_json)
}

export async function readActivePolicies(timestamp: Timestamp = now()): Promise<MDSPolicy[]> {
  const client = await getReadOnlyClient()
  const conditions = []
  const vals = new SqlVals()
  conditions.push(`policy_json->>'start_date' <= ${vals.add(timestamp)}`)
  conditions.push(`(policy_json->>'end_date' >= ${vals.add(timestamp)} OR policy_json->>'end_date' IS NULL)`)
  conditions.push(
    `(policy_json->>'publish_date' IS NOT NULL AND policy_json->>'publish_date' <= ${vals.add(timestamp)})`
  )
  const sql = `select * from ${schema.TABLE.policies} WHERE ${conditions.join(' AND ')}`
  const values = vals.values()
  const res = await client.query(sql, values)
  return res.rows.map(row => row.policy_json)
}

export async function readBulkPolicyMetadata(params?: {
  policy_id?: UUID
  name?: string
  description?: string
  start_date?: Timestamp
  get_unpublished: Nullable<boolean>
  get_published: Nullable<boolean>
}): Promise<MDSPolicyMetadata[]> {
  const policies = await readPolicies(params)
  const policy_ids = policies.map(policy => {
    return `'${policy.policy_id}'`
  })

  if (policy_ids.length === 0) {
    return []
  }
  const sql = `select * from ${schema.TABLE.policy_metadata} where policy_id in (${policy_ids.join(',')})`

  const client = await getReadOnlyClient()
  const res = await client.query(sql)
  return res.rows.map(row => {
    return { policy_id: row.policy_id, policy_metadata: row.policy_metadata }
  })
}

export async function readSinglePolicyMetadata(policy_id: UUID): Promise<MDSPolicyMetadata> {
  const client = await getReadOnlyClient()

  const sql = `select * from ${schema.TABLE.policy_metadata} where policy_id = '${policy_id}'`
  const res = await client.query(sql)
  if (res.rows.length === 1) {
    const { policy_metadata } = res.rows[0]
    return { policy_id, policy_metadata }
  }
  logger.info(`readSingleMDSPolicyMetadata db failed for ${policy_id}: rows=${res.rows.length}`)
  throw new NotFoundError(`metadata for policy_id ${policy_id} not found`)
}

export async function readPolicy(policy_id: UUID): Promise<MDSPolicy> {
  const client = await getReadOnlyClient()

  const sql = `select * from ${schema.TABLE.policies} where policy_id = '${policy_id}'`
  const res = await client.query(sql)
  if (res.rows.length === 1) {
    return res.rows[0].policy_json
  }
  logger.info(`readMDSPolicy db failed for ${policy_id}: rows=${res.rows.length}`)
  throw new NotFoundError(`policy_id ${policy_id} not found`)
}

async function throwIfRulesAlreadyExist(policy: MDSPolicy) {
  const unflattenedPolicies: MDSPolicy[][] = await Promise.all(
    policy.rules.map(rule => {
      return readPolicies<VEHICLE_STATE, VEHICLE_EVENT, RULE_TYPE, MDSBaseRule<RULE_TYPE>, MDSPolicy>({
        rule_id: rule.rule_id
      })
    })
  )

  unflattenedPolicies.map(policySubArr => {
    policySubArr.map(p => {
      if (p.policy_id !== policy.policy_id) {
        throw new ConflictError(`Policies containing rules with the same id or ids already exist`)
      }
    })
  })
}

export async function writePolicy(policy: MDSPolicy): Promise<Recorded<MDSPolicy>> {
  // validate TODO
  const client = await getWriteableClient()
  await throwIfRulesAlreadyExist(policy)

  const sql = `INSERT INTO ${schema.TABLE.policies} (${cols_sql(schema.TABLE_COLUMNS.policies)}) VALUES (${vals_sql(
    schema.TABLE_COLUMNS.policies
  )}) RETURNING *`
  const values = vals_list(schema.TABLE_COLUMNS.policies, { ...policy, policy_json: policy })
  try {
    const {
      rows: [recorded_policy]
    }: { rows: Recorded<MDSPolicy>[] } = await client.query(sql, values)
    return { ...policy, ...recorded_policy }
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError(`MDSPolicy ${policy.policy_id} already exists! Did you mean to PUT?`)
    } else {
      throw error
    }
  }
}

export async function isPolicyPublished(policy_id: UUID) {
  const client = await getReadOnlyClient()
  const sql = `SELECT * FROM ${schema.TABLE.policies} WHERE policy_id='${policy_id}'`
  const result = await client.query(sql)
  if (result.rows.length === 0) {
    return false
  }
  return Boolean(result.rows[0].policy_json.publish_date)
}

export async function editPolicy(policy: MDSPolicy) {
  // validate TODO
  const { policy_id } = policy

  if (await isPolicyPublished(policy_id)) {
    throw new AlreadyPublishedError('Cannot edit published policy')
  }

  const result = await readPolicies({ policy_id, get_unpublished: true, get_published: false })
  if (result.length === 0) {
    throw new NotFoundError(`no policy of id ${policy_id} was found`)
  }
  await throwIfRulesAlreadyExist(policy)
  const client = await getWriteableClient()
  const sql = `UPDATE ${schema.TABLE.policies} SET policy_json=$1 WHERE policy_id='${policy_id}' AND policy_json->>'publish_date' IS NULL`
  await client.query(sql, [policy])
  return policy
}

export async function deletePolicy(policy_id: UUID) {
  if (await isPolicyPublished(policy_id)) {
    throw new Error('Cannot edit published Geography')
  }

  const client = await getWriteableClient()
  const sql = `DELETE FROM ${schema.TABLE.policies} WHERE policy_id='${policy_id}' AND policy_json->>'publish_date' IS NULL`
  await client.query(sql)
  return policy_id
}

export async function publishPolicy(policy_id: UUID, publish_date = now()) {
  try {
    const client = await getWriteableClient()
    if (await isPolicyPublished(policy_id)) {
      throw new AlreadyPublishedError('Cannot re-publish existing policy')
    }

    const policy = (await readPolicies({ policy_id, get_unpublished: true, get_published: null }))[0]
    if (!policy) {
      throw new NotFoundError('cannot publish nonexistent policy')
    }

    if (policy.start_date < publish_date) {
      throw new ConflictError('Policies cannot be published after their start_date')
    }

    const geographies: UUID[] = []
    policy.rules.forEach(rule => {
      rule.geographies.forEach(geography_id => {
        geographies.push(geography_id)
      })
    })

    const unpublishedGeoIDs = await Promise.all(
      geographies.map(async geography_id => {
        const isPublished = await isGeographyPublished(geography_id)
        if (!isPublished) {
          return geography_id
        }
        return null
      })
    )

    unpublishedGeoIDs.forEach(id => {
      if (id) {
        throw new DependencyMissingError(`Geography with ${id} is not published!`)
      }
    })

    // Only publish the policy if the geographies are successfully published first
    const publishPolicySQL = `UPDATE ${schema.TABLE.policies}
     SET policy_json = policy_json::jsonb || '{"publish_date": ${publish_date}}'
     where policy_id='${policy_id}' RETURNING *`
    const {
      rows: [published_policy]
    }: { rows: MDSPolicy[] } = await client.query(publishPolicySQL).catch(err => {
      throw err
    })
    return { ...published_policy }
  } catch (err) {
    logger.error(err)
    throw err
  }
}

export async function writePolicyMetadata(policy_metadata: MDSPolicyMetadata) {
  const client = await getWriteableClient()
  const sql = `INSERT INTO ${schema.TABLE.policy_metadata} (${cols_sql(
    schema.TABLE_COLUMNS.policy_metadata
  )}) VALUES (${vals_sql(schema.TABLE_COLUMNS.policy_metadata)}) RETURNING *`
  const values = vals_list(schema.TABLE_COLUMNS.policy_metadata, {
    policy_id: policy_metadata.policy_id,
    policy_metadata: policy_metadata.policy_metadata
  })
  const {
    rows: [recorded_metadata]
  }: { rows: Recorded<MDSPolicyMetadata>[] } = await client.query(sql, values)
  return {
    ...policy_metadata,
    ...recorded_metadata
  }
}

export async function updatePolicyMetadata(policy_metadata: MDSPolicyMetadata) {
  try {
    await readSinglePolicyMetadata(policy_metadata.policy_id)
    const client = await getWriteableClient()
    const sql = `UPDATE ${schema.TABLE.policy_metadata}
      SET policy_metadata = '${JSON.stringify(policy_metadata.policy_metadata)}'
      WHERE policy_id = '${policy_metadata.policy_id}'`
    const {
      rows: [recorded_metadata]
    }: { rows: Recorded<MDSPolicyMetadata>[] } = await client.query(sql)
    return {
      ...policy_metadata,
      ...recorded_metadata
    }
  } catch (err) {
    logger.error(err)
    throw err
  }
}

export async function readRule(rule_id: UUID): Promise<MDSBaseRule<RULE_TYPE>> {
  const client = await getReadOnlyClient()
  const sql = `SELECT * from ${schema.TABLE.policies} where EXISTS(SELECT FROM json_array_elements(policy_json->'rules') elem WHERE (elem->'rule_id')::jsonb ? '${rule_id}');`
  const res = await client.query(sql).catch(err => {
    throw err
  })
  if (res.rowCount !== 1) {
    throw new Error(`invalid rule_id ${rule_id}`)
  } else {
    const [{ policy_json }]: { policy_json: MDSPolicy }[] = res.rows
    const [rule] = policy_json.rules.filter(r => {
      return r.rule_id === rule_id
    })
    return rule
  }
}

export async function findPoliciesByGeographyID(geography_id: UUID): Promise<MDSPolicy[]> {
  const client = await getReadOnlyClient()
  const sql = `select * from ${schema.TABLE.policies}
    where ${schema.COLUMN.policy_json}::jsonb
    @> '{"rules":[{"geographies":["${geography_id}"]}]}'`
  const res = await client.query(sql)
  return res.rows.map(row => row.policy_json)
}

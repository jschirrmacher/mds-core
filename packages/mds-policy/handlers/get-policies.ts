/**
 * Copyright 2021 City of Los Angeles
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

import { parseRequest } from '@mds-core/mds-api-helpers'
import { PolicyServiceClient, SortPolicyColumn, SortPolicyDirection } from '@mds-core/mds-policy-service'
import { now, ValidationError } from '@mds-core/mds-utils'
import type express from 'express'
import type { PolicyApiGetPoliciesRequest, PolicyApiGetPoliciesResponse } from '../types'

const getQueryParamsPublished = (req: PolicyApiGetPoliciesRequest, scopes: Array<string>) => {
  /*
      If the client is scoped to read unpublished policies,
      they are permitted to query for both published and unpublished policies.
      Otherwise, they can only read published.
    */
  const publishParams = parseRequest(req).single({ parser: JSON.parse }).query('get_published', 'get_unpublished')
  if (!scopes.includes('policies:read') && publishParams.get_unpublished === true) {
    publishParams.get_unpublished = false
  }
  if (publishParams.get_published === undefined && publishParams.get_unpublished === undefined) {
    publishParams.get_published = true
  }
  return publishParams
}

const getQueryParamsDates = (req: PolicyApiGetPoliciesRequest) => {
  return parseRequest(req).single({ parser: Number }).query('start_date', 'end_date')
}

const getSort = (req: PolicyApiGetPoliciesRequest) => {
  return parseRequest(req)
    .single({
      parser: s => {
        if (s && typeof s === 'string' && SortPolicyColumn.includes(s as SortPolicyColumn)) {
          return s as SortPolicyColumn
        }
        throw new ValidationError(`Invalid sort value '${s}'.`)
      }
    })
    .query('sort')
}

const getSortDirection = (req: PolicyApiGetPoliciesRequest) => {
  return parseRequest(req)
    .single({
      parser: dir => {
        if (dir && typeof dir === 'string' && SortPolicyDirection.includes(dir as SortPolicyDirection)) {
          return dir as SortPolicyDirection
        }
        throw new ValidationError(`Invalid sort direction '${dir}'.`)
      }
    })
    .query('direction')
}

const getQueryParams = (req: PolicyApiGetPoliciesRequest, scopes: Array<string>) => {
  const { get_published, get_unpublished } = getQueryParamsPublished(req, scopes)
  const { start_date = now(), end_date = now() } = getQueryParamsDates(req)
  if (start_date > end_date) {
    throw new ValidationError(`start_date must be after end_date`)
  }
  const { limit } = parseRequest(req).single({ parser: Number }).query('limit')
  const { afterCursor, beforeCursor } = parseRequest(req)
    .single({ parser: String })
    .query('afterCursor', 'beforeCursor')
  const { sort = 'status' } = getSort(req)
  const { direction = 'DESC' } = getSortDirection(req)
  return {
    active_on: {
      start: start_date,
      stop: end_date
    },
    get_published,
    get_unpublished,
    limit,
    afterCursor,
    beforeCursor,
    sort,
    direction
  }
}

export const GetPoliciesHandler = async (
  req: PolicyApiGetPoliciesRequest,
  res: PolicyApiGetPoliciesResponse,
  next: express.NextFunction
) => {
  try {
    const { scopes } = res.locals
    const { policies, cursor } = await PolicyServiceClient.readPolicies(getQueryParams(req, scopes))
    res.status(200).send({ version: res.locals.version, data: { policies, cursor } })
  } catch (error) {
    next(error)
  }
}

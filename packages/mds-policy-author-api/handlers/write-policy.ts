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

import { PolicyServiceClient } from '@mds-core/mds-policy-service'
import { isDefined, uuid, ValidationError } from '@mds-core/mds-utils'
import type express from 'express'
import type { PolicyAuthorApiPostPolicyRequest, PolicyAuthorApiPostPolicyResponse } from '../types'

export const WritePolicyHandler = async (
  req: PolicyAuthorApiPostPolicyRequest,
  res: PolicyAuthorApiPostPolicyResponse,
  next: express.NextFunction
) => {
  if (!isDefined(req.body.policy_id)) {
    req.body.policy_id = uuid()
  }
  try {
    const newPolicy = req.body
    if (newPolicy.published_date) throw new ValidationError('published_date cannot be set via policy creation endpoint')

    const policy = await PolicyServiceClient.writePolicy(req.body)
    const { version } = res.locals
    return res.status(201).send({ version, data: { policy } })
  } catch (error) {
    next(error)
  }
}

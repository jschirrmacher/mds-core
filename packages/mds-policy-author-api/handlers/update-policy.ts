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
import { ValidationError } from '@mds-core/mds-utils'
import type express from 'express'
import type { PolicyAuthorApiEditPolicyRequest, PolicyAuthorApiEditPolicyResponse } from '../types'

export const UpdatePolicyHandler = async (
  req: PolicyAuthorApiEditPolicyRequest,
  res: PolicyAuthorApiEditPolicyResponse,
  next: express.NextFunction
) => {
  const updatePolicy = req.body
  try {
    if (updatePolicy.published_date)
      throw new ValidationError('published_date cannot be set via policy editing endpoint')
    const policy = await PolicyServiceClient.editPolicy(updatePolicy)
    return res.status(200).send({ version: res.locals.version, data: { policy } })
  } catch (error) {
    /* istanbul ignore next */
    return next(error)
  }
}

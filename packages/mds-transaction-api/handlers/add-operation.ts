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

import { TransactionServiceClient } from '@mds-core/mds-transaction-service'
import type { TransactionOperationDomainModel } from '@mds-core/mds-transaction-service/@types'
import type express from 'express'
import type { TransactionApiRequest, TransactionApiResponse } from '../@types'

export type TransactionApiAddTransactionOperationRequest = TransactionApiRequest<TransactionOperationDomainModel>

export type TransactionApiAddTransactionOperationResponse = TransactionApiResponse<{
  operation: TransactionOperationDomainModel
}>

export const AddTransactionOperationHandler = async (
  req: TransactionApiAddTransactionOperationRequest,
  res: TransactionApiAddTransactionOperationResponse,
  next: express.NextFunction
) => {
  try {
    const operation = await TransactionServiceClient.addTransactionOperation(req.body)
    const { version } = res.locals
    return res.status(201).send({ version, operation })
  } catch (error) {
    next(error)
  }
}

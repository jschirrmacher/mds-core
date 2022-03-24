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

import type { RpcRequestOptions } from '@mds-core/mds-rpc-common'
import { RpcClient, RpcRequest } from '@mds-core/mds-rpc-common'
import type { ServiceClient } from '@mds-core/mds-service-helpers'
import type { TransactionService, TransactionServiceRequestContext } from '../@types'
import { TransactionServiceDefinition } from '../@types'

// What the API layer, and any other clients, will invoke.
export const TransactionServiceClientFactory = (
  context: TransactionServiceRequestContext,
  options: RpcRequestOptions = {}
): ServiceClient<TransactionService> => {
  const TransactionServiceRpcClient = RpcClient(TransactionServiceDefinition, {
    context,
    host: process.env.TRANSACTION_SERVICE_RPC_HOST,
    port: process.env.TRANSACTION_SERVICE_RPC_PORT
  })

  return {
    createTransaction: (...args) => RpcRequest(options, TransactionServiceRpcClient.createTransaction, args),
    createTransactions: (...args) => RpcRequest(options, TransactionServiceRpcClient.createTransactions, args),
    getTransaction: (...args) => RpcRequest(options, TransactionServiceRpcClient.getTransaction, args),
    getTransactions: (...args) => RpcRequest(options, TransactionServiceRpcClient.getTransactions, args),
    addTransactionOperation: (...args) =>
      RpcRequest(options, TransactionServiceRpcClient.addTransactionOperation, args),
    getTransactionOperations: (...args) =>
      RpcRequest(options, TransactionServiceRpcClient.getTransactionOperations, args),
    setTransactionStatus: (...args) => RpcRequest(options, TransactionServiceRpcClient.setTransactionStatus, args),
    getTransactionsStatuses: (...args) =>
      RpcRequest(options, TransactionServiceRpcClient.getTransactionsStatuses, args),
    getTransactionStatuses: (...args) => RpcRequest(options, TransactionServiceRpcClient.getTransactionStatuses, args)
  }
}

export const TransactionServiceClient = TransactionServiceClientFactory({})

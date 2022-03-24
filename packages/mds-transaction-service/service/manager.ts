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

import { RpcServer } from '@mds-core/mds-rpc-common'
import type { TransactionService, TransactionServiceRequestContext } from '../@types'
import { TransactionServiceDefinition } from '../@types'
import { TransactionServiceClient } from '../client'
import { TransactionServiceProvider } from './provider'

export const TransactionServiceManager = RpcServer<TransactionService, TransactionServiceRequestContext>(
  TransactionServiceDefinition,
  {
    onStart: TransactionServiceProvider.start,
    onStop: TransactionServiceProvider.stop
  },
  {
    createTransaction: (args, context) => TransactionServiceProvider.createTransaction(context, ...args),
    createTransactions: (args, context) => TransactionServiceProvider.createTransactions(context, ...args),
    getTransaction: (args, context) => TransactionServiceProvider.getTransaction(context, ...args),
    getTransactions: (args, context) => TransactionServiceProvider.getTransactions(context, ...args),
    addTransactionOperation: (args, context) => TransactionServiceProvider.addTransactionOperation(context, ...args),
    getTransactionOperations: (args, context) => TransactionServiceProvider.getTransactionOperations(context, ...args),
    setTransactionStatus: (args, context) => TransactionServiceProvider.setTransactionStatus(context, ...args),
    getTransactionStatuses: (args, context) => TransactionServiceProvider.getTransactionStatuses(context, ...args),
    getTransactionsStatuses: (args, context) => TransactionServiceProvider.getTransactionsStatuses(context, ...args)
  },
  {
    port: process.env.TRANSACTION_SERVICE_RPC_PORT,
    repl: {
      port: process.env.TRANSACTION_SERVICE_REPL_PORT,
      context: { client: TransactionServiceClient }
    }
  }
)

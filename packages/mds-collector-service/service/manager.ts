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

import { RpcServer } from '@mds-core/mds-rpc-common'
import type { CollectorService, CollectorServiceRequestContext } from '../@types'
import { CollectorServiceRpcDefinition } from '../@types'
import { CollectorServiceClient } from '../client'
import { CollectorServiceProvider } from './provider'

export const CollectorServiceManager = RpcServer<CollectorService, CollectorServiceRequestContext>(
  CollectorServiceRpcDefinition,
  {
    onStart: CollectorServiceProvider.start,
    onStop: CollectorServiceProvider.stop
  },
  {
    registerMessageSchema: (args, context) => CollectorServiceProvider.registerMessageSchema(context, ...args),
    getMessageSchema: (args, context) => CollectorServiceProvider.getMessageSchema(context, ...args),
    writeSchemaMessages: (args, context) => CollectorServiceProvider.writeSchemaMessages(context, ...args)
  },
  {
    port: process.env.COLLECTOR_SERVICE_RPC_PORT,
    repl: {
      port: process.env.COLLECTOR_SERVICE_REPL_PORT,
      context: { client: CollectorServiceClient }
    }
  }
)

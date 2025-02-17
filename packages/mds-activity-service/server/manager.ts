/**
 * Copyright 2022 City of Los Angeles
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

import { RpcServiceManager } from '@mds-core/mds-rpc-common'
import { ActivityServiceClient } from '../client'
import { ActivityRpcService } from '../service'

export const ActivityServiceManager = RpcServiceManager({
  port: process.env.ACTIVITY_SERVICE_RPC_PORT,
  repl: {
    port: process.env.ACTIVITY_SERVICE_REPL_PORT,
    context: { client: ActivityServiceClient }
  }
}).for(ActivityRpcService)

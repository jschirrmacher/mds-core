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

import { RpcServer } from '@mds-core/mds-rpc-common'
import type { JurisdictionService, JurisdictionServiceRequestContext } from '../@types'
import { JurisdictionServiceDefinition } from '../@types'
import { JurisdictionServiceClient } from '../client'
import { JurisdictionServiceProvider } from './provider'

export const JurisdictionServiceManager = RpcServer<JurisdictionService, JurisdictionServiceRequestContext>(
  JurisdictionServiceDefinition,
  {
    onStart: JurisdictionServiceProvider.start,
    onStop: JurisdictionServiceProvider.stop
  },
  {
    createJurisdiction: (args, context) => JurisdictionServiceProvider.createJurisdiction(context, ...args),
    createJurisdictions: (args, context) => JurisdictionServiceProvider.createJurisdictions(context, ...args),
    deleteJurisdiction: (args, context) => JurisdictionServiceProvider.deleteJurisdiction(context, ...args),
    getJurisdiction: (args, context) => JurisdictionServiceProvider.getJurisdiction(context, ...args),
    getJurisdictions: (args, context) => JurisdictionServiceProvider.getJurisdictions(context, ...args),
    updateJurisdiction: (args, context) => JurisdictionServiceProvider.updateJurisdiction(context, ...args)
  },
  {
    port: process.env.JURISDICTION_SERVICE_RPC_PORT,
    repl: {
      port: process.env.JURISDICTION_SERVICE_REPL_PORT,
      context: { client: JurisdictionServiceClient }
    }
  }
)

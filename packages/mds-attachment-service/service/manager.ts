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
import type { AttachmentService, AttachmentServiceRequestContext } from '../@types'
import { AttachmentServiceDefinition } from '../@types'
import { AttachmentServiceClient } from '../client'
import { AttachmentServiceProvider } from './provider'

export const AttachmentServiceManager = RpcServer<AttachmentService, AttachmentServiceRequestContext>(
  AttachmentServiceDefinition,
  {
    onStart: AttachmentServiceProvider.start,
    onStop: AttachmentServiceProvider.stop
  },
  {
    writeAttachment: (args, context) => AttachmentServiceProvider.writeAttachment(context, ...args),
    deleteAttachment: (args, context) => AttachmentServiceProvider.deleteAttachment(context, ...args),
    readAttachment: (args, context) => AttachmentServiceProvider.readAttachment(context, ...args),
    readAttachments: (args, context) => AttachmentServiceProvider.readAttachments(context, ...args)
  },
  {
    port: process.env.ATTACHMENT_SERVICE_RPC_PORT,
    repl: {
      port: process.env.ATTACHMENT_SERVICE_REPL_PORT,
      context: { client: AttachmentServiceClient }
    },
    maxRequestSize: '10mb'
  }
)

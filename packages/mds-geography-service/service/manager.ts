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
import type { GeographyService, GeographyServiceRequestContext } from '../@types'
import { GeographyServiceDefinition } from '../@types'
import { GeographyServiceClient } from '../client'
import { GeographyServiceProvider } from './provider'

export const GeographyServiceManager = RpcServer<GeographyService, GeographyServiceRequestContext>(
  GeographyServiceDefinition,
  {
    onStart: GeographyServiceProvider.start,
    onStop: GeographyServiceProvider.stop
  },
  {
    getGeography: (args, context) => GeographyServiceProvider.getGeography(context, ...args),
    getGeographies: (args, context) => GeographyServiceProvider.getGeographies(context, ...args),
    getUnpublishedGeographies: (args, context) => GeographyServiceProvider.getUnpublishedGeographies(context, ...args),
    getPublishedGeographies: (args, context) => GeographyServiceProvider.getPublishedGeographies(context, ...args),
    writeGeographies: (args, context) => GeographyServiceProvider.writeGeographies(context, ...args),
    writeGeographiesMetadata: (args, context) => GeographyServiceProvider.writeGeographiesMetadata(context, ...args),
    deleteGeographyAndMetadata: (args, context) =>
      GeographyServiceProvider.deleteGeographyAndMetadata(context, ...args),
    editGeography: (args, context) => GeographyServiceProvider.editGeography(context, ...args),
    editGeographyMetadata: (args, context) => GeographyServiceProvider.editGeographyMetadata(context, ...args),
    publishGeography: (args, context) => GeographyServiceProvider.publishGeography(context, ...args),
    getGeographiesByIds: (args, context) => GeographyServiceProvider.getGeographiesByIds(context, ...args)
  },
  {
    port: process.env.GEOGRAPHY_SERVICE_RPC_PORT,
    repl: {
      port: process.env.GEOGRAPHY_SERVICE_REPL_PORT,
      context: { client: GeographyServiceClient }
    }
  }
)

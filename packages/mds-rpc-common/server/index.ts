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

import type { ModuleRpcCommon } from '@lacuna-tech/rpc_ts/lib/common'
import { ModuleRpcProtocolGrpcWebCommon } from '@lacuna-tech/rpc_ts/lib/protocol/grpc_web/common'
import { ModuleRpcProtocolServer } from '@lacuna-tech/rpc_ts/lib/protocol/server'
import type { ServiceHandlerFor } from '@lacuna-tech/rpc_ts/lib/server/server'
import type { RawBodyParserMiddlewareOptions } from '@mds-core/mds-api-server'
import {
  HealthRequestHandler,
  HttpServer,
  PrometheusMiddleware,
  RawBodyParserMiddleware,
  RequestLoggingMiddleware
} from '@mds-core/mds-api-server'
import { ProcessManager } from '@mds-core/mds-service-helpers'
import type { Nullable } from '@mds-core/mds-types'
import type { Express } from 'express'
import express from 'express'
import type http from 'http'
import net from 'net'
import REPL from 'repl'
import type { RpcServiceDefinition } from '../@types'
import { REPL_PORT, RPC_CONTENT_TYPE, RPC_CONTEXT_KEY, RPC_PORT } from '../@types'
import { RpcCommonLogger } from '../logger'

export interface RpcServiceHandlers {
  onStart: () => Promise<void>
  onStop: () => Promise<void>
}

export interface RpcServiceManagerOptions extends RpcServiceHandlers {
  // Override the default RPC port
  port: string | number
  // Read Eval Print Loop options
  repl: Partial<{
    // Override the default REPL port
    port: string
    // Context (data/functions) available to the REPL
    context: unknown
  }>
  // Override the maximum size of the request body
  maxRequestSize: RawBodyParserMiddlewareOptions['limit']
  // This function allows the RPC server instance to be customized. Typically this is used to add
  // custom middleware or http routes. For example, to make custom readiness/liveliness checks
  // available via http.
  customize: (server: Express) => Express
}

const stopServer = async (server: http.Server | net.Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close(error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

/* istanbul ignore next */
const startRepl = (options: RpcServiceManagerOptions['repl']): Promise<net.Server> =>
  new Promise(resolve => {
    const port = Number(options.port || process.env.REPL_PORT || REPL_PORT)
    RpcCommonLogger.info(`Starting REPL server on port ${port}`)
    const server = net
      .createServer(socket => {
        const repl = REPL.start({
          prompt: `${process.env.npm_package_name} REPL> `,
          input: socket,
          output: socket,
          ignoreUndefined: true,
          terminal: true
        })
        Object.assign(repl.context, options.context ?? {})
        repl.on('reset', () => {
          Object.assign(repl.context, options.context ?? {})
        })
      })
      .on('close', () => {
        RpcCommonLogger.info(`Stopping REPL server`)
      })
    server.listen(port, () => {
      resolve(server)
    })
  })

export type RpcServiceSpecification<Service, RequestContext extends {}> = {
  definition: RpcServiceDefinition<Service>
  handlers: RpcServiceHandlers
  routes: ServiceHandlerFor<RpcServiceDefinition<Service>, RequestContext>
}

export const RpcServiceManager = (options: Partial<RpcServiceManagerOptions> = {}) => {
  return {
    for: (...services: Array<RpcServiceSpecification<{}, {}>>): ProcessManager => {
      let server: Nullable<http.Server> = null
      let repl: Nullable<net.Server> = null

      const httpServer = (application: Express, port: number): http.Server => {
        const { customize = s => s } = options
        return HttpServer(customize(application), { port })
      }

      return ProcessManager({
        start: async () => {
          if (!server) {
            const port = Number(options.port || process.env.RPC_PORT || RPC_PORT)
            RpcCommonLogger.info(`Starting RPC server listening for ${RPC_CONTENT_TYPE} requests on port ${port}`)
            if (options.onStart) {
              await options.onStart()
            }
            await Promise.all(services.map(({ handlers: { onStart } }) => onStart()))
            server = httpServer(
              services.reduce(
                (manager, { definition, routes }) =>
                  manager.use(
                    ModuleRpcProtocolServer.registerRpcRoutes(definition, routes, {
                      codec: new ModuleRpcProtocolGrpcWebCommon.GrpcWebJsonWithGzipCodec(),
                      serverContextConnector: {
                        // Not using response contexts
                        provideResponseContext: async () => ({}),
                        decodeRequestContext: async (encoded: ModuleRpcCommon.EncodedContext) => {
                          const encodedRpcContext = encoded[RPC_CONTEXT_KEY]
                          if (encodedRpcContext === undefined) {
                            throw new Error(`Missing RPC context in request`)
                          }
                          return JSON.parse(Buffer.from(encodedRpcContext, 'base64').toString('utf-8'))
                        }
                      }
                    })
                  ),
                express()
                  .use(PrometheusMiddleware())
                  .use(RequestLoggingMiddleware({ includeRemoteAddress: true, excludePaths: [/\/health$/] }))
                  .use(RawBodyParserMiddleware({ type: RPC_CONTENT_TYPE, limit: options.maxRequestSize }))
                  .get('/health', HealthRequestHandler)
              ),
              port
            )
            /* istanbul ignore next */
            if (options.repl && process.env.NODE_ENV !== 'test') {
              repl = await startRepl(options.repl)
            }
          }
        },
        stop: async () => {
          if (server) {
            await stopServer(server)
            server = null
            /* istanbul ignore next */
            if (repl) {
              await stopServer(repl)
              repl = null
            }
            RpcCommonLogger.info(`Stopping RPC server listening for ${RPC_CONTENT_TYPE} requests`)
            await Promise.all(services.map(({ handlers: { onStop } }) => onStop()))
            if (options.onStop) {
              await options.onStop()
            }
          }
        }
      })
    }
  }
}

/**
 * @deprecated Please use RpcServiceManager instead.
 */
export const RpcServer = <Service, RequestContext extends {}>(
  definition: RpcServiceDefinition<Service>,
  handlers: RpcServiceHandlers,
  routes: ServiceHandlerFor<RpcServiceDefinition<Service>, RequestContext>,
  options: Partial<RpcServiceManagerOptions> = {}
): ProcessManager => RpcServiceManager(options).for(RpcService(definition, handlers, routes))

export const RpcService = <Service, RequestContext extends {}>(
  definition: RpcServiceDefinition<Service>,
  handlers: RpcServiceHandlers,
  routes: ServiceHandlerFor<RpcServiceDefinition<Service>, RequestContext>
): RpcServiceSpecification<Service, RequestContext> => ({ definition, handlers, routes })

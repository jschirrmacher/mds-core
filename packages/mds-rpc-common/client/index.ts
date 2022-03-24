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

import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport'
import { ModuleRpcClient } from '@lacuna-tech/rpc_ts/lib/client'
import type { ModuleRpcCommon } from '@lacuna-tech/rpc_ts/lib/common'
import { ModuleRpcProtocolClient } from '@lacuna-tech/rpc_ts/lib/protocol/client'
import { ModuleRpcProtocolGrpcWebCommon } from '@lacuna-tech/rpc_ts/lib/protocol/grpc_web/common'
import type { ServiceResponse } from '@mds-core/mds-service-helpers'
import { isServiceError, ServiceError } from '@mds-core/mds-service-helpers'
import type { AnyFunction } from '@mds-core/mds-types'
import { seconds } from '@mds-core/mds-utils'
import type { RpcServiceDefinition } from '../@types'
import { RPC_CONTEXT_KEY, RPC_HOST, RPC_PORT } from '../@types'
import { RpcCommonLogger } from '../logger'

export type RpcClientOptions<RequestContext extends {}> = {
  context: RequestContext
  host?: string
  port?: string | number
}

export const RpcClient = <Service, RequestContext extends {}>(
  definition: RpcServiceDefinition<Service>,
  { context, ...options }: RpcClientOptions<RequestContext>
) => {
  const host = options.host || process.env.RPC_HOST || RPC_HOST
  const port = Number(options.port || process.env.RPC_PORT || RPC_PORT)

  return ModuleRpcProtocolClient.getRpcClient(definition, {
    getGrpcWebTransport: NodeHttpTransport(),
    remoteAddress: `${host}:${port}`,
    codec: new ModuleRpcProtocolGrpcWebCommon.GrpcWebJsonWithGzipCodec(),
    clientContextConnector: {
      provideRequestContext: async () => ({
        [RPC_CONTEXT_KEY]: Buffer.from(JSON.stringify(context), 'utf-8').toString('base64')
      }),
      // Not using reponse context
      decodeResponseContext: async (encoded: ModuleRpcCommon.EncodedContext): Promise<{}> => ({})
    }
  })
}

const RpcClientError = (error: {}) =>
  ServiceError(
    error instanceof ModuleRpcClient.ClientRpcError
      ? {
          type: error.errorType === 'unavailable' ? 'ServiceUnavailable' : 'ServiceException',
          message: error.msg ?? error.name,
          details: error.errorType
        }
      : {
          type: 'ServiceException',
          message: error instanceof Error ? error.message : error.toString()
        }
  ).error

// eslint-reason type inference requires any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RpcMethod<R = any> = AnyFunction<Promise<ServiceResponse<R>>>
type RpcRequestType<Method extends RpcMethod> = Parameters<Method>
type RpcResponseType<Method extends RpcMethod> = ReturnType<Method> extends Promise<ServiceResponse<infer R>>
  ? R
  : never

const RpcResponse = async <Method extends RpcMethod>(
  request: Method,
  ...args: RpcRequestType<Method>
): Promise<ServiceResponse<RpcResponseType<Method>>> => {
  try {
    const response = await request(...args)
    return response
  } catch (error: any) {
    throw RpcClientError(error)
  }
}

export type RpcRequestOptions = Partial<{
  retries: number | boolean
  backoff: number
}>

// By default, allow up to 5 retries with a 5s backoff.
const RpcRequestManager = async <Method extends RpcMethod>(
  { retries = 5, backoff = seconds(5) }: RpcRequestOptions,
  method: Method,
  ...args: RpcRequestType<Method>
): Promise<ServiceResponse<RpcResponseType<Method>>> => {
  try {
    return await RpcResponse(method, ...args)
  } catch (error) {
    if (isServiceError(error, 'ServiceUnavailable') && retries && process.env.NODE_ENV !== 'test') {
      RpcCommonLogger.debug(`RPC Service is unavailable. Retrying in ${backoff}ms.`)
      await new Promise(resolve => setTimeout(resolve, backoff))
      return RpcRequestManager(
        { retries: typeof retries === 'number' ? retries - 1 : retries, backoff },
        method,
        ...args
      )
    }
    throw error
  }
}

// Make an RPC request using the specified options
export const RpcRequest = async <Method extends RpcMethod>(
  options: RpcRequestOptions,
  method: Method,
  ...args: RpcRequestType<Method>
): Promise<RpcResponseType<Method>> => {
  const requestStartTime = Date.now()
  try {
    const response = await RpcRequestManager(options, method, ...args)
    if (response.error) {
      throw response.error
    }
    return response.result
  } finally {
    RpcCommonLogger.debug(`RPC request performance`, { duration: Date.now() - requestStartTime })
  }
}

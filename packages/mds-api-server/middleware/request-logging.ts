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

import type express from 'express'
import httpContext from 'express-http-context'
import morgan from 'morgan'
import type { ApiRequest, ApiResponse, ApiResponseLocalsClaims } from '../@types'
import { ApiServerLogger } from '../logger'

export type RequestLoggingMiddlewareOptions = Partial<{
  excludePaths: RegExp[]
  includeRemoteAddress: boolean
}>

const formatRemoteAddress = (remoteAddr = '-') => {
  const IPv4Prefix = '::ffff:'
  return remoteAddr.startsWith(IPv4Prefix) ? remoteAddr.substring(IPv4Prefix.length) : remoteAddr
}

export const RequestLoggingMiddleware = ({
  excludePaths = [],
  includeRemoteAddress = false
}: RequestLoggingMiddlewareOptions = {}): express.RequestHandler[] => [
  morgan<ApiRequest, ApiResponse & ApiResponseLocalsClaims>(
    (tokens, req, res) => {
      const { method, url, status, res: tokenRes, 'response-time': responseTime, 'remote-addr': remoteAddr } = tokens
      return [
        ...(includeRemoteAddress && remoteAddr ? [formatRemoteAddress(remoteAddr(req, res))] : []),
        ...(res.locals.claims?.provider_id ? [res.locals.claims.provider_id] : []),
        ...(method ? [method(req, res)] : []),
        ...(url ? [url(req, res)] : []),
        ...(status ? [status(req, res)] : []),
        ...(tokenRes ? [tokenRes(req, res, 'content-length')] : []),
        '-',
        ...(responseTime ? [responseTime(req, res)] : []),
        'ms'
      ]
        .filter((token): token is string => token !== undefined)
        .join(' ')
    },
    {
      skip: (req: ApiRequest): boolean => excludePaths.some(path => req.path.match(path)),
      // Use logger, but remove extra line feed added by morgan stream option
      stream: { write: msg => ApiServerLogger.info(msg.slice(0, -1)) }
    }
  ),
  httpContext.middleware,
  (req: ApiRequest, res: ApiResponse, next: express.NextFunction) => {
    const xRequestId = req.get('x-request-id')
    if (xRequestId) {
      httpContext.set('x-request-id', xRequestId)
    }
    return next()
  },
  (req: ApiRequest, res: ApiResponse, next: express.NextFunction) => {
    if (!excludePaths.some(path => req.path.match(path))) {
      const { path, query, body } = req
      ApiServerLogger.debug('Request details', { path, query, body })
    }

    return next()
  }
]

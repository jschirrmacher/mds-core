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

import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown'
import type express from 'express'
import { ApiServerLogger } from './logger'
import { serverVersion } from './utils'

export type HttpServerOptions = Partial<{
  port: string | number
  exitSignals: NodeJS.Signals[]
}>

export const HttpServer = (api: express.Express, options: HttpServerOptions = {}) => {
  const { HTTP_KEEP_ALIVE_TIMEOUT = 15000, HTTP_HEADERS_TIMEOUT = 20000 } = process.env
  const { exitSignals = ['SIGTERM', 'SIGINT'] } = options
  const port = Number(options.port || process.env.PORT || 4000)

  const server = api.listen(port, () => {
    ApiServerLogger.info(
      `${serverVersion()} running on port ${port}; Timeouts(${HTTP_KEEP_ALIVE_TIMEOUT}/${HTTP_HEADERS_TIMEOUT})`
    )
  })

  const shutdownManager = new GracefulShutdownManager(server)
  exitSignals.forEach(signal => {
    process.on(signal, () => {
      shutdownManager.terminate(() => {
        ApiServerLogger.info('HTTP Server has been gracefully terminated')
      })
    })
  })

  // Increase default timeout values to mitigate spurious 503 errors from Istio
  server.keepAliveTimeout = Number(HTTP_KEEP_ALIVE_TIMEOUT)
  server.headersTimeout = Number(HTTP_HEADERS_TIMEOUT)

  return server
}

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
import httpContext from 'express-http-context'
import { inspect } from 'util'
import type { LogLevel } from './@types'
import { debugLog, logger } from './loggers'
import { normalize, redact } from './redaction'

// Verify that defaultOptions is available (not available on non-nodejs platforms)
if (inspect?.defaultOptions) {
  // Set the inspector depth to infinity. To the moooooooon 🚀 🌕
  inspect.defaultOptions.depth = null
}

const getCustomProps = () => {
  const ISOTimestamp = new Date().toISOString()
  const requestId = httpContext.get('x-request-id')

  return { ISOTimestamp, requestId }
}

const log =
  (level: LogLevel, namespace: string, redactKeys: Set<string>) =>
  (message: string, data?: Record<string, unknown> | Error): void => {
    if (process.env.QUIET !== 'true') {
      return data
        ? logger[level]({ ...getCustomProps(), namespace, data: redact(data, redactKeys), message })
        : logger[level]({ ...getCustomProps(), namespace, message })
    }
  }

export const createLogger = (
  namespace: string,
  { debugPrefix, redactKeys = [] }: Partial<{ debugPrefix: string; redactKeys: string[] }> = {}
) => {
  const keys = new Set(['lat', 'latitude', 'lng', 'lon', 'longitude', ...redactKeys].map(normalize))
  return {
    debug: debugLog(`${debugPrefix ?? 'mds'}:${namespace}`, keys),
    info: log('info', namespace, keys),
    warn: log('warn', namespace, keys),
    error: log('error', namespace, keys)
  }
}

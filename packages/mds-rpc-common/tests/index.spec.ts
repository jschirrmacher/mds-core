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

import type { ServiceClient } from '@mds-core/mds-service-helpers'
import { ServiceError, ServiceResult } from '@mds-core/mds-service-helpers'
import supertest from 'supertest'
import type { RpcEmptyRequestContext, RpcServiceDefinition } from '../@types'
import { RPC_HOST } from '../@types'
import type { RpcRequestOptions } from '../client'
import { RpcClient, RpcRequest } from '../client'
import { RpcRoute } from '../index'
import { RpcServer } from '../server'

const request = supertest(`${RPC_HOST}:${process.env.RPC_PORT}`)

const TEST_WORD = 'mds-rpc-common'

interface TestService {
  length: (word?: string) => number
}

export const TestServiceRpcDefinition: RpcServiceDefinition<TestService> = {
  length: RpcRoute<TestService['length']>()
}

const TestServer = RpcServer<TestService, RpcEmptyRequestContext>(
  TestServiceRpcDefinition,
  {
    onStart: async () => undefined,
    onStop: async () => undefined
  },
  {
    length: async ([word]) =>
      word && word.length > 0 ? ServiceResult(word.length) : ServiceError({ type: 'NotFoundError', message: 'No Word' })
  },
  {
    repl: { context: {} },
    customize: server => server.get('/ping', (_, res) => res.status(200).send('pong'))
  }
).controller()

const TestClient = (options: RpcRequestOptions = {}): ServiceClient<TestService> => ({
  length: word => RpcRequest(options, RpcClient(TestServiceRpcDefinition, { context: {} }).length, [word])
})

describe('Test RPC Client', () => {
  describe('Test Service Unavailable', () => {
    it('No Retries', async () => {
      await expect(TestClient({ retries: false }).length(TEST_WORD)).rejects.toMatchObject({
        isServiceError: true,
        type: 'ServiceUnavailable'
      })
    })

    it('With Retries', async () => {
      await expect(TestClient({ retries: 5, backoff: 10 }).length(TEST_WORD)).rejects.toMatchObject({
        isServiceError: true,
        type: 'ServiceUnavailable'
      })
    })
  })

  const requestIt = (req: supertest.Test, assert: (req: supertest.Test) => Promise<void>) =>
    it(`Testing ${req.url}`, async () => {
      await assert(req)
    })

  describe('Test Service Available', () => {
    beforeAll(async () => {
      await TestServer.start()
    })

    it('Test Service Result', async () => {
      expect(await TestClient().length(TEST_WORD)).toStrictEqual(TEST_WORD.length)
    })

    it('Test Service Error', async () => {
      await expect(TestClient().length()).rejects.toMatchObject({
        isServiceError: true,
        type: 'NotFoundError'
      })
    })

    requestIt(request.get('/health'), async req => {
      const result = await req.expect(200)
      expect(result.body).toMatchObject({ status: 'Running' })
    })

    requestIt(request.get('/not-found'), async req => {
      await req.expect(404)
    })

    requestIt(request.get('/ping'), async req => {
      const result = await req.expect(200)
      expect(result.text).toEqual('pong')
    })

    afterAll(async () => {
      await TestServer.stop()
    })
  })
})

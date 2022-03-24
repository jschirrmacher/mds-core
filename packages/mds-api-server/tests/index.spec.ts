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

/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable promise/prefer-await-to-callbacks */

import { pathPrefix } from '@mds-core/mds-utils'
import HttpStatus from 'http-status-codes'
import supertest from 'supertest'
import type { ApiVersionedResponse } from '../@types'
import { ApiServer } from '../api-server'
import { HttpServer } from '../http-server'
import { ApiVersionMiddleware } from '../middleware/api-version'

const TEST_API_MIME_TYPE = 'application/vnd.mds.test+json'
const TEST_API_VERSIONS = ['0.1.0', '0.2.0'] as const
type TEST_API_VERSION = typeof TEST_API_VERSIONS[number]
const [DEFAULT_TEST_API_VERSION, ALTERNATE_TEST_API_VERSION] = TEST_API_VERSIONS

const api = ApiServer(app => {
  app.use(ApiVersionMiddleware(TEST_API_MIME_TYPE, TEST_API_VERSIONS).withDefaultVersion(DEFAULT_TEST_API_VERSION))
  app.get('/api-version-middleware-test', (req, res: ApiVersionedResponse<TEST_API_VERSION>) =>
    res.status(HttpStatus.OK).send({ version: res.locals.version })
  )
  return app
})

const request = supertest(api)

const APP_JSON = 'application/json; charset=utf-8'

describe('Testing API Server', () => {
  afterEach(async () => {
    delete process.env.MAINTENANCE
  })

  it('verifies get root (MAINTENANCE)', async () => {
    process.env.MAINTENANCE = 'Testing'
    const result = await request.get('/').expect(HttpStatus.SERVICE_UNAVAILABLE)
    expect(result.headers['content-type']).toStrictEqual(APP_JSON)
    expect(result.body).toMatchObject({
      name: expect.any(String),
      version: expect.any(String),
      node: expect.any(String),
      build: expect.any(Object),
      process: expect.any(Number),
      memory: expect.any(Object),
      uptime: expect.any(Number),
      status: expect.stringContaining('Testing (MAINTENANCE)')
    })
  })

  it('verifies health', async () => {
    const result = await request.get(pathPrefix('/health')).expect(HttpStatus.OK)
    expect(result.headers['content-type']).toStrictEqual(APP_JSON)
    expect(result.body).toMatchObject({
      name: expect.any(String),
      version: expect.any(String),
      node: expect.any(String),
      build: expect.any(Object),
      process: expect.any(Number),
      memory: expect.any(Object),
      uptime: expect.any(Number),
      status: expect.stringContaining('Running')
    })
  })

  it('verifies health (MAINTENANCE)', async () => {
    process.env.MAINTENANCE = 'Testing'
    const result = await request.get('/health').expect(HttpStatus.OK)

    expect(result.headers['content-type']).toStrictEqual(APP_JSON)
    expect(result.body).toMatchObject({
      name: expect.any(String),
      version: expect.any(String),
      node: expect.any(String),
      build: expect.any(Object),
      process: expect.any(Number),
      memory: expect.any(Object),
      uptime: expect.any(Number),
      status: expect.stringContaining('Testing (MAINTENANCE)')
    })
  })

  it('verifies MAINTENANCE repsonse', async () => {
    process.env.MAINTENANCE = 'Testing'
    const result = await request
      .get('/this-is-a-bad-route-but-it-should-return-503-in-maintenance-mode')
      .expect(HttpStatus.SERVICE_UNAVAILABLE)

    expect(result.headers['content-type']).toStrictEqual(APP_JSON)
    expect(result.body.status).toStrictEqual('Testing (MAINTENANCE)')
  })

  it('verifies MAINTENANCE passthrough', async () => {
    await request.get('/this-is-a-bad-route-so-it-should-normally-return-404').expect(HttpStatus.NOT_FOUND)
  })

  it('verifies keepAliveTimeout setting', async () => {
    process.env.HTTP_KEEP_ALIVE_TIMEOUT = '3000'
    const server = HttpServer(api)

    expect(server.keepAliveTimeout).toStrictEqual(Number(process.env.HTTP_KEEP_ALIVE_TIMEOUT))

    server.close()
  })

  it('verifies version middleware OPTIONS request (version not acceptable)', async () => {
    const result = await request
      .options('/api-version-middleware-test')
      .set('accept', `${TEST_API_MIME_TYPE};version=0.4;q=.9,${TEST_API_MIME_TYPE};version=0.5;`)
      .expect(HttpStatus.NOT_ACCEPTABLE)

    expect(result.text).toStrictEqual('Not Acceptable')
  })

  it('verifies version middleware OPTIONS request (with versions)', async () => {
    const result = await request
      .options('/api-version-middleware-test')
      .set('accept', `${TEST_API_MIME_TYPE};version=0.2`)
      .expect(HttpStatus.OK)

    expect(result.header['content-type']).toStrictEqual(`${TEST_API_MIME_TYPE};version=0.2`)
  })

  it('verifies version middleware (default version)', async () => {
    const result = await request.get('/api-version-middleware-test').expect(HttpStatus.OK)

    expect(result.header['content-type']).toStrictEqual(`${TEST_API_MIME_TYPE}; charset=utf-8; version=0.1`)
    expect(result.body.version).toStrictEqual(DEFAULT_TEST_API_VERSION)
  })

  it('verifies version middleware (with versions)', async () => {
    const result = await request
      .get('/api-version-middleware-test')
      .set('accept', `${TEST_API_MIME_TYPE};version=0.2`)
      .expect(HttpStatus.OK)

    expect(result.header['content-type']).toStrictEqual(`${TEST_API_MIME_TYPE}; charset=utf-8; version=0.2`)
    expect(result.body.version).toStrictEqual(ALTERNATE_TEST_API_VERSION)
  })

  it('verifies version middleware (versions with q)', async () => {
    const result = await request
      .get('/api-version-middleware-test')
      .set('accept', `${TEST_API_MIME_TYPE};version=0.2;q=.9,${TEST_API_MIME_TYPE};version=0.1;`)
      .expect(HttpStatus.OK)

    expect(result.header['content-type']).toStrictEqual(`${TEST_API_MIME_TYPE}; charset=utf-8; version=0.1`)
    expect(result.body.version).toStrictEqual(DEFAULT_TEST_API_VERSION)
  })

  it('verifies version middleware (version not acceptable)', async () => {
    const result = await request
      .get('/api-version-middleware-test')
      .set('accept', `${TEST_API_MIME_TYPE};version=0.4;q=.9,${TEST_API_MIME_TYPE};version=0.5;`)
      .expect(HttpStatus.NOT_ACCEPTABLE)

    expect(result.text).toStrictEqual('Not Acceptable')
  })
})

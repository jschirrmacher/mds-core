/**
 * Copyright 2022 City of Los Angeles
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

import { ApiServer } from '@mds-core/mds-api-server'
import { ConfigServiceManager } from '@mds-core/mds-config-service'
import { pathPrefix } from '@mds-core/mds-utils'
import HttpStatus from 'http-status-codes'
import supertest from 'supertest'
import { api } from '../api'

const request = supertest(ApiServer(api))

const { MDS_CONFIG_PATH } = process.env

const ConfigServer = ConfigServiceManager.controller()

describe('Testing API', () => {
  beforeAll(async () => {
    process.env.MDS_CONFIG_PATH = './tests/fixtures'
    await ConfigServer.start()
  })

  it(`Default Settings File (missing)`, async () => {
    const result = await request.get(pathPrefix(`/settings`)).expect(HttpStatus.NOT_FOUND)

    expect(result.body.error.type).toEqual('NotFoundError')
  })

  it(`Default Settings File (partial)`, async () => {
    const result = await request.get(pathPrefix(`/settings?partial=true`)).expect(HttpStatus.OK)

    expect(result.body.settings).toEqual(null)
  })

  it(`Single Settings File (missing)`, async () => {
    const result = await request.get(pathPrefix(`/settings?p=missing`)).expect(HttpStatus.NOT_FOUND)

    expect(result.body.error.type).toEqual('NotFoundError')
  })

  it(`Single Settings File (partial)`, async () => {
    const result = await request.get(pathPrefix(`/settings/missing?partial=true`)).expect(HttpStatus.OK)

    expect(result.body.missing).toEqual(null)
  })

  it(`Single Settings File`, async () => {
    const result = await request.get(pathPrefix(`/settings/one`)).expect(HttpStatus.OK)

    expect(result.body.name).toEqual('one')
  })

  it(`Multiple Settings File (missing)`, async () => {
    const result = await request.get(pathPrefix(`/settings?p=one&p=missing`)).expect(HttpStatus.NOT_FOUND)

    expect(result.body.error.type).toEqual('NotFoundError')
  })

  it(`Multiple Settings File (partial)`, async () => {
    const result = await request.get(pathPrefix(`/settings?p=one&p=missing&partial=true`)).expect(HttpStatus.OK)

    expect(result.body.name).toEqual('one')
    expect(result.body.missing).toEqual(null)
  })

  it(`Multiple Settings Files`, async () => {
    const result = await request.get(pathPrefix(`/settings?p=one&p=two`)).expect(HttpStatus.OK)

    expect(result.body.name).toEqual('two')
  })

  afterAll(async () => {
    await ConfigServer.stop()
    process.env.MDS_CONFIG_PATH = MDS_CONFIG_PATH
  })
})

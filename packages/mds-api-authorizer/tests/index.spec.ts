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

import { uuid } from '@mds-core/mds-utils'
import express from 'express'
import jwt from 'jsonwebtoken'
import { AuthorizationHeaderApiAuthorizer, CustomClaim, WebSocketAuthorizer } from '../index'

const PROVIDER_SCOPES = 'admin:all'
const PROVIDER_SUBJECT = uuid()
const PROVIDER_EMAIL = 'user@test.ai'
const PROVIDER_ID = uuid()

const { env } = process

const Basic = () => `Basic ${Buffer.from(`${PROVIDER_ID}|${PROVIDER_SCOPES}`).toString('base64')}`

const Bearer = () =>
  `Bearer ${jwt.sign(
    {
      sub: PROVIDER_SUBJECT,
      [CustomClaim('user_email')]: PROVIDER_EMAIL,
      [CustomClaim('provider_id')]: PROVIDER_ID,
      scope: PROVIDER_SCOPES
    },
    'secret'
  )}`

describe('Test API Authorizer', () => {
  beforeAll(() => {
    process.env = { TOKEN_CUSTOM_CLAIM_NAMESPACE: 'https://test.ai/' }
  })

  describe('Authorizaton Header Authorizer', () => {
    it('No Authorizaton', async () => {
      expect(AuthorizationHeaderApiAuthorizer({} as express.Request)).toEqual(null)
    })

    it('Invalid Authorizaton Scheme', async () => {
      expect(
        AuthorizationHeaderApiAuthorizer({
          headers: { authorization: 'invalid' }
        } as express.Request)
      ).toEqual(null)
    })

    it('Basic Authorizaton', async () => {
      expect(
        AuthorizationHeaderApiAuthorizer({
          headers: { authorization: Basic() }
        } as express.Request)
      ).toMatchObject({
        principalId: PROVIDER_ID,
        provider_id: PROVIDER_ID,
        scope: PROVIDER_SCOPES
      })
    })

    it('Bearer Authorizaton', async () => {
      expect(
        AuthorizationHeaderApiAuthorizer({
          headers: { authorization: Bearer() }
        } as express.Request)
      ).toMatchObject({
        principalId: PROVIDER_SUBJECT,
        provider_id: PROVIDER_ID,
        user_email: PROVIDER_EMAIL,
        scope: PROVIDER_SCOPES
      })
    })
  })

  describe('WebSocket Authorizer', () => {
    it('Basic Authorization', async () => {
      expect(WebSocketAuthorizer(Basic())).toMatchObject({
        principalId: PROVIDER_ID,
        provider_id: PROVIDER_ID,
        scope: PROVIDER_SCOPES
      })
    })

    it('Bearer Authorization', async () => {
      expect(WebSocketAuthorizer(Bearer())).toMatchObject({
        principalId: PROVIDER_SUBJECT,
        provider_id: PROVIDER_ID,
        user_email: PROVIDER_EMAIL,
        scope: PROVIDER_SCOPES
      })
    })
  })

  afterAll(() => {
    process.env = env
  })
})

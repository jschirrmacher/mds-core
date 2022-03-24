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
import type express from 'express'
import jwt from 'jsonwebtoken'
import { AuthorizationHeaderApiAuthorizer, CustomClaim, NoAuthorizerClaims } from '../index'

const PROVIDER_SCOPES = 'admin:all'
const PROVIDER_SUBJECT = uuid()
const PROVIDER_EMAIL = 'user@test.ai'
const PROVIDER_ID = uuid()

const BasicAccessToken = Buffer.from(`${PROVIDER_ID}|${PROVIDER_SCOPES}`).toString('base64')

const EnhancedBasicAccessToken = Buffer.from(
  `Bearer|${JSON.stringify({
    principalId: PROVIDER_SUBJECT,
    provider_id: PROVIDER_ID,
    user_email: PROVIDER_EMAIL,
    scope: PROVIDER_SCOPES
  })}`
).toString('base64')

const BearerAccessToken = jwt.sign(
  {
    sub: PROVIDER_SUBJECT,
    [CustomClaim('user_email')]: PROVIDER_EMAIL,
    [CustomClaim('provider_id')]: PROVIDER_ID,
    scope: PROVIDER_SCOPES
  },
  'secret'
)

describe('Test API Authorizer', () => {
  it('No Authorizaton', async () => {
    expect(AuthorizationHeaderApiAuthorizer({} as express.Request)).toEqual(NoAuthorizerClaims)
  })

  it('Invalid Authorizaton Scheme', async () => {
    expect(
      AuthorizationHeaderApiAuthorizer({
        headers: { authorization: 'invalid' }
      } as express.Request)
    ).toEqual(NoAuthorizerClaims)
  })

  it('Basic Authorizaton', async () => {
    expect(
      AuthorizationHeaderApiAuthorizer({
        headers: { authorization: `Basic ${BasicAccessToken}` }
      } as express.Request)
    ).toMatchObject({
      authorization: { token_type: 'Basic', access_token: BasicAccessToken },
      claims: { principalId: PROVIDER_ID, provider_id: PROVIDER_ID, scope: PROVIDER_SCOPES }
    })
  })

  it('Enhanced Basic Authorizaton', async () => {
    expect(
      AuthorizationHeaderApiAuthorizer({
        headers: { authorization: `Basic ${EnhancedBasicAccessToken}` }
      } as express.Request)
    ).toMatchObject({
      authorization: { token_type: 'Basic', access_token: EnhancedBasicAccessToken },
      claims: {
        principalId: PROVIDER_SUBJECT,
        provider_id: PROVIDER_ID,
        user_email: PROVIDER_EMAIL,
        scope: PROVIDER_SCOPES
      }
    })
  })

  it('Bearer Authorizaton', async () => {
    expect(
      AuthorizationHeaderApiAuthorizer({
        headers: { authorization: `Bearer ${BearerAccessToken}` }
      } as express.Request)
    ).toMatchObject({
      authorization: { token_type: 'Bearer', access_token: BearerAccessToken },
      claims: {
        principalId: PROVIDER_SUBJECT,
        provider_id: PROVIDER_ID,
        user_email: PROVIDER_EMAIL,
        scope: PROVIDER_SCOPES
      }
    })
  })
})

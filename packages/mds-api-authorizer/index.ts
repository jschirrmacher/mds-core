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

import type { UUID } from '@mds-core/mds-types'
import { AuthorizationError, getEnvVar } from '@mds-core/mds-utils'
import type express from 'express'
import jwt from 'jsonwebtoken'

export interface AuthorizationContext {
  token_type: 'None' | 'Basic' | 'Bearer'
  access_token?: string
}

export interface AuthorizerClaims {
  authorization: AuthorizationContext
  claims?: {
    principalId: string
    scope: string
    provider_id: UUID | null
    user_email: string | null
    jurisdictions: string | null
  }
}

export const NoAuthorizerClaims: AuthorizerClaims = { authorization: { token_type: 'None' } }

export type Authorizer = (authorization: string) => AuthorizerClaims
export type ApiAuthorizer = (req: express.Request) => AuthorizerClaims

export const CustomClaim = (claim: 'provider_id' | 'user_email' | 'jurisdictions') => {
  const { TOKEN_CUSTOM_CLAIM_NAMESPACE } = getEnvVar({
    TOKEN_CUSTOM_CLAIM_NAMESPACE: 'https://openmobilityfoundation.org'
  })
  return `${TOKEN_CUSTOM_CLAIM_NAMESPACE}${TOKEN_CUSTOM_CLAIM_NAMESPACE.endsWith('/') ? '' : '/'}${claim}`
}

export const ProviderIdClaim = () => {
  const { TOKEN_PROVIDER_ID_CLAIM } = getEnvVar({
    TOKEN_PROVIDER_ID_CLAIM: CustomClaim('provider_id')
  })
  return TOKEN_PROVIDER_ID_CLAIM
}

export const UserEmailClaim = () => {
  const { TOKEN_USER_EMAIL_CLAIM } = getEnvVar({
    TOKEN_USER_EMAIL_CLAIM: CustomClaim('user_email')
  })
  return TOKEN_USER_EMAIL_CLAIM
}

export const JurisdictionsClaim = () => {
  const { TOKEN_JURISDICTIONS_CLAIM } = getEnvVar({
    TOKEN_JURISDICTIONS_CLAIM: CustomClaim('jurisdictions')
  })
  return TOKEN_JURISDICTIONS_CLAIM
}

const decode = (access_token: string) => {
  const decoded = jwt.decode(access_token)
  return typeof decoded === 'string' || decoded === null ? {} : decoded
}

const decoders: { [scheme: string]: (access_token: string) => AuthorizerClaims } = {
  bearer: (access_token: string): AuthorizerClaims => {
    const {
      sub: principalId = '',
      scope,
      [ProviderIdClaim()]: provider_id = null,
      [UserEmailClaim()]: user_email = null,
      [JurisdictionsClaim()]: jurisdictions = null,
      ...claims
    } = decode(access_token)

    return {
      authorization: { token_type: 'Bearer', access_token },
      claims: { principalId, scope, provider_id, user_email, jurisdictions, ...claims }
    }
  },
  basic: (access_token: string): AuthorizerClaims => {
    const [principalId, scope] = Buffer.from(access_token, 'base64').toString().split('|')
    if (principalId !== undefined && scope !== undefined) {
      return {
        authorization: { token_type: 'Basic', access_token },
        claims:
          principalId === 'Bearer'
            ? JSON.parse(scope)
            : {
                principalId,
                scope,
                provider_id: principalId,
                user_email: principalId,
                jurisdictions: principalId
              }
      }
    }
    throw new AuthorizationError('Invalid basic token')
  }
}

const BaseAuthorizer: Authorizer = authorization => {
  const [scheme, access_token] = authorization.split(' ')
  if (scheme && access_token) {
    const decoder = decoders[scheme.toLowerCase()]
    if (decoder) {
      return decoder(access_token)
    }
  }
  return NoAuthorizerClaims
}

export const AuthorizationHeaderApiAuthorizer: ApiAuthorizer = req => {
  return req.headers?.authorization ? BaseAuthorizer(req.headers.authorization) : NoAuthorizerClaims
}

export const WebSocketAuthorizer = BaseAuthorizer

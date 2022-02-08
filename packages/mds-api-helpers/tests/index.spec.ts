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

/* eslint-disable @typescript-eslint/no-explicit-any */

import { uuid } from '@mds-core/mds-utils'
import { asJsonApiLinks, parseRequest } from '../index'

const arraysEqual = <T>(array1?: T[], array2?: T[]) => JSON.stringify(array1) === JSON.stringify(array2)

describe('mds-api-helpers Tests', () => {
  describe('asJsonApiLinks test', () => {
    it('outputs links', () => {
      const uuid1 = uuid()
      const req: any = { query: { provider_id: uuid1 }, get: () => 'host-prot' }

      expect(asJsonApiLinks(req, 10, 20, 5)).toStrictEqual({
        first: `host-prot:host-prot?provider_id=${uuid1}&skip=0&take=20`,
        last: undefined,
        next: undefined,
        prev: undefined
      })
    })
  })
  describe('parseRequest tests', () => {
    describe('tests parseRequest(...).single()', () => {
      describe('no parser', () => {
        it('singleton in query', () => {
          const req: any = { query: { provider_id: uuid() } }

          const { provider_id } = parseRequest(req).single().query('provider_id')

          expect(req.query.provider_id).toStrictEqual(provider_id)
          expect(typeof provider_id).toStrictEqual('string')
        })

        it('list in query', () => {
          const req: any = { query: { provider_id: [uuid(), uuid()] } }

          const { provider_id } = parseRequest(req).single().query('provider_id')

          expect(req.query.provider_id[0]).toStrictEqual(provider_id)
          expect(typeof provider_id).toStrictEqual('string')
        })

        it('nothing in query', () => {
          const req: any = { query: {} }

          const { provider_id } = parseRequest(req).single().query('provider_id')

          expect(provider_id).toBeUndefined()
        })
      })

      describe('with parser', () => {
        it('singleton in query', () => {
          const req: any = { query: { skip: '10' } }
          const parser = Number

          const { skip } = parseRequest(req).single({ parser }).query('skip')

          expect(parser(req.query.skip)).toStrictEqual(skip)
          expect(typeof skip).toStrictEqual('number')
        })

        it('list in query', () => {
          const req: any = { query: { skip: ['10', '100'] } }
          const parser = Number

          const { skip } = parseRequest(req).single({ parser }).query('skip')

          expect(parser(req.query.skip[0])).toStrictEqual(skip)
          expect(typeof skip).toStrictEqual('number')
        })

        it('nothing in query', () => {
          const req: any = { query: {} }
          const parser = Number

          const { skip } = parseRequest(req).single({ parser }).query('skip')

          expect(skip).toBeUndefined()
        })
      })
    })

    describe('tests parseRequest(...).list()', () => {
      describe('no parser', () => {
        it('singleton in query', () => {
          const req: any = { query: { provider_id: uuid() } }

          const { provider_id } = parseRequest(req).list().query('provider_id')

          expect(arraysEqual([req.query.provider_id], provider_id)).toBeTruthy()
          expect(Array.isArray(provider_id)).toBeTruthy()
        })

        it('list in query', () => {
          const req: any = { query: { provider_id: [uuid(), uuid()] } }

          const { provider_id } = parseRequest(req).list().query('provider_id')

          expect(arraysEqual(req.query.provider_id, provider_id)).toBeTruthy()
          expect(Array.isArray(provider_id)).toBeTruthy()
        })

        it('nothing in query', () => {
          const req: any = { query: {} }

          const { provider_id } = parseRequest(req).list().query('provider_id')

          expect(provider_id).toBeUndefined()
        })
      })

      describe('with parser', () => {
        it('singleton in query', () => {
          const req: any = { query: { skip: '10' } }
          const parser = (xs: string[]) => xs.map(Number)

          const { skip } = parseRequest(req).list({ parser }).query('skip')

          expect(arraysEqual(parser([req.query.skip]), skip)).toBeTruthy()
          expect(Array.isArray(skip)).toBeTruthy()
        })

        it('list in query', () => {
          const req: any = { query: { skip: ['10', '100'] } }
          const parser = (xs: string[]) => xs.map(Number)

          const { skip } = parseRequest(req).list({ parser }).query('skip')

          expect(arraysEqual(parser(req.query.skip), skip)).toBeTruthy()
          expect(Array.isArray(skip)).toBeTruthy()
        })

        it('nothing in query', () => {
          const req: any = { query: {} }
          const parser = (xs: string[]) => xs.map(Number)

          const { skip } = parseRequest(req).list({ parser }).query('skip')

          expect(skip).toBeUndefined()
        })
      })
    })
  })
})

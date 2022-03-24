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

// eslint directives:
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-plusplus */
/* eslint-disable no-useless-concat */
/* eslint-disable prefer-destructuring */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-reason extends object.prototype */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */

import { ApiServer } from '@mds-core/mds-api-server'
import type { GeographyWithMetadataDomainModel } from '@mds-core/mds-geography-service'
import { GeographyRepository, GeographyServiceClient, GeographyServiceManager } from '@mds-core/mds-geography-service'
import {
  GEOGRAPHY2_UUID,
  GEOGRAPHY_UUID,
  LA_CITY_BOUNDARY,
  POLICY_UUID,
  restrictedAreas,
  SCOPED_AUTH
} from '@mds-core/mds-test-data'
import { pathPrefix, uuid } from '@mds-core/mds-utils'
import supertest from 'supertest'
import { api } from '../api'
import { GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION } from '../types'

const request = supertest(ApiServer(api))

const APP_JSON = 'application/vnd.mds.geography-author+json; charset=utf-8; version=1.0'
const EMPTY_SCOPE = SCOPED_AUTH([], '')
const EVENTS_READ_SCOPE = SCOPED_AUTH(['events:read'])
const GEOGRAPHIES_WRITE_SCOPE = SCOPED_AUTH(['geographies:write'])
const GEOGRAPHIES_READ_PUBLISHED_SCOPE = SCOPED_AUTH(['geographies:read:published'])
const GEOGRAPHIES_READ_UNPUBLISHED_SCOPE = SCOPED_AUTH(['geographies:read:unpublished'])
const GEOGRAPHIES_BOTH_READ_SCOPES = SCOPED_AUTH(['geographies:read:published', 'geographies:read:unpublished'])
const GEOGRAPHIES_PUBLISH_SCOPE = SCOPED_AUTH(['geographies:publish'])

const GeographyServer = GeographyServiceManager.controller()

describe('Tests app', () => {
  describe('Geography endpoint tests', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    beforeAll(async () => {
      await GeographyRepository.deleteAll()
      await GeographyServer.start()
    })

    afterAll(async () => {
      await GeographyServer.stop()
      await GeographyRepository.deleteAll()
    })

    // Geography endpoints
    it('cannot POST one current geography (no auth)', async () => {
      const geography = { geography_id: GEOGRAPHY_UUID, geography_json: LA_CITY_BOUNDARY }
      await request.post(pathPrefix(`/geographies`)).set('Authorization', EMPTY_SCOPE).send(geography).expect(403)
    })

    it('creates one current geography', async () => {
      const geography = { name: 'LA', geography_id: GEOGRAPHY_UUID, geography_json: LA_CITY_BOUNDARY }

      await request
        .post(pathPrefix(`/geographies`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(201)
    })

    it('cannot update one geography (no auth)', async () => {
      const geography = { geography_id: GEOGRAPHY_UUID, geography_json: restrictedAreas }
      await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY_UUID}`))
        .set('Authorization', EMPTY_SCOPE)
        .send(geography)
        .expect(403)
    })

    it('verifies updating one geography', async () => {
      const geography = { name: 'LA', geography_id: GEOGRAPHY_UUID, geography_json: restrictedAreas }
      const result = await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY_UUID}`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(201)

      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('verifies cannot PUT bad geography', async () => {
      const geography = { name: 'LA', geography_id: GEOGRAPHY_UUID, geography_json: 'garbage_json' }
      const result = await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY_UUID}`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(400)

      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('verifies cannot PUT non-existent geography', async () => {
      const geography = { name: 'LA', geography_id: POLICY_UUID, geography_json: restrictedAreas }
      const result = await request
        .put(pathPrefix(`/geographies/${POLICY_UUID}`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(404)

      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('verifies cannot POST invalid geography', async () => {
      const geography = { name: 'LA', geography_id: GEOGRAPHY_UUID, geography_json: 'garbage_json' }
      const result = await request
        .post(pathPrefix(`/geographies`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(400)

      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('cannot POST duplicate geography', async () => {
      const geography = { name: 'LA', geography_id: GEOGRAPHY_UUID, geography_json: LA_CITY_BOUNDARY }
      const result = await request
        .post(pathPrefix(`/geographies`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(409)

      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('can publish a geography (correct auth)', async () => {
      await GeographyServiceClient.writeGeographies([
        { name: 'Geography 2', geography_id: GEOGRAPHY2_UUID, geography_json: restrictedAreas }
      ])
      const result = await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY2_UUID}/publish`))
        .set('Authorization', GEOGRAPHIES_PUBLISH_SCOPE)
        .expect(200)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
      expect(result.body.version === GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION).toBeTruthy()
      expect(result.body.data.geography.geography_id === GEOGRAPHY2_UUID).toBeTruthy()
      expect(result.body.data.geography.publish_date).toBeTruthy()
    })

    it('cannot publish a geography (wrong auth)', async () => {
      await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY2_UUID}/publish`))
        .set('Authorization', EMPTY_SCOPE)
        .expect(403)
    })

    it('cannot delete a geography (incorrect auth)', async () => {
      await request
        .delete(pathPrefix(`/geographies/${GEOGRAPHY2_UUID}`))
        .set('Authorization', EMPTY_SCOPE)
        .expect(403)
    })

    it('can delete a geography (correct auth)', async () => {
      const testUUID = uuid()
      await GeographyServiceClient.writeGeographies([
        { geography_id: testUUID, geography_json: LA_CITY_BOUNDARY, name: 'testafoo' }
      ])
      await GeographyServiceClient.writeGeographiesMetadata([
        { geography_id: testUUID, geography_metadata: { foo: 'afoo' } }
      ])

      await request
        .delete(pathPrefix(`/geographies/${testUUID}`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .expect(200)

      const geography = await GeographyServiceClient.getGeography(testUUID, { includeMetadata: true })
      expect(geography).not.toBeDefined()
    })

    it('cannot delete a published geography (correct auth)', async () => {
      await request
        .delete(pathPrefix(`/geographies/${GEOGRAPHY2_UUID}`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .expect(405)
    })

    it('sends the correct error code if something blows up on the backend during delete', async () => {
      jest.spyOn(GeographyServiceClient, 'deleteGeographyAndMetadata').mockImplementation(() => {
        throw new Error('random backend err')
      })
      await request
        .delete(pathPrefix(`/geographies/${GEOGRAPHY_UUID}`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .expect(500)
    })
  })

  // Geography metadata endpoints

  describe('Geography metadata endpoint tests', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    beforeAll(async () => {
      await GeographyRepository.deleteAll()
      await GeographyServer.start()
      await GeographyServiceClient.writeGeographies([
        { name: 'Geography 1', geography_id: GEOGRAPHY_UUID, geography_json: LA_CITY_BOUNDARY },
        { name: 'Geography 2', geography_id: GEOGRAPHY2_UUID, geography_json: restrictedAreas }
      ])
      await GeographyServiceClient.publishGeography({ geography_id: GEOGRAPHY2_UUID })
    })

    afterAll(async () => {
      await GeographyServer.stop()
      await GeographyRepository.deleteAll()
    })

    it('cannot GET geography metadata (no auth)', async () => {
      request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', EMPTY_SCOPE)
        .expect(403)
    })

    it('cannot GET geography metadata (wrong auth)', async () => {
      request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', EVENTS_READ_SCOPE)
        .expect(403)
    })

    it('cannot PUT geography metadata to create (no auth)', async () => {
      const metadata = { some_arbitrary_thing: 'boop' }
      await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', EMPTY_SCOPE)
        .send({ geography_id: GEOGRAPHY_UUID, geography_metadata: metadata })
        .expect(403)
    })

    it('cannot PUT geography metadata to create (wrong auth)', async () => {
      const metadata = { some_arbitrary_thing: 'boop' }
      await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', EVENTS_READ_SCOPE)
        .send({ geography_id: GEOGRAPHY_UUID, geography_metadata: metadata })
        .expect(403)
    })

    it('sends the correct error code if it cannot retrieve the metadata', async () => {
      jest.spyOn(GeographyServiceClient, 'getGeography').mockImplementation(() => {
        throw new Error('err')
      })
      await request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(500)
    })

    it('verifies PUTing geography metadata to create', async () => {
      const metadata = { some_arbitrary_thing: 'boop' }
      const requestResult = await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send({ geography_id: GEOGRAPHY_UUID, geography_metadata: metadata })
        .expect(201)
      expect(requestResult.body.version).toStrictEqual(GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION)
      const result = (await GeographyServiceClient.getGeography(GEOGRAPHY_UUID, {
        includeMetadata: true
      })) as GeographyWithMetadataDomainModel<{ some_arbitrary_thing: string }>
      expect(result?.geography_metadata?.some_arbitrary_thing).toStrictEqual('boop')
    })

    it('verifies PUTing geography metadata to edit', async () => {
      const metadata = { some_arbitrary_thing: 'beep' }
      await request
        .put(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send({ geography_id: GEOGRAPHY_UUID, geography_metadata: metadata })
        .expect(200)
      const result = (await GeographyServiceClient.getGeography(GEOGRAPHY_UUID, {
        includeMetadata: true
      })) as GeographyWithMetadataDomainModel<{ some_arbitrary_thing: string }>
      expect(result.geography_metadata?.some_arbitrary_thing).toStrictEqual('beep')
    })

    it('verifies that metadata cannot be created without a preexisting geography', async () => {
      const metadata = { some_arbitrary_thing: 'beep' }
      const nonexistentGeoUUID = uuid()
      await request
        .put(pathPrefix(`/geographies/${nonexistentGeoUUID}/meta`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send({ geography_id: nonexistentGeoUUID, geography_metadata: metadata })
        .expect(404)
    })

    it('correctly retrieves all geography metadata when using only the unpublished scope', async () => {
      await GeographyServiceClient.writeGeographiesMetadata([
        { geography_id: GEOGRAPHY2_UUID, geography_metadata: { earth: 'isround' } }
      ])

      const result = await request
        .get(pathPrefix(`/geographies/meta`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geography_metadata.length).toStrictEqual(2)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('retrieves only metadata for published geographies, with the unpublished scope and get_published param', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/meta?get_published=true`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geography_metadata.length).toStrictEqual(1)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('correctly retrieves geography metadata when using the param get_unpublished', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/meta?get_unpublished=true`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geography_metadata.length).toStrictEqual(1)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('retrieves all metadata when both scopes are used', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/meta`))
        .set('Authorization', GEOGRAPHIES_BOTH_READ_SCOPES)
        .expect(200)
      expect(result.body.data.geography_metadata.length).toStrictEqual(2)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('retrieves only metadata for published geographies with both read scopes and the get_published param', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/meta?get_published=true`))
        .set('Authorization', GEOGRAPHIES_BOTH_READ_SCOPES)
        .expect(200)
      expect(result.body.data.geography_metadata.length).toStrictEqual(1)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('filters out unpublished geo metadata if only the get_published scope is set', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/meta`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_AUTHOR_API_DEFAULT_VERSION)
      expect(result.body.data.geography_metadata.length).toStrictEqual(1)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('throws an error if only the get_published scope is set and get_unpublished param is set', async () => {
      await request
        .get(pathPrefix(`/geographies/meta?get_unpublished=true`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(403)
    })

    it('cannot do bulk geography metadata reads (wrong auth)', async () => {
      await request
        .get(pathPrefix(`/geographies/meta?get_unpublished=false`))
        .set('Authorization', EVENTS_READ_SCOPE)
        .expect(403)
    })

    it('cannot do bulk geography metadata reads (no auth)', async () => {
      await request
        .get(pathPrefix(`/geographies/meta?get_published=false`))
        .set('Authorization', EMPTY_SCOPE)
        .expect(403)
    })

    it('verifies GETing a published geography metadata throws a permission error if the scope is wrong', async () => {
      request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(403)
    })

    it('verifies GETing a published geography metadata if the scope is geographies:read:unpublished', async () => {
      request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}/meta`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
    })

    it('verifies cannot GET non-existent geography metadata', async () => {
      const nonexistentID = uuid()
      const result = await request
        .get(pathPrefix(`/geographies/${nonexistentID}/meta`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(404)

      expect(result.body.error.name).toStrictEqual(`NotFoundError`)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('verifies cannot PUT geography with a publish_date', async () => {
      const geography = {
        name: 'foo',
        geography_id: GEOGRAPHY_UUID,
        publish_date: 1589817834000,
        geography_json: LA_CITY_BOUNDARY
      }
      const result = await request
        .put(pathPrefix(`/geographies/${geography.geography_id}`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(400)

      expect(result.body.error.type).toStrictEqual(`ValidationError`)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('verifies cannot POST geography with a publish_date', async () => {
      const geography = {
        name: 'foo',
        geography_id: GEOGRAPHY_UUID,
        publish_date: 1589817834000,
        geography_json: LA_CITY_BOUNDARY
      }
      const result = await request
        .post(pathPrefix(`/geographies`))
        .set('Authorization', GEOGRAPHIES_WRITE_SCOPE)
        .send(geography)
        .expect(400)

      expect(result.body.error.type).toStrictEqual(`ValidationError`)
      expect(result.headers).toHaveProperty('content-type', APP_JSON)
    })

    it('fails to hit non-existent endpoint with a 404', async () => {
      request.get(pathPrefix(`/foobar`)).set('Authorization', GEOGRAPHIES_WRITE_SCOPE).expect(404)
    })
  })
})

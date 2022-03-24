/**
 * Copyright 2021 City of Los Angeles
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
import type { GeographyDomainModel } from '@mds-core/mds-geography-service'
import {
  GeographyFactory,
  GeographyRepository,
  GeographyServiceManager,
  writePublishedGeography
} from '@mds-core/mds-geography-service'
import {
  DISTRICT_SEVEN,
  GEOGRAPHY2_UUID,
  GEOGRAPHY_UUID,
  LA_CITY_BOUNDARY,
  POLICY_UUID,
  SCOPED_AUTH
} from '@mds-core/mds-test-data'
import { now, pathPrefix } from '@mds-core/mds-utils'
import supertest from 'supertest'
import { api } from '../api'
import { GEOGRAPHY_API_DEFAULT_VERSION } from '../types'

const GeographyServer = GeographyServiceManager.controller()

const request = supertest(ApiServer(api))

const APP_JSON = 'application/vnd.mds-geography-api+json; charset=utf-8; version=1.0'
const EMPTY_SCOPE = SCOPED_AUTH([], '')
const EVENTS_READ_SCOPE = SCOPED_AUTH(['events:read'])
const GEOGRAPHIES_READ_PUBLISHED_SCOPE = SCOPED_AUTH(['geographies:read:published'])
const GEOGRAPHIES_READ_UNPUBLISHED_SCOPE = SCOPED_AUTH(['geographies:read:unpublished'])
const GEOGRAPHIES_BOTH_READ_SCOPES = SCOPED_AUTH(['geographies:read:published', 'geographies:read:unpublished'])

describe('Tests app', () => {
  describe('Geography endpoint tests', () => {
    beforeAll(async () => {
      await GeographyRepository.initialize()
      await GeographyRepository.deleteAll()
      await GeographyServer.start()
      await GeographyRepository.writeGeographies([
        { name: 'LA', geography_id: GEOGRAPHY_UUID, geography_json: LA_CITY_BOUNDARY }
      ])
      await writePublishedGeography(
        GeographyFactory({
          name: 'Geography 2',
          geography_id: GEOGRAPHY2_UUID,
          geography_json: DISTRICT_SEVEN,
          publish_date: now()
        })
      )
    })

    it('GETs one unpublished geography with unpublished scope', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies[0].geography_id).toStrictEqual(GEOGRAPHY_UUID)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_API_DEFAULT_VERSION)
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('cannot GET an unpublished geography with the published scope', async () => {
      await request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(403)
    })

    it('cannot GET a nonexistent geography', async () => {
      await request
        .get(pathPrefix(`/geographies/${POLICY_UUID}`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(404)
    })

    it('cannot GET geographies (no auth)', async () => {
      await request.get(pathPrefix(`/geographies/`)).set('Authorization', EMPTY_SCOPE).expect(403)
    })

    it('cannot GET geographies (wrong auth)', async () => {
      await request.get(pathPrefix(`/geographies/`)).set('Authorization', EVENTS_READ_SCOPE).expect(403)
    })

    it('can GET geographies, full version', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies).toHaveLength(1)
      result.body.data.geographies.forEach((item: GeographyDomainModel) => {
        expect(item.geography_json).toBeTruthy()
      })
      expect(result.body.version).toStrictEqual(GEOGRAPHY_API_DEFAULT_VERSION)
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('can GET geographies, summarized version', async () => {
      const result = await request
        .get(pathPrefix(`/geographies?summary=true`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies).toHaveLength(1)
      result.body.data.geographies.forEach((item: GeographyDomainModel) => {
        expect(item.geography_json).toBeFalsy()
      })
      expect(result.body.version).toStrictEqual(GEOGRAPHY_API_DEFAULT_VERSION)
    })

    it('can read a published geography with both read scopes', async () => {
      await request
        .get(pathPrefix(`/geographies/${GEOGRAPHY2_UUID}`))
        .set('Authorization', GEOGRAPHIES_BOTH_READ_SCOPES)
        .expect(200)
    })

    it('can GET one unpublished geography with unpublished scope', async () => {
      const result = await request
        .get(pathPrefix(`/geographies/${GEOGRAPHY_UUID}`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies[0].geography_id).toStrictEqual(GEOGRAPHY_UUID)
      expect(result.headers).toMatchObject({ 'content-type': APP_JSON })
    })

    it('can get all geographies, with the unpublished scope', async () => {
      const result = await request
        .get(pathPrefix(`/geographies`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies).toHaveLength(2)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_API_DEFAULT_VERSION)
    })

    it('can filter for published geographies, with the unpublished scope and get_published parameter', async () => {
      const result = await request
        .get(pathPrefix(`/geographies?get_published=true`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies).toHaveLength(1)
      expect(result.body.data.geographies[0].published_date).not.toBeNull()
      expect(result.body.version).toStrictEqual(GEOGRAPHY_API_DEFAULT_VERSION)
    })

    it('can filter for unpublished geographies, with the unpublished scope and get_unpublished parameter', async () => {
      const result = await request
        .get(pathPrefix(`/geographies?get_unpublished=true`))
        .set('Authorization', GEOGRAPHIES_READ_UNPUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies).toHaveLength(1)
      expect(result.body.data.geographies[0].published_date).toBeUndefined()
      expect(result.body.version).toStrictEqual(GEOGRAPHY_API_DEFAULT_VERSION)
    })

    it('can only GET unpublished geographies, with only the published scope', async () => {
      const result = await request
        .get(pathPrefix(`/geographies`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(200)
      expect(result.body.data.geographies).toHaveLength(1)
      expect(result.body.version).toStrictEqual(GEOGRAPHY_API_DEFAULT_VERSION)
    })

    it('throws an error if only the get_published scope is set and get_unpublished param is set', async () => {
      await request
        .get(pathPrefix(`/geographies?get_unpublished=true`))
        .set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE)
        .expect(403)
    })

    it('throws an error if both the get_published param and the get_unpublished param is set', async () => {
      await request
        .get(pathPrefix(`/geographies?get_unpublished=true&get_published=true`))
        .set('Authorization', GEOGRAPHIES_BOTH_READ_SCOPES)
        .expect(500)
    })

    it('fails to hit non-existent endpoint with a 404', async () => {
      await request.get(pathPrefix(`/foobar`)).set('Authorization', GEOGRAPHIES_READ_PUBLISHED_SCOPE).expect(404)
    })

    afterAll(async () => {
      await GeographyRepository.shutdown()
      await GeographyServer.stop()
    })
  })
})

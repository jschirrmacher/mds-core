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

import { venice } from '@mds-core/mds-test-data'
import { uuid, yesterday } from '@mds-core/mds-utils'
import type { FeatureCollection } from 'geojson'
import type { GeographyDomainModel } from '../@types'
import { GeographyServiceClient } from '../client'

export const writePublishedGeography = async (geography: GeographyDomainModel) => {
  await GeographyServiceClient.writeGeographies([
    { geography_id: geography.geography_id, geography_json: geography.geography_json }
  ])
  return await GeographyServiceClient.publishGeography({
    geography_id: geography.geography_id,
    publish_date: geography.publish_date as number
  })
}

export const GeographyFactory = (overrides = {}): GeographyDomainModel => ({
  name: 'random geo',
  geography_id: uuid(),
  description: null,
  prev_geographies: null,
  effective_date: null,
  geography_json: venice as FeatureCollection,
  publish_date: yesterday(),
  ...overrides
})

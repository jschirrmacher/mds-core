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

import type { FeatureCollection, Geometry } from 'geojson'
import type { GeographyDomainModel } from './@types'

function getPolygon(geographies: GeographyDomainModel[], geography: string): Geometry | FeatureCollection {
  const res = geographies.find((location: GeographyDomainModel) => {
    return location.geography_id === geography
  })
  if (res === undefined) {
    throw new Error(`Geography ${geography} not found in ${geographies}!`)
  }
  return res.geography_json
}

export { getPolygon }

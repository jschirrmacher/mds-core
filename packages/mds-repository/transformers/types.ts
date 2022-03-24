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

import type { SingleOrArray } from '@mds-core/mds-types'

export type ValueTransformer<From, To = From> = (value: SingleOrArray<From>) => SingleOrArray<To>

// TypeORM requires value transformers for each direction (write "to" database) and (read "from" database).
// Occasionally, the transformation only needs to happen in one direction. In such cases, it is useful to
// create the transformer using a spread syntax: { ...OneWayTransformer, from: MyValueTransformer }
export type TransformerDirection = 'read' | 'write' | 'both'

export type TransformerOptions = Partial<{
  direction: TransformerDirection
}>

export const OneWayTransformer = { to: (value: unknown) => value, from: (value: unknown) => value }

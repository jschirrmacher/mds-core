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

import { BigintTransformer, LowercaseTransformer, UppercaseTransformer } from '../transformers'

describe('Test Transformers', () => {
  it('BigIntTransformer', async () => {
    expect(BigintTransformer.to(1)).toEqual(1)
    expect(BigintTransformer.to(null)).toEqual(null)
    expect(BigintTransformer.to([1, null])).toEqual([1, null])
    expect(BigintTransformer.from('1')).toEqual(1)
    expect(BigintTransformer.from(null)).toEqual(null)
    expect(BigintTransformer.from(['1', null])).toEqual([1, null])
  })

  it('LowercaseTransformer', async () => {
    const original = ['a', 'A', null]
    const transformed = ['a', 'a', null]
    expect(LowercaseTransformer().to(original)).toEqual(transformed)
    expect(LowercaseTransformer({ direction: 'both' }).to(original)).toEqual(transformed)
    expect(LowercaseTransformer({ direction: 'read' }).to(original)).toEqual(original)
    expect(LowercaseTransformer({ direction: 'write' }).to(original)).toEqual(transformed)

    expect(LowercaseTransformer().from(original)).toEqual(transformed)
    expect(LowercaseTransformer({ direction: 'both' }).from(original)).toEqual(transformed)
    expect(LowercaseTransformer({ direction: 'read' }).from(original)).toEqual(transformed)
    expect(LowercaseTransformer({ direction: 'write' }).from(original)).toEqual(original)
  })

  it('UppercaseTransformer', async () => {
    const original = ['a', 'A', null]
    const transformed = ['A', 'A', null]
    expect(UppercaseTransformer().to(original)).toEqual(transformed)
    expect(UppercaseTransformer({ direction: 'both' }).to(original)).toEqual(transformed)
    expect(UppercaseTransformer({ direction: 'read' }).to(original)).toEqual(original)
    expect(UppercaseTransformer({ direction: 'write' }).to(original)).toEqual(transformed)

    expect(UppercaseTransformer().from(original)).toEqual(transformed)
    expect(UppercaseTransformer({ direction: 'both' }).from(original)).toEqual(transformed)
    expect(UppercaseTransformer({ direction: 'read' }).from(original)).toEqual(transformed)
    expect(UppercaseTransformer({ direction: 'write' }).from(original)).toEqual(original)
  })
})

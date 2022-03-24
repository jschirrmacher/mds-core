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

import { NotFoundError, UnsupportedTypeError } from '@mds-core/mds-utils'
import { ConfigFileReader } from '../index'

const config = ConfigFileReader.mount('./tests/data')

type TestConfigFile = { passed: boolean }

describe('Test Config File Reader', () => {
  it('Missing Mount', async () => {
    expect(() => ConfigFileReader.mount('./not-found')).toThrow(NotFoundError)
  })

  it('Missing File', async () => {
    expect(config.fileExists('missing', 'txt')).toEqual(false)
    await expect(() => config.readFile('missing', '.txt')).rejects.toThrowError(NotFoundError)
  })

  it('Missing Config File', async () => {
    expect(config.configFileExists('missing')).toEqual(false)
    await expect(() => config.readConfigFile('missing')).rejects.toThrowError(NotFoundError)
  })

  it('Exising JSON File', async () => {
    expect(config.configFileExists('good-json')).toEqual(true)
    expect(config.configFileExists('good-json', 'json')).toEqual(true)
    const test = await config.readConfigFile<TestConfigFile>('good-json')
    expect(test.passed).toEqual(true)
  })

  it('Exising JSON5 File', async () => {
    expect(config.configFileExists('good-json5')).toEqual(true)
    expect(config.configFileExists('good-json5', 'json5')).toEqual(true)
    const test = await config.readConfigFile<TestConfigFile>('good-json5')
    expect(test.passed).toEqual(true)
  })

  it('Exising YAML File', async () => {
    expect(config.configFileExists('good-yaml')).toEqual(true)
    expect(config.configFileExists('good-yaml', 'yaml')).toEqual(true)
    const test = await config.readConfigFile<TestConfigFile>('good-yaml')
    expect(test.passed).toEqual(true)
  })

  it('File Not JSON', async () => {
    await expect(() => config.readConfigFile('bad-json', 'json')).rejects.toThrowError(UnsupportedTypeError)
    await expect(() => config.readConfigFile('bad-json5', 'json5')).rejects.toThrowError(UnsupportedTypeError)
    await expect(() => config.readConfigFile('bad-yaml', 'yaml')).rejects.toThrowError(UnsupportedTypeError)
    await expect(() => config.readConfigFile('bad-json')).rejects.toThrowError(UnsupportedTypeError)
    await expect(() => config.readConfigFile('bad-json5')).rejects.toThrowError(UnsupportedTypeError)
    await expect(() => config.readConfigFile('bad-yaml')).rejects.toThrowError(UnsupportedTypeError)
  })

  it('Existing non-JSON File', async () => {
    const file = await config.readFile('good', 'txt')
    expect(file).toEqual('good')
  })
})

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

import { ServiceException, ServiceResponse, ServiceResult } from '@mds-core/mds-service-helpers'
import { NotFoundError, UnsupportedTypeError } from '@mds-core/mds-utils'
import fs from 'fs'
import JSON5 from 'json5'
import { homedir } from 'os'
import { format, normalize } from 'path'
import { promisify } from 'util'

export const getSettingsFolder = () => {
  const { MDS_CONFIG_PATH = '/mds-config' } = process.env
  return MDS_CONFIG_PATH.replace('~', homedir())
}

const getFilePath = (property: string, ext: '.json' | '.json5'): string => {
  return normalize(format({ dir: getSettingsFolder(), name: property, ext }))
}

const readFileAsync = promisify(fs.readFile)
const readFile = async (path: string): Promise<string> => {
  try {
    const utf8 = await readFileAsync(path, { encoding: 'utf8' })
    return utf8
  } catch (error) {
    throw new NotFoundError('Settings File Not Found', { error, path })
  }
}

const parseJson = <TSettings extends {}>(
  json: string,
  { parser = JSON }: Partial<{ parser: Pick<JSON, 'parse' | 'stringify'> }> = {}
): TSettings => {
  try {
    return parser.parse(json) as TSettings
  } catch (error) {
    throw new UnsupportedTypeError('Settings File must contain JSON', { error })
  }
}

export const readJsonFile = async <TSettings extends {}>(property: string): Promise<ServiceResponse<TSettings>> => {
  try {
    const json5 = await readFile(getFilePath(property, '.json5'))
    return ServiceResult(parseJson<TSettings>(json5, { parser: JSON5 }))
  } catch {
    try {
      const json = await readFile(getFilePath(property, '.json'))
      return ServiceResult(parseJson<TSettings>(json))
    } catch (error) {
      return ServiceException('readJsonFile Error', error)
    }
  }
}

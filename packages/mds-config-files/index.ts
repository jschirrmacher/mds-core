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
import { cleanEnv, str } from 'envalid'
import fs from 'fs'
import JSON5 from 'json5'
import { homedir } from 'os'
import { format, normalize } from 'path'
import YAML from 'yamljs'

const ConfigFileExtensions = <const>['json', 'json5', 'yaml']
type ConfigFileExtension = typeof ConfigFileExtensions[number]

type FileParser = <T>(file: string) => T

const readFile = async (path: string): Promise<string> => {
  try {
    return await fs.promises.readFile(path, { encoding: 'utf8' })
  } catch {
    throw new NotFoundError(`File Not Found: ${path}`, { path })
  }
}

const fileExists = (path: string) => fs.existsSync(path)

export const ConfigFileReader = {
  mount: (path?: string) => {
    const dir = (
      path ?? cleanEnv(process.env, { MDS_CONFIG_PATH: str({ default: '/mds-config' }) }).MDS_CONFIG_PATH
    ).replace('~', homedir())

    if (!fileExists(dir)) {
      throw new NotFoundError(`Mount Path Not Found: ${dir}`, { path: dir })
    }

    const getFilePath = (name: string, ext?: string): string => {
      return normalize(format({ dir, name, ext: ext && (ext.startsWith('.') ? ext : `.${ext}`) }))
    }

    const parseFile = <T>(name: string, ext: ConfigFileExtension) => {
      const file = getFilePath(name, ext)
      return {
        using: async (parser: FileParser) => {
          try {
            return parser(await readFile(file)) as T
          } catch (error) {
            throw error instanceof NotFoundError
              ? error
              : new UnsupportedTypeError(`Expected ${ext.toUpperCase()} File: ${file}`, { file })
          }
        }
      }
    }

    const parseJsonFile = <T>(name: string) => parseFile<T>(name, 'json').using(JSON.parse)
    const parseJson5File = <T>(name: string) => parseFile<T>(name, 'json5').using(JSON5.parse)
    const parseYamlFile = <T>(name: string) => parseFile<T>(name, 'yaml').using(YAML.parse)

    return {
      path: dir,
      fileExists: (name: string, extension?: string) => fileExists(getFilePath(name, extension)),
      readFile: async (name: string, extension?: string) => readFile(getFilePath(name, extension)),
      configFileExists: (name: string, extension?: ConfigFileExtension) =>
        extension
          ? fileExists(getFilePath(name, extension))
          : ConfigFileExtensions.some(ext => fileExists(getFilePath(name, ext))),
      readConfigFile: async <T>(name: string, extension?: ConfigFileExtension): Promise<T> => {
        switch (extension) {
          case 'json':
            return await parseJsonFile(name)
          case 'json5':
            return await parseJson5File(name)
          case 'yaml':
            return await parseYamlFile(name)
          default:
            try {
              return await parseJson5File(name)
            } catch (json5) {
              if (json5 instanceof NotFoundError) {
                try {
                  return await parseJsonFile(name)
                } catch (json) {
                  if (json instanceof NotFoundError) {
                    return await parseYamlFile(name)
                  }
                  throw json
                }
              }
              throw json5
            }
        }
      }
    }
  }
}

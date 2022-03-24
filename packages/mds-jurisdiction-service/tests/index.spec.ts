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

import { days, uuid } from '@mds-core/mds-utils'
import { JurisdictionServiceClient } from '../index'
import { JurisdictionRepository } from '../repository'
import { JurisdictionServiceManager } from '../service/manager'

const records = 5_000

const JURISDICTION_ID = uuid()
const TODAY = Date.now()
const YESTERDAY = TODAY - days(1)
const LAST_WEEK = TODAY - days(7)

const JurisdictionServer = JurisdictionServiceManager.controller()

describe('Jurisdiction Repository Tests', () => {
  beforeAll(async () => {
    await JurisdictionRepository.initialize()
  })

  it('Run Migrations', async () => {
    await JurisdictionRepository.runAllMigrations()
  })

  it('Revert Migrations', async () => {
    await JurisdictionRepository.revertAllMigrations()
  })

  afterAll(async () => {
    await JurisdictionRepository.shutdown()
  })
})

describe('Jurisdiction Service Tests', () => {
  beforeAll(async () => {
    await JurisdictionServer.start()
  })

  it(`Write ${records} Jurisdiction${records > 1 ? 's' : ''}`, async () => {
    try {
      const jurisdictions = await JurisdictionServiceClient.createJurisdictions(
        Array.from({ length: records }, (_, index) => ({
          jurisdiction_id: index ? uuid() : JURISDICTION_ID,
          agency_key: `agency-key-${index}`,
          agency_name: `Agency Name ${index}`,
          timestamp: YESTERDAY,
          geography_id: uuid()
        }))
      )
      expect(jurisdictions[0]?.jurisdiction_id).toStrictEqual(JURISDICTION_ID)
    } catch (error) {
      expect(error).toStrictEqual(null)
    }
  })

  it(`Read ${records} Jurisdiction${records > 1 ? 's' : ''}`, async () => {
    try {
      const jurisdictions = await JurisdictionServiceClient.getJurisdictions()
      expect(jurisdictions.length).toStrictEqual(records)
      expect(jurisdictions[0]?.jurisdiction_id).toStrictEqual(JURISDICTION_ID)
    } catch (error) {
      expect(error).toStrictEqual(null)
    }
  })

  it('Write One Jurisdiction', async () => {
    try {
      const jurisdiction = await JurisdictionServiceClient.createJurisdiction({
        agency_key: 'agency-key-one',
        agency_name: 'Agency Name One',
        geography_id: uuid()
      })
      expect(jurisdiction).not.toStrictEqual(null)
      expect(jurisdiction.jurisdiction_id).not.toStrictEqual(null)
      expect(jurisdiction.timestamp).not.toStrictEqual(null)
    } catch (error) {
      expect(error).toStrictEqual(null)
    }
  })

  it('Write One Jurisdiction (duplicate id)', async () => {
    try {
      const result = await JurisdictionServiceClient.createJurisdiction({
        jurisdiction_id: JURISDICTION_ID,
        agency_key: 'agency-key-two',
        agency_name: 'Agency Name One',
        geography_id: uuid()
      })
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('ConflictError')
    }
  })

  it('Write One Jurisdiction (duplicate key)', async () => {
    try {
      const result = await JurisdictionServiceClient.createJurisdiction({
        agency_key: 'agency-key-one',
        agency_name: 'Agency Name One',
        geography_id: uuid()
      })
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('ConflictError')
    }
  })

  it('Write One Jurisdiction (validation error)', async () => {
    try {
      const result = await JurisdictionServiceClient.createJurisdiction({
        agency_key: ' ',
        agency_name: 'Agency Name One',
        geography_id: uuid()
      })
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('ValidationError')
    }
  })

  it('Update One Jurisdiction (invalid jurisdiction_id)', async () => {
    try {
      const result = await JurisdictionServiceClient.updateJurisdiction(JURISDICTION_ID, {
        jurisdiction_id: uuid(),
        agency_name: 'Some New Name',
        timestamp: TODAY
      })
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('ConflictError')
    }
  })

  it('Update One Jurisdiction (invalid timestamp)', async () => {
    try {
      const result = await JurisdictionServiceClient.updateJurisdiction(JURISDICTION_ID, {
        agency_name: 'Some New Name',
        timestamp: LAST_WEEK
      })
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('ValidationError')
    }
  })

  it('Update One Jurisdiction (not found)', async () => {
    try {
      const result = await JurisdictionServiceClient.updateJurisdiction(uuid(), {
        agency_name: 'Some New Name',
        timestamp: TODAY
      })
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('NotFoundError')
    }
  })

  it('Update One Jurisdiction', async () => {
    try {
      const jurisdiction = await JurisdictionServiceClient.updateJurisdiction(JURISDICTION_ID, {
        agency_name: 'Some New Name',
        timestamp: TODAY
      })
      expect(jurisdiction).not.toStrictEqual(null)
      expect(jurisdiction.jurisdiction_id).toStrictEqual(JURISDICTION_ID)
      expect(jurisdiction.timestamp).toStrictEqual(TODAY)
    } catch (error) {
      expect(error).toStrictEqual(null)
    }
  })

  it('Read Specific Jurisdiction (current version)', async () => {
    try {
      const jurisdiction = await JurisdictionServiceClient.getJurisdiction(JURISDICTION_ID)
      expect(jurisdiction).not.toStrictEqual(null)
      expect(jurisdiction.jurisdiction_id).toStrictEqual(JURISDICTION_ID)
      expect(jurisdiction.timestamp).toStrictEqual(TODAY)
    } catch (error) {
      expect(error).toStrictEqual(null)
    }
  })

  it('Read Specific Jurisdiction (prior version)', async () => {
    try {
      const jurisdiction = await JurisdictionServiceClient.getJurisdiction(JURISDICTION_ID, {
        effective: YESTERDAY
      })
      expect(jurisdiction).not.toStrictEqual(null)
      expect(jurisdiction.jurisdiction_id).toStrictEqual(JURISDICTION_ID)
      expect(jurisdiction.timestamp).toStrictEqual(YESTERDAY)
    } catch (error) {
      expect(error).toStrictEqual(null)
    }
  })

  it('Read Specific Jurisdiction (no version)', async () => {
    try {
      const result = await JurisdictionServiceClient.getJurisdiction(JURISDICTION_ID, {
        effective: LAST_WEEK
      })
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('NotFoundError')
    }
  })

  it('Read Missing Jurisdiction', async () => {
    try {
      const result = await JurisdictionServiceClient.getJurisdiction(uuid())
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('NotFoundError')
    }
  })

  it('Delete One Jurisdiction', async () => {
    try {
      const jurisdiction = await JurisdictionServiceClient.deleteJurisdiction(JURISDICTION_ID)
      expect(jurisdiction).not.toStrictEqual(null)
      expect(jurisdiction.jurisdiction_id).toStrictEqual(JURISDICTION_ID)
    } catch (error) {
      expect(error).toStrictEqual(null)
    }
  })

  it('Delete One Jurisdiction (not found)', async () => {
    try {
      const result = await JurisdictionServiceClient.deleteJurisdiction(JURISDICTION_ID)
      expect(result).toStrictEqual(null)
    } catch (error: any) {
      expect(error.type).toStrictEqual('NotFoundError')
    }
  })

  afterAll(async () => {
    await JurisdictionServer.stop()
  })
})

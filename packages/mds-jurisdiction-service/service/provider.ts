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

import { ProcessController, ServiceException, ServiceProvider, ServiceResult } from '@mds-core/mds-service-helpers'
import { JurisdictionService, JurisdictionServiceRequestContext } from '../@types'
import { JurisdictionServiceLogger } from '../logger'
import { JurisdictionRepository } from '../repository'
import { ValidateJurisdictionForCreate } from './validators'

export const JurisdictionServiceProvider: ServiceProvider<JurisdictionService, JurisdictionServiceRequestContext> &
  ProcessController = {
  start: JurisdictionRepository.initialize,
  stop: JurisdictionRepository.shutdown,

  createJurisdiction: async (context, model) => {
    try {
      const [jurisdiction] = await JurisdictionRepository.createJurisdictions(
        [model].map(ValidateJurisdictionForCreate)
      )

      if (!jurisdiction) {
        throw new Error('Failed to create jurisdiction')
      }

      return ServiceResult(jurisdiction)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Creating Jurisdiction', error)
      JurisdictionServiceLogger.error('createJurisdiction error', { exception, error })
      return exception
    }
  },

  createJurisdictions: async (context, models) => {
    try {
      const jurisdictions = await JurisdictionRepository.createJurisdictions(models.map(ValidateJurisdictionForCreate))
      return ServiceResult(jurisdictions)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Creating Jurisdictions', error)
      JurisdictionServiceLogger.error('createJurisdictions error', { exception, error })
      return exception
    }
  },

  deleteJurisdiction: async (context, jurisdiction_id) => {
    try {
      const deleted = await JurisdictionRepository.deleteJurisdiction(jurisdiction_id)
      return ServiceResult(deleted)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Deleting Jurisdiction', error)
      JurisdictionServiceLogger.error('deleteJurisdiction error', { exception, error })
      return exception
    }
  },

  getJurisdiction: async (context, jurisdiction_id, options) => {
    try {
      const jurisdiction = await JurisdictionRepository.readJurisdiction(jurisdiction_id, options ?? {})
      return ServiceResult(jurisdiction)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Reading Jurisdiction', error)
      JurisdictionServiceLogger.error('getJurisdiction error', { exception, error })
      return exception
    }
  },

  getJurisdictions: async (context, options) => {
    try {
      const jurisdicitons = await JurisdictionRepository.readJurisdictions(options ?? {})
      return ServiceResult(jurisdicitons)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Reading Jurisdictions', error)
      JurisdictionServiceLogger.error('getJurisdictions error', { exception, error })
      return exception
    }
  },

  updateJurisdiction: async (context, jurisdiction_id, jurisdiction) => {
    try {
      const updated = await JurisdictionRepository.updateJurisdiction(jurisdiction_id, jurisdiction)
      return ServiceResult(updated)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Updating Jurisdiction', error)
      JurisdictionServiceLogger.error('updateJurisdiction error', { exception, error })
      return exception
    }
  }
}

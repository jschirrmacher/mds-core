/**
 * Copyright 2020 City of Los Angeles
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

import type { ProcessController, ServiceProvider } from '@mds-core/mds-service-helpers'
import { ServiceException, ServiceResult } from '@mds-core/mds-service-helpers'
import { NotFoundError } from '@mds-core/mds-utils'
import type { GeographyDomainModel, GeographyService, GeographyServiceRequestContext } from '../@types'
import { GeographyServiceLogger } from '../logger'
import { GeographyRepository } from '../repository'
import {
  validateGeographyDomainCreateModel,
  validateGeographyMetadataDomainCreateModel,
  validateGetGeographiesOptions,
  validateGetPublishedGeographiesOptions,
  validateUuids
} from './validators'

export const GeographyServiceProvider: ServiceProvider<GeographyService, GeographyServiceRequestContext> &
  ProcessController = {
  start: GeographyRepository.initialize,
  stop: GeographyRepository.shutdown,

  getGeographies: async (context, options) => {
    try {
      const geographies = await GeographyRepository.getGeographies(validateGetGeographiesOptions(options ?? {}))
      return ServiceResult(geographies)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Getting Geographies', error)
      GeographyServiceLogger.error('getGeographies error', { exception, error })
      return exception
    }
  },

  getUnpublishedGeographies: async (context, options) => {
    try {
      const geographies = await GeographyRepository.getUnpublishedGeographies(
        validateGetGeographiesOptions(options ?? {})
      )
      return ServiceResult(geographies)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Getting Unpublished Geographies', error)
      GeographyServiceLogger.error('getUnpublishedGeographies error', { exception, error })
      return exception
    }
  },

  getPublishedGeographies: async (context, options) => {
    try {
      const geographies = await GeographyRepository.getPublishedGeographies(
        validateGetPublishedGeographiesOptions(options ?? {})
      )
      return ServiceResult(geographies)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Getting Published Geographies', error)
      GeographyServiceLogger.error('getPublishedGeographies error', { exception, error })
      return exception
    }
  },

  getGeography: async (context, geography_id, options) => {
    try {
      const geography = await GeographyRepository.getGeography(
        geography_id,
        validateGetGeographiesOptions(options ?? {})
      )
      return ServiceResult(geography)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Getting Geography', error)
      GeographyServiceLogger.error('getGeography error', { exception, error })
      return exception
    }
  },

  writeGeographies: async (context, models) => {
    try {
      const geographies = await GeographyRepository.writeGeographies(models.map(validateGeographyDomainCreateModel))
      return ServiceResult(geographies)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Writing Geographies', error)
      GeographyServiceLogger.error('writeGeographies error', { exception, error })
      return exception
    }
  },

  publishGeography: async (context, geography_id) => {
    try {
      const geography = await GeographyRepository.publishGeography(geography_id)
      return ServiceResult(geography)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Publishing Geography', error)
      GeographyServiceLogger.error('publishGeography error', { exception, error })
      return exception
    }
  },

  writeGeographiesMetadata: async (context, models) => {
    try {
      const metadata = await GeographyRepository.writeGeographiesMetadata(
        models.map(validateGeographyMetadataDomainCreateModel)
      )
      return ServiceResult(metadata)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Writing Geographies Metadata', error)
      GeographyServiceLogger.error('writeGeographiesMetadata error', { exception, error })
      return exception
    }
  },

  deleteGeographyAndMetadata: async (context, geography_id) => {
    try {
      await GeographyRepository.deleteGeography(geography_id)
      await GeographyRepository.deleteGeographyMetadata(geography_id)
      return ServiceResult(geography_id)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error deleting Geography Metadata', error)
      GeographyServiceLogger.error('deleteGeographyMetadata error', { exception, error })
      return exception
    }
  },

  editGeography: async (context, model) => {
    try {
      const geography = await GeographyRepository.editGeography(validateGeographyDomainCreateModel(model))
      return ServiceResult(geography)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Editing Geographies', error)
      GeographyServiceLogger.error('editGeography error', { exception, error })
      return exception
    }
  },

  editGeographyMetadata: async (context, model) => {
    try {
      const existingGeo = await GeographyRepository.getGeography(model.geography_id, { includeMetadata: true })
      if (!existingGeo?.geography_metadata) {
        throw new NotFoundError('cannot find Geography Metadata')
      }

      const [geography_metadata] = await GeographyRepository.writeGeographiesMetadata([
        validateGeographyMetadataDomainCreateModel(model)
      ])

      if (!geography_metadata) {
        throw new NotFoundError('cannot find Geography Metadata')
      }

      return ServiceResult(geography_metadata)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Editing Geography Metadata', error)
      GeographyServiceLogger.error('editGeographyMetadata error', { exception, error })
      return exception
    }
  },

  getGeographiesByIds: async (context, geography_ids) => {
    try {
      const geographies = await GeographyRepository.getGeographiesByIds(validateUuids(geography_ids))

      const geographyMap = geographies.reduce<{ [k: string]: GeographyDomainModel | undefined }>((acc, geography) => {
        acc[geography.geography_id] = geography
        return acc
      }, {})

      // For any geography_ids which were missing in the DB, set to null in result
      const result = geography_ids.map(geography_id => {
        const geography = geographyMap[geography_id]
        return geography ? geography : null
      })

      return ServiceResult(result)
    } catch (error) /* istanbul ignore next */ {
      const exception = ServiceException('Error Getting Geographies', error)
      GeographyServiceLogger.error('getGeographiesByIds error', { exception, error })
      return exception
    }
  }
}

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
import type { AttachmentService, AttachmentServiceRequestContext } from '../@types'
import { AttachmentServiceLogger } from '../logger'
import { AttachmentRepository } from '../repository'
import { deleteAttachmentS3, validateFile, writeAttachmentS3 } from './helpers'

export const AttachmentServiceProvider: ServiceProvider<AttachmentService, AttachmentServiceRequestContext> &
  ProcessController = {
  start: AttachmentRepository.initialize,
  stop: AttachmentRepository.shutdown,
  writeAttachment: async (context, rpc_file, attachment_list_id) => {
    try {
      const file = validateFile(rpc_file)
      const attachment = { ...(await writeAttachmentS3(file)), attachment_list_id }
      await AttachmentRepository.writeAttachment(attachment)
      return ServiceResult(attachment)
    } catch (error) {
      const exception = ServiceException('Error Writing Attachment', error)
      AttachmentServiceLogger.error('mds-attachment-service::writeAttachment error', { exception, error })
      return exception
    }
  },
  deleteAttachment: async (context, attachment_id) => {
    try {
      const attachment = await AttachmentRepository.deleteAttachment(attachment_id)

      if (!attachment) {
        throw new NotFoundError(`Attachment ${attachment_id} not found`)
      }

      await deleteAttachmentS3(attachment)

      return ServiceResult(attachment)
    } catch (error) {
      const exception = ServiceException('Error Deleting Attachment', error)
      AttachmentServiceLogger.error('mds-attachment-service::deleteAttachment error', { exception, error })
      return exception
    }
  },
  readAttachment: async (context, attachment_id) => {
    try {
      const attachment = await AttachmentRepository.readAttachment(attachment_id)
      return ServiceResult(attachment)
    } catch (error) {
      const exception = ServiceException('Error Reading Attachment', error)
      AttachmentServiceLogger.error('mds-attachment-service::readAttachment error', { exception, error })
      return exception
    }
  },
  readAttachments: async (context, options) => {
    try {
      const attachments = await AttachmentRepository.readAttachments(options)
      return ServiceResult(attachments)
    } catch (error) {
      const exception = ServiceException('Error Reading Attachments', error)
      AttachmentServiceLogger.error('mds-attachment-service::readAttachments error', { exception, error })
      return exception
    }
  }
}

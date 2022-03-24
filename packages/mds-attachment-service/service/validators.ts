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

import { SchemaValidator } from '@mds-core/mds-schema-validators'
import type { AttachmentDomainModel } from '../@types'

const uuidSchema = <const>{ type: 'string', format: 'uuid' }

export const { validate: validateAttachmentDomainModel, isValid: isValidAttachmentDomainModel } =
  SchemaValidator<AttachmentDomainModel>({
    $id: 'Attachment',
    type: 'object',
    properties: {
      attachment_id: uuidSchema,
      attachment_filename: { type: 'string' },
      base_url: { type: 'string' },
      mimetype: { type: 'string' },
      thumbnail_filename: { type: 'string', nullable: true, default: null },
      thumbnail_mimetype: { type: 'string', nullable: true, default: null },
      attachment_list_id: { type: 'string', format: 'uuid', nullable: true, default: null }
    },
    required: ['attachment_id', 'attachment_filename', 'base_url', 'mimetype']
  })

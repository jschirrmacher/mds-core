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

/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable promise/always-return */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable promise/catch-or-return */

import type { AttachmentDomainModel } from '@mds-core/mds-attachment-service'
import { AttachmentServiceClient } from '@mds-core/mds-attachment-service'
import db from '@mds-core/mds-db'
import type { Attachment, AuditAttachment, Recorded } from '@mds-core/mds-types'
import { isUUID, NotFoundError, uuid } from '@mds-core/mds-utils'
import fs from 'fs'
import { getWriteableClient } from '../../mds-db/client'
import schema from '../../mds-db/schema'
import { attachmentSummary, deleteAuditAttachment, readAttachments, writeAttachment } from '../attachments'

/* eslint-disable-next-line */
const aws = require('aws-sdk')

describe('Testing Attachments Service', () => {
  const attachmentId = uuid()
  const auditTripId = uuid()
  const baseUrl = 'http://example.com/'
  const mimetype = 'image/png'
  const extension = '.png'
  const now = Date.now()
  const attachment = {
    attachment_id: attachmentId,
    attachment_filename: attachmentId + extension,
    base_url: baseUrl,
    mimetype,
    thumbnail_filename: `${attachmentId}.thumbnail${extension}`,
    attachment_mimetype: mimetype,
    recorded: now
  } as Attachment
  const auditAttachment = {
    attachment_id: attachmentId,
    audit_trip_id: auditTripId,
    recorded: now
  } as AuditAttachment
  const recordedAttachment = {
    ...{ id: 1 },
    ...attachment
  } as Recorded<Attachment>
  const attachmentFile = {
    fieldname: 'file',
    originalname: 'sample.png',
    encoding: '7bit',
    mimetype,
    size: 68,
    buffer: fs.readFileSync('./tests/sample.png')
  } as Express.Multer.File

  beforeAll(async () => {
    await db.reinitialize()
  })

  beforeEach(async () => {
    const client = await getWriteableClient()
    await client.query(`TRUNCATE ${schema.TABLE.attachments}, ${schema.TABLE.audit_attachments}`)
  })

  it('verify attachment summary', () => {
    const summary = attachmentSummary(attachment)
    expect(summary.attachment_id).toStrictEqual(attachment.attachment_id)
    expect(summary.attachment_url).toStrictEqual(attachment.base_url + attachment.attachment_filename)
    expect(summary.thumbnail_url).toStrictEqual(attachment.base_url + attachment.thumbnail_filename)
  })

  it('verify attachment summary (without thumbnail)', () => {
    const summary = attachmentSummary({ ...attachment, ...{ thumbnail_filename: '' } })
    expect(summary.attachment_id).toStrictEqual(attachment.attachment_id)
    expect(summary.attachment_url).toStrictEqual(attachment.base_url + attachment.attachment_filename)
    expect(summary.thumbnail_url).toStrictEqual('')
  })

  it('verify writeAttachment', async () => {
    const writeAttachmentSpy = jest.spyOn(AttachmentServiceClient, 'writeAttachment')
    writeAttachmentSpy.mockImplementationOnce(async () => attachment as AttachmentDomainModel) // casting for the sake of test happiness
    const res: Attachment | null = await writeAttachment(attachmentFile, auditTripId)
    expect(res && res.attachment_filename.includes('.png')).toStrictEqual(true)
    expect(res && res.thumbnail_filename && res.thumbnail_filename.includes('.png')).toStrictEqual(true)
    expect(res && isUUID(res.attachment_id)).toStrictEqual(true)
    expect(res && res.mimetype).toStrictEqual(mimetype)
    expect(writeAttachmentSpy).toHaveBeenCalledTimes(1)
  })

  it('verify readAttachment', async () => {
    const readAttachmentsSpy = jest.spyOn(db, 'readAttachmentsForAudit')
    readAttachmentsSpy.mockResolvedValue([recordedAttachment, recordedAttachment])
    const res: Recorded<Attachment>[] = await readAttachments(auditTripId)
    expect(readAttachmentsSpy).toHaveBeenCalledTimes(1)
    expect(res.length).toStrictEqual(2)
    expect(res[0]).toStrictEqual(recordedAttachment)
    expect(res[1]).toStrictEqual(recordedAttachment)
  })

  it('verify delete audit attachment (not found)', async () => {
    const mS3Instance = {
      deleteObject: jest.fn().mockReturnThis()
    }

    jest.mock('aws-sdk', () => {
      return { S3: jest.fn(() => mS3Instance) }
    })

    const deleteAttachmentSpy = jest.spyOn(db, 'deleteAttachment')
    const deleteAuditAttachmentSpy = jest.spyOn(db, 'deleteAuditAttachment')

    expect(() => deleteAuditAttachment(uuid(), uuid())).rejects.toThrowError(NotFoundError)

    expect(mS3Instance.deleteObject).not.toHaveBeenCalled()
    expect(deleteAttachmentSpy).not.toHaveBeenCalled()
    expect(deleteAuditAttachmentSpy).toHaveBeenCalledTimes(1)
  })

  it('verify delete audit attachment (still in use)', async () => {
    const mS3Instance = {
      deleteObject: jest.fn().mockReturnThis()
    }

    jest.mock('aws-sdk', () => {
      return { S3: jest.fn(() => mS3Instance) }
    })

    const deleteAttachmentSpy = jest.spyOn(db, 'deleteAttachment')
    const deleteAuditAttachmentSpy = jest.spyOn(db, 'deleteAuditAttachment')
    await db.writeAuditAttachment(auditAttachment)
    await db.writeAuditAttachment({ ...auditAttachment, ...{ audit_trip_id: uuid() } })
    await deleteAuditAttachment(auditAttachment.audit_trip_id, auditAttachment.attachment_id)
    expect(mS3Instance.deleteObject).not.toHaveBeenCalled()
    expect(deleteAttachmentSpy).not.toHaveBeenCalled()
    expect(deleteAuditAttachmentSpy).toHaveBeenCalledTimes(1)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await db.reinitialize()
    await db.shutdown()
  })
})

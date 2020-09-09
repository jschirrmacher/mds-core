import { uuid, now } from '@mds-core/mds-utils'
import { createConnection, ConnectionOptions, Connection } from 'typeorm'
import { ComplianceResponseRepository } from '../service/repositories/compliance-response'
import { COMPLIANCE_RESPONSE_1 } from './compliance_response_fixtures'

import ormconfig = require('../ormconfig')

const COMPLIANCE_RESPONSE_ID = uuid()

describe('Test Migrations', () => {
  const options = ormconfig as ConnectionOptions
  it(`Run Migrations for compliance`, async () => {
    const connection = await createConnection(options)
    await connection.runMigrations()
    await connection.close()
  })

  it(`writes a compliance response`, async () => {
    await ComplianceResponseRepository.writeComplianceResponse({
      compliance_response_id: COMPLIANCE_RESPONSE_ID,
      provider_id: uuid(),
      compliance_json: COMPLIANCE_RESPONSE_1,
      timestamp: now()
    })
  })

  it(`reads a compliance response`, async () => {
    const result = await ComplianceResponseRepository.getComplianceResponse({
      compliance_response_id: COMPLIANCE_RESPONSE_ID
    })
    console.log(result)
  })

  it(`Revert Migrations ${options.name}`, async () => {
    const connection = await createConnection(options)
    await connection.migrations.reduce(p => p.then(() => connection.undoLastMigration()), Promise.resolve())
    await connection.close()
  })
})

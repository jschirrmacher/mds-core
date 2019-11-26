import { tripHandler } from './src/proc-trip'
import db from '@mds-core/mds-db'
import log from '@mds-core/mds-logger'

async function processData() {
  // make sure the tables exist
  await db.initialize()
  log.info('INIT')
  await tripHandler()
}

export const main = () => {
  processData()
}

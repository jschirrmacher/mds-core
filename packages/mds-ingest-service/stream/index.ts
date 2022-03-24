export type {
  KafkaStreamConsumerOptions,
  KafkaStreamProducerOptions,
  NatsProcessorFn,
  StreamConsumer,
  StreamProducer
} from '@mds-core/mds-stream'
export * from './types'
import type { Recorded, Telemetry, TripMetadata, VehicleEvent } from '@mds-core/mds-types'
import { now } from '@mds-core/mds-utils'
import type { DeviceDomainModel } from '../@types'
import { IngestServiceLogger } from '../logger'
import { IngestStreamKafka } from './kafka'
import { IngestStreamNats } from './nats'
import type { BadDataError } from './types'

const { env } = process

async function initialize() {
  if (process.env.KAFKA_HOST) {
    await IngestStreamKafka.initialize()
  }
  if (process.env.NATS) {
    await IngestStreamNats.initialize()
  }
}
async function shutdown() {
  await IngestStreamKafka.shutdown()
  await IngestStreamNats.shutdown()
}

// put basics of vehicle in the cache
async function writeDevice(device: DeviceDomainModel) {
  if (env.NATS) {
    try {
      await IngestStreamNats.writeDevice(device)
    } catch (err) {
      IngestServiceLogger.error('Failed to write device to NATS', { err })
      throw err
    }
  }
  if (env.KAFKA_HOST) {
    try {
      await IngestStreamKafka.writeDevice(device)
    } catch (err) {
      IngestServiceLogger.error('Failed to write device to Kafka', { err })
      throw err
    }
  }
  return
}

async function writeEvent(event: VehicleEvent) {
  if (env.NATS) {
    await IngestStreamNats.writeEvent(event)
  }
  if (env.KAFKA_HOST) {
    await IngestStreamKafka.writeEvent(event)
  }
  return
}

async function writeEventError(error: BadDataError) {
  if (env.NATS) {
    await IngestStreamNats.writeEventError(error)
  }
  if (env.KAFKA_HOST) {
    await IngestStreamKafka.writeEventError(error)
  }
  return
}

// put latest locations in the cache
async function writeTelemetry(telemetry: Recorded<Telemetry>[]) {
  if (env.NATS) {
    try {
      await IngestStreamNats.writeTelemetry(telemetry)
    } catch (err) {
      IngestServiceLogger.error('Failed to write telemetry to NATS', { err })
      throw err
    }
  }
  if (env.KAFKA_HOST) {
    try {
      await IngestStreamKafka.writeTelemetry(telemetry)
    } catch (err) {
      IngestServiceLogger.error('Failed to write telemetry to Kafka', { err })
      throw err
    }
  }
  const start = now()
  const delta = now() - start
  if (delta > 200) {
    IngestServiceLogger.debug('writeTelemetry', { pointsInserted: telemetry.length, executionTime: delta })
  }
}

const writeTripMetadata = async (metadata: TripMetadata) => {
  return Promise.all([
    ...(env.NATS ? [IngestStreamNats.writeTripMetadata(metadata)] : []),
    ...(env.KAFKA_HOST ? [IngestStreamKafka.writeTripMetadata(metadata)] : [])
  ])
}

export const IngestStream = {
  initialize,
  shutdown,
  writeDevice,
  writeEvent,
  writeEventError,
  writeTelemetry,
  writeTripMetadata
}

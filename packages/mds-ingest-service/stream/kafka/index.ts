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

import stream from '@mds-core/mds-stream'
import type { Telemetry, TripMetadata, VehicleEvent } from '@mds-core/mds-types'
import { getEnvVar } from '@mds-core/mds-utils'
import type { DeviceDomainModel } from '../../@types'
import type { IngestStreamInterface } from '../types'

const { TENANT_ID } = getEnvVar({
  TENANT_ID: 'mds'
})
const deviceProducer = stream.KafkaStreamProducer<DeviceDomainModel>(`${TENANT_ID}.device`, {
  partitionKey: 'device_id'
})
const eventProducer = stream.KafkaStreamProducer<VehicleEvent>(`${TENANT_ID}.event`, { partitionKey: 'device_id' })
const eventErrorProducer = stream.KafkaStreamProducer<Partial<VehicleEvent>>(`${TENANT_ID}.event.error`)
const telemetryProducer = stream.KafkaStreamProducer<Telemetry>(`${TENANT_ID}.telemetry`, { partitionKey: 'device_id' })
const tripMetadataProducer = stream.KafkaStreamProducer<TripMetadata>(`${TENANT_ID}.trip_metadata`, {
  partitionKey: 'trip_id'
})

export const IngestStreamKafka: IngestStreamInterface = {
  initialize: async () => {
    await Promise.all([
      deviceProducer.initialize(),
      eventProducer.initialize(),
      eventErrorProducer.initialize(),
      telemetryProducer.initialize(),
      tripMetadataProducer.initialize()
    ])
  },
  writeEventError: async msg => await stream.safeWrite(eventErrorProducer, msg),
  writeEvent: async msg => await stream.safeWrite(eventProducer, msg),
  writeTelemetry: async msg => await stream.safeWrite(telemetryProducer, msg),
  writeDevice: async msg => await stream.safeWrite(deviceProducer, msg),
  writeTripMetadata: async msg => await stream.safeWrite(tripMetadataProducer, msg),
  shutdown: async () => {
    await Promise.all([
      deviceProducer.shutdown(),
      eventProducer.shutdown(),
      telemetryProducer.shutdown(),
      tripMetadataProducer.shutdown()
    ])
  }
}

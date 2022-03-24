import type { DeepPartial, Recorded, Telemetry, Timestamp, TripMetadata, UUID, VehicleEvent } from '@mds-core/mds-types'
import type { DeviceDomainModel } from '../@types'

export interface BadDataError {
  recorded: Timestamp
  provider_id: UUID
  error_message: string
  data: DeepPartial<VehicleEvent>
}

export interface IngestStreamInterface {
  writeEvent: (event: VehicleEvent) => Promise<void>
  writeEventError: (error: BadDataError) => Promise<void>
  writeTelemetry: (telemetry: Recorded<Telemetry>[]) => Promise<void>
  writeDevice: (device: DeviceDomainModel) => Promise<void>
  writeTripMetadata: (metadata: TripMetadata) => Promise<void>
  shutdown: () => Promise<void>
  initialize: () => Promise<void>
}

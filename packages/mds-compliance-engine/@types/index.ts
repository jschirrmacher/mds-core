import type { ComplianceSnapshotDomainModel } from '@mds-core/mds-compliance-service'
import type { DeviceDomainModel } from '@mds-core/mds-ingest-service'
import type { Telemetry, UUID, VehicleEvent } from '@mds-core/mds-types'

export type VehicleEventWithTelemetry = VehicleEvent & { telemetry: Telemetry }
export type MatchedVehicleWithRule = {
  [d: string]: { device: DeviceDomainModel; rule_applied?: UUID; rules_matched?: UUID[] }
}

export type ComplianceEngineResult = Pick<
  ComplianceSnapshotDomainModel,
  'vehicles_found' | 'excess_vehicles_count' | 'total_violations' | 'violating_vehicles'
>

export interface ProviderInputs {
  [key: string]: {
    filteredEvents: VehicleEvent[]
    deviceMap: {
      [d: string]: DeviceDomainModel
    }
    provider_id: string
  }
}

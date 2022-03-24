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

import type { EventDomainModel } from '@mds-core/mds-ingest-service'
import type { DomainModelCreate } from '@mds-core/mds-repository'
import type { RpcEmptyRequestContext, RpcServiceDefinition } from '@mds-core/mds-rpc-common'
import { RpcRoute } from '@mds-core/mds-rpc-common'
import type { Nullable, Timestamp, UUID, VEHICLE_TYPE } from '@mds-core/mds-types'
import type { Cursor } from 'typeorm-cursor-pagination'

export interface PaginationLinks {
  prev: string | null
  next: string | null
}

// one example -- many others are possible
export interface TripReceiptDetailsDomainModel {
  trip_id: UUID
  /**
   * Should be populated with the timestamp of the starting event
   * (trip_enter_jurisdiction | enter_jurisdiction | trip_start) for the trip.
   * If there is none, then this defaults to the ending event timestamp.
   */
  start_timestamp: Timestamp
  /**
   * Should be populated with the timestamp of the terminus event (trip_leave_jurisdiction | trip_end) for the trip.
   * If there is none, then this defaults to the starting event timestamp.
   */
  end_timestamp: Timestamp
  /**
   * Start geography used for billing.
   *
   * Because geographies may overlap, the ordering of the geographies is at the discretion of the regulating agency,
   * and their policies.
   */
  start_geography_id: Nullable<UUID>
  /**
   * Type of the starting geography. If start_geography_id is null, then this field should default to 'out_of_bound'.
   */
  start_geography_type: string
  /**
   * End geography used for billing.
   *
   * Because geographies may overlap, the ordering of the geographies is at the discretion of the regulating agency,
   * and their policies.
   */
  end_geography_id: Nullable<UUID>
  /**
   * Type of the ending geography. If start_geography_id is null, then this field should default to 'out_of_bound'.
   */
  end_geography_type: string
  /**
   * Duration of the trip in milliseconds. Null if one endpoint of the trip was out of bounds
   * and we do not know the duration. */
  duration: Nullable<number>
  /**
   * Distance in meters, given the great-circle-distance between the start & end points of the trip.
   * NOTE: This will be an under-estimate of the actual distance.
   * Null if one endpoint of the trip was out of bounds and we don't know where it started or ended.
   */
  distance: Nullable<number>
  /**
   * All events that contain this trip_id.
   */
  trip_events: EventDomainModel[]
}

export interface CurbUseDetailsDomainModel {
  trip_id: UUID
  start_timestamp: Timestamp
  end_timestamp: Timestamp
  vehicle_type: VEHICLE_TYPE
  geography_id: Nullable<UUID>
  duration: number // seconds
  trip_events: EventDomainModel[]
}

export interface ComplianceViolationDetailsDomainModel {
  violation_id: UUID
  trip_id: Nullable<UUID>
  policy_id: UUID
}

export interface CustomReceiptDetailsDomainModel {
  custom_description: string
}

export const FEE_TYPE = <const>[
  'base_fee',
  'upgrade_fee',
  'congestion_fee',
  'trip_fee',
  'parking_fee',
  'reservation_fee',
  'distance_fee',
  'tolls_fee',
  'compliance_violation_fee'
]

export type FEE_TYPE = typeof FEE_TYPE[number]

export interface ReceiptDomainModel {
  receipt_id: UUID
  timestamp: Timestamp
  /**
   * URL to fetch further details from.
   */
  origin_url: `https://${string}`
  receipt_details:
    | TripReceiptDetailsDomainModel
    | CurbUseDetailsDomainModel
    | ComplianceViolationDetailsDomainModel
    | CustomReceiptDetailsDomainModel
}

export interface TransactionDomainModel {
  transaction_id: UUID
  provider_id: UUID
  device_id: Nullable<UUID> // optional
  timestamp: Timestamp
  fee_type: FEE_TYPE
  amount: number // pennies
  receipt: ReceiptDomainModel // JSON blob
}
export type TransactionDomainCreateModel = DomainModelCreate<TransactionDomainModel>

export const TRANSACTION_OPERATION_TYPE = <const>[
  'transaction_posted',
  'invoice_generated',
  'dispute_requested',
  'dispute_approved',
  'dispute_declined',
  'dispute_canceled'
]

export type TRANSACTION_OPERATION_TYPE = typeof TRANSACTION_OPERATION_TYPE[number]

export interface TransactionOperationDomainModel {
  operation_id: UUID
  transaction_id: UUID
  // when was this change made
  timestamp: Timestamp
  operation_type: TRANSACTION_OPERATION_TYPE
  // who made this change (TODO work out authorship representation; could be human, could be api, etc.)
  author: string
}
export type TransactionOperationDomainCreateModel = DomainModelCreate<TransactionOperationDomainModel>

export const TRANSACTION_STATUS_TYPE = <const>[
  'order_submitted',
  'order_canceled',
  'order_complete',
  'order_incomplete'
]
export type TRANSACTION_STATUS_TYPE = typeof TRANSACTION_STATUS_TYPE[number]

export const SORTABLE_COLUMN = <const>['timestamp']
export type SORTABLE_COLUMN = typeof SORTABLE_COLUMN[number]

export const SORT_DIRECTION = <const>['ASC', 'DESC']
export type SORT_DIRECTION = typeof SORT_DIRECTION[number]

export interface TransactionSearchParams {
  provider_id?: UUID
  start_timestamp?: Timestamp
  end_timestamp?: Timestamp
  search_text?: string
  start_amount?: number
  end_amount?: number
  fee_type?: FEE_TYPE
  before?: string
  after?: string
  limit?: number
  order?: {
    column: SORTABLE_COLUMN
    direction: SORT_DIRECTION
  }
}

export interface TransactionStatusDomainModel {
  status_id: UUID
  transaction_id: UUID
  // when was this change made
  timestamp: Timestamp
  status_type: TRANSACTION_STATUS_TYPE
  // who made this change (TODO work out authorship representation; could be human, could be api, etc.)
  author: string
}
export type TransactionStatusDomainCreateModel = DomainModelCreate<TransactionStatusDomainModel>

export interface TransactionService {
  /**  TODO if auth token has a provider_id, it must match */
  createTransaction: (transaction: TransactionDomainCreateModel) => TransactionDomainModel
  /**  TODO if auth token has a provider_id, it must match */
  createTransactions: (transactions: TransactionDomainCreateModel[]) => TransactionDomainModel[]

  /**  if auth token has a provider_id, it must match */
  /**  read-back bulk TODO search criteria */
  getTransactions: (params: TransactionSearchParams) => { transactions: TransactionDomainModel[]; cursor: Cursor }
  /** TODO if auth token has a provider_id, it must match */
  /**  read back single */
  getTransaction: (transaction_id: TransactionDomainModel['transaction_id']) => TransactionDomainModel

  /** create an 'operation', e.g. for dispute-handling, etc. */
  /**  TODO if auth token has a provider_id, it must match */
  addTransactionOperation: (operation: TransactionOperationDomainCreateModel) => TransactionOperationDomainModel
  /** read back operations for a transaction */
  /**  TODO if auth token has a provider_id, it must match */
  getTransactionOperations: (
    transaction_id: TransactionDomainModel['transaction_id']
  ) => TransactionOperationDomainModel[]

  /** get all the status changes for this transaction (typically we won't have a ton I expect) */
  /**  TODO if auth token has a provider_id, it must match */
  getTransactionStatuses: (transaction_id: TransactionDomainModel['transaction_id']) => TransactionStatusDomainModel[]

  /**  TODO if auth token has a provider_id, it must match */
  getTransactionsStatuses: (
    tranaction_ids: TransactionDomainModel['transaction_id'][]
  ) => Record<TransactionDomainModel['transaction_id'], TransactionStatusDomainModel[]>

  /** add a new status change */
  /**  TODO if auth token has a provider_id, it must match */
  setTransactionStatus: (status: TransactionStatusDomainCreateModel) => TransactionStatusDomainModel
}

export const TransactionServiceDefinition: RpcServiceDefinition<TransactionService> = {
  createTransaction: RpcRoute<TransactionService['createTransaction']>(),
  createTransactions: RpcRoute<TransactionService['createTransactions']>(),

  getTransactions: RpcRoute<TransactionService['getTransactions']>(),
  getTransaction: RpcRoute<TransactionService['getTransaction']>(),

  addTransactionOperation: RpcRoute<TransactionService['addTransactionOperation']>(),
  getTransactionOperations: RpcRoute<TransactionService['getTransactionOperations']>(),

  getTransactionStatuses: RpcRoute<TransactionService['getTransactionStatuses']>(),
  getTransactionsStatuses: RpcRoute<TransactionService['getTransactionsStatuses']>(),
  setTransactionStatus: RpcRoute<TransactionService['setTransactionStatus']>()
}

export type TransactionServiceRequestContext = RpcEmptyRequestContext

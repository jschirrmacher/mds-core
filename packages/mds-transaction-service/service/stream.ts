/**
 * Copyright 2021 City of Los Angeles
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

import type { StreamProducer } from '@mds-core/mds-stream'
import stream from '@mds-core/mds-stream'
import { getEnvVar } from '@mds-core/mds-utils'
import type { TransactionDomainModel } from '../@types'

const { TENANT_ID } = getEnvVar({
  TENANT_ID: 'mds'
})

const transactionEventTopic = [TENANT_ID, 'transaction'].join('.')

export type KafkaTransaction = TransactionDomainModel // TODO is this needed?

export const TransactionStreamKafka: StreamProducer<KafkaTransaction> =
  stream.KafkaStreamProducer<KafkaTransaction>(transactionEventTopic)

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

import type { ExtendedKeys, Nullable, RequiredKeys } from '@mds-core/mds-types'
import { ClientDisconnectedError, ExceptionMessages, isDefined } from '@mds-core/mds-utils'
import type { Producer } from 'kafkajs'
import { Kafka } from 'kafkajs'
import { isArray } from 'util'
import { StreamLogger } from '../logger'
import type { StreamProducer } from '../stream-interface'
import { getKafkaBrokers } from './helpers'

/**
 * Gets all the keys of all required properties of T that extend string
 */
type RequiredStringKeys<T extends object> = RequiredKeys<T> & ExtendedKeys<T, string>

export interface KafkaStreamProducerOptions<TMessage> {
  clientId: string
  partitionKey: TMessage extends object ? RequiredStringKeys<TMessage> : never
}

const createStreamProducer = async <TMessage>({
  clientId = 'writer'
}: Partial<KafkaStreamProducerOptions<TMessage>> = {}) => {
  try {
    const brokers = getKafkaBrokers()

    if (!brokers) {
      return null
    }

    const kafka = new Kafka({ clientId, brokers })
    const producer = kafka.producer()
    await producer.connect()
    return producer
  } catch (err) {
    StreamLogger.error('createStreamProducer error', { err })
  }
  return null
}

const disconnectProducer = async (producer: Nullable<Producer>) => {
  if (isDefined(producer)) {
    await producer.disconnect()
  }
}

/**
 * Gets the value of a key to partition on (e.g. a device_id) if partitionKey is set in the options.
 * By default, this uses a hash of the key to determine what partition it should land on.
 * If no partitionKey is specified in the options, none will be used.
 */
const getKey = <TMessage>(msg: TMessage, options?: Partial<KafkaStreamProducerOptions<TMessage>>) => {
  const { partitionKey } = options ?? {}

  const partitionVal = partitionKey ? msg[partitionKey] : undefined

  // this type check shouldn't need to happen, but TS 4.1+ fails to guarantee that msg[partitionKey] is a string
  return typeof partitionVal === 'string' ? { key: partitionVal } : {}
}

export const KafkaStreamProducer = <TMessage>(
  topic: string,
  options?: Partial<KafkaStreamProducerOptions<TMessage>>
): StreamProducer<TMessage> => {
  let producer: Nullable<Producer> = null

  return {
    initialize: async () => {
      if (!producer) {
        producer = await createStreamProducer(options)
      }
    },
    write: async (message: TMessage[] | TMessage) => {
      if (isDefined(producer)) {
        const messages = (isArray(message) ? message : [message]).map(msg => {
          return { value: JSON.stringify(msg), ...getKey(msg, options) }
        })
        await producer.send({
          topic,
          messages
        })
        return
      }
      throw new ClientDisconnectedError(ExceptionMessages.INITIALIZE_CLIENT_MESSAGE)
    },
    shutdown: async () => {
      await disconnectProducer(producer)
      producer = null
    }
  }
}

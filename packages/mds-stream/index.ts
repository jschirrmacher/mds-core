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

import { safeWrite } from './helpers'
import { KafkaStreamConsumer, KafkaStreamProducer } from './kafka'
import { NatsStreamConsumer } from './nats/stream-consumer'
import { NatsStreamProducer } from './nats/stream-producer'
import { mockStream } from './test-utils'

export type { KafkaStreamConsumerOptions, KafkaStreamProducerOptions } from './kafka'
export type { NatsProcessorFn } from './nats/codecs'
export type { StreamConsumer, StreamProducer } from './stream-interface'

export default {
  KafkaStreamConsumer,
  KafkaStreamProducer,
  NatsStreamConsumer,
  NatsStreamProducer,
  mockStream,
  safeWrite
}

import type { Msg, SubOpts } from 'nats'
import { StringCodec } from 'nats'
import { StreamLogger } from '../logger'

/**
 * We must encode/decode messages between strings & UInt8Arrays
 */
export const { decode: decodeAsUInt8Array, encode: encodeAsUInt8Array } = StringCodec()

export type DecodedNatsMsg = { data: string } & Pick<Msg, 'subject'>

export type NatsProcessorFn = (message: DecodedNatsMsg) => void

/**
 *
 * @param processor Processor to run on each message
 * @returns Wrapped version of the processor which decodes NATS messages prior to processing
 */
export const natsCbWrapper: (processor: NatsProcessorFn) => SubOpts<Msg>['callback'] = processor => (err, msg) => {
  if (err) {
    StreamLogger.error('NATS Error', { err })
    return
  }
  const { data, subject } = msg

  const decodedMsg = { data: decodeAsUInt8Array(data), subject }
  processor(decodedMsg)
}

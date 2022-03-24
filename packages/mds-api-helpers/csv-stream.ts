/**
 * Copyright 2022 City of Los Angeles
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

import type { ApiResponse } from '@mds-core/mds-api-server'
import type { Nullable } from '@mds-core/mds-types'
import { deepPickProperties } from '@mds-core/mds-utils'
import { StatusCodes } from 'http-status-codes'
import { Parser } from 'json2csv'
import { DateTime } from 'luxon'
import type { DeepPickPath } from 'ts-deep-pick'

export type RowsWithCursor<Row, RowsKey extends string> = {
  [key in RowsKey]: Row[]
} & {
  cursor: { prev: Nullable<string>; next: Nullable<string> }
}
/**
 * Function to stream data (such as from a filtered service call against a repository) to http csv output
 *
 * Will call res.end() when done with csv output
 * @param getter function that takes no arguments and returns the first chunk of data, with a cursor
 * @param cursorGetter function that takes a cursor, and returns additional chunks, also with a cursor
 * @param rowsKey what key to use to find the actual rows in the returns of the getters,
 *                as well as what to use in the csv filename in http headers
 * @param res express response object used to stream the actual headers and csv data
 * @param fields json2csv style field definition: all fields must have label (string to put in headers) and value (key to lookup)
 * @param pick_columns optional ordered list of actual field keys to use (must match value keys in fields)
 */
export const streamCsvToHttp: <
  Row,
  RowsKey extends string,
  Col extends DeepPickPath<Row>,
  R extends ApiResponse<string>
>(
  getter: () => Promise<RowsWithCursor<Row, RowsKey>>,
  cursorGetter: (cursor: string) => Promise<RowsWithCursor<Row, RowsKey>>,
  rowsKey: RowsKey,
  res: R,
  fields: Array<{ label: string; value: Col }>,
  pick_columns?: Array<Col>
) => Promise<void> = async (getter, cursorGetter, rowsKey, res, fields, pick_columns) => {
  const parserConfig = {
    fields: pick_columns
      ? fields
          .filter(({ value }) => pick_columns.includes(value))
          .sort((a, b) => pick_columns.indexOf(a.value) - pick_columns.indexOf(b.value))
      : fields
  }
  const parser = new Parser(parserConfig)

  const { [rowsKey]: rows, cursor } = await getter()

  const chunk = pick_columns ? rows.map(row => deepPickProperties(row, pick_columns)) : rows

  res
    .status(StatusCodes.OK)
    .contentType('text/csv')
    .header('Access-Control-Expose-Headers', 'Content-Disposition')
    .header(
      'Content-Disposition',
      `attachment; filename="${rowsKey}-${DateTime.now().toFormat('yyyy-LL-dd hh.mm.ss a')}.csv"`
    )
    .write(parser.parse(chunk))

  let next = cursor.next
  const headlessParser = new Parser({
    ...parserConfig,
    header: false
  })
  while (next !== null) {
    const { [rowsKey]: rows, cursor: current } = await cursorGetter(next)
    const chunk = pick_columns ? rows.map(row => deepPickProperties(row, pick_columns)) : rows
    res.write('\n' + headlessParser.parse(chunk))
    next = current.next
  }
  return res.end()
}

#!/usr/local/bin/node
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

import { validatePolicyDomainModel } from '@mds-core/mds-policy-service'
import { readFileSync } from 'fs'
// import { days, minutes, now, uuid } from '@mds-core/mds-utils'
// import yargs from 'yargs/yargs'

const args = process.argv.slice(2)
// const argv = yargs(args).usage('Usage: [options] [files]').help('h').alias('h', 'help').options({
//   // TODO options
// }).argv

const { log } = console

// TODO use yargs correctly
log('mds-policy-linter reading', args.length, 'files')

// the list of policies that make it past the validator
const validPolicies = []

// read files
args.forEach(fn => {
  try {
    const json = readFileSync(fn).toString()
    const policiesRaw: object[] = JSON.parse(json).policies
    policiesRaw.forEach(policyRaw => {
      const validPolicy = validatePolicyDomainModel(policyRaw)
      validPolicies.push(validPolicy)
    })
  } catch (e) {
    log(`error in ${fn}: ${e}`)
  }
})

log(`read ${validPolicies.length} valid policies`)

// validate with linter
// run heuristics:
// * more than one invalidating function
// * date/time constraints e.g. can't publish retroactive Policy
// * more than one obsoleting function
// * show effective policies for arbitrary date/time
// * compute metadata e.g. when a policy becomes deprecated

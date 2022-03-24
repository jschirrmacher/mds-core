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

import { PolicyDomainCreateModel, validatePolicyDomainModel } from '@mds-core/mds-policy-service'
import { readFileSync } from 'fs'
import { describePolicy, invalidDate, num, plural, shortDate, validDate } from './utils'
// import yargs from 'yargs/yargs'

const args = process.argv.slice(2)
// const argv = yargs(args).usage('Usage: [options] [files]').help('h').alias('h', 'help').options({
//   // TODO options
// }).argv

const { log } = console

// TODO use yargs correctly
log(`mds-policy-linter reading ${plural(args.length, 'files')}`)

// the list of policies that make it past the validator
const validPolicies: PolicyDomainCreateModel[] = []

const validPolicyMap: { [key: string]: PolicyDomainCreateModel } = {}

interface LinterRule {
  name: string
  func: RuleFunction
}

const lintRules: LinterRule[] = []

// realistically I could use globals for the list of policies but that feels weird
interface RuleFunction {
  (policies: PolicyDomainCreateModel[]): void
}

function addRule(name: string, func: RuleFunction) {
  lintRules.push({ name, func })
}

addRule('check for publish_date', (policies: PolicyDomainCreateModel[]) => {
  policies.forEach(policy => {
    let reason
    if ((reason = invalidDate(policy.publish_date))) {
      log(describePolicy(policy), `does not have a valid publish_date (${policy.publish_date} is ${reason})`)
    }
  })
})

addRule('retroactive start date', (policies: PolicyDomainCreateModel[]) => {
  policies.forEach(policy => {
    if (validDate(policy.start_date) && validDate(policy.publish_date)) {
      if (policy.start_date >= num(policy.publish_date)) {
        log(describePolicy(policy), 'has a start_date prior to its publish_date')
      }
    }
  })
})

addRule('invalid prev_policy', (policies: PolicyDomainCreateModel[]) => {
  policies.forEach(policy => {
    const pp_ids: string[] = policy.prev_policies || []
    pp_ids.forEach(pp_id => {
      const prev_policy: PolicyDomainCreateModel | undefined = validPolicyMap[pp_id]
      if (prev_policy === undefined) {
        // if there's a prev_policy, it must point to a known policy
        log(describePolicy(policy), `contains prev_policy ${pp_id} which was not found in the input file(s)`)
      } else if (policy.start_date < prev_policy.start_date) {
        // if there's a prev_policy, it (usually) shouldn't be effective before the original policy's start_date
        log(
          describePolicy(policy),
          `has a start date (${shortDate(policy.start_date)}) ` +
            `prior to its previous policy's start date (${shortDate(prev_policy.start_date)})`
        )
      }
    })
  })
})

// read files
args.forEach(fn => {
  try {
    const json: string = readFileSync(fn, { encoding: 'utf8' })
    const parsed: { policies: object[] } = JSON.parse(json)
    const policiesRaw: object[] = parsed.policies ? parsed.policies : [parsed]
    policiesRaw.forEach(policyRaw => {
      try {
        const validPolicy: PolicyDomainCreateModel = validatePolicyDomainModel(policyRaw)
        validPolicies.push(validPolicy)
      } catch (e) {
        log(`error in ${JSON.stringify(policyRaw)}: ${e}`)
      }
    })
  } catch (e) {
    log(`error in ${fn}: ${e}`)
  }
})

validPolicies.forEach(policy => (validPolicyMap[policy.policy_id] = policy))

log(`read ${plural(validPolicies.length, 'valid policies')}`)

validPolicies.forEach(p => {
  log(`${p.name} has ${plural(p.rules.length, 'rules')}`)
})

lintRules.forEach(lintRule => {
  lintRule.func(validPolicies)
})

// run heuristics:
// * date/time constraints e.g. can't publish retroactive Policy
// * more than one obsoleting function
// * show effective policies for arbitrary date/time
// * compute metadata e.g. when a policy becomes deprecated

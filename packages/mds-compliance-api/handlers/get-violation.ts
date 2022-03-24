import { parseRequest } from '@mds-core/mds-api-helpers'
import type { ComplianceViolationDomainModel } from '@mds-core/mds-compliance-service'
import { ComplianceServiceClient } from '@mds-core/mds-compliance-service'
import { isUUID, NotFoundError, ValidationError } from '@mds-core/mds-utils'
import type express from 'express'
import HttpStatus from 'http-status-codes'
import type { ComplianceApiRequest, ComplianceApiResponse } from '../@types'

export type ComplianceApiGetViolationResponse = ComplianceApiResponse<{
  violation: ComplianceViolationDomainModel
}>

export const GetViolationHandler = async (
  req: ComplianceApiRequest,
  res: ComplianceApiGetViolationResponse,
  next: express.NextFunction
) => {
  try {
    const { violation_id } = parseRequest(req)
      .single({ parser: x => (isUUID(x) ? x : undefined) })
      .params('violation_id')

    if (!violation_id) {
      return next(new ValidationError('violation_id must be a valid UUID'))
    }

    const violation = await ComplianceServiceClient.getComplianceViolation({ violation_id })

    const { scopes, claims } = res.locals

    if (scopes.includes('compliance:read:provider') && !scopes.includes('compliance:read')) {
      if (!claims || violation.provider_id !== claims.provider_id) {
        throw new NotFoundError()
      }
    }

    const { version } = res.locals

    return res.status(HttpStatus.OK).send({ violation, version })
  } catch (err) {
    next(err)
  }
}

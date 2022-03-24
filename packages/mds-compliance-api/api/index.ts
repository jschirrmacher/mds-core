import type { AccessTokenScopeValidator } from '@mds-core/mds-api-server'
import { ApiErrorHandlingMiddleware, checkAccess } from '@mds-core/mds-api-server'
import { pathPrefix } from '@mds-core/mds-utils'
import type express from 'express'
import type { ComplianceApiAccessTokenScopes } from '../@types'
import {
  GetComplianceSnapshotIDsHandler,
  GetViolationDetailsSnapshotHandler,
  GetViolationPeriodsHandler
} from '../handlers'
import { GetViolationHandler } from '../handlers/get-violation'
import { ComplianceApiVersionMiddleware } from '../middleware'

const checkComplianceApiAccess = (validator: AccessTokenScopeValidator<ComplianceApiAccessTokenScopes>) =>
  checkAccess(validator)

export const api = (app: express.Express): express.Express =>
  app
    .use(ComplianceApiVersionMiddleware)
    .get(
      pathPrefix('/violation_periods'),
      checkComplianceApiAccess(
        scopes => scopes.includes('compliance:read') || scopes.includes('compliance:read:provider')
      ),
      GetViolationPeriodsHandler
    )
    .get(
      pathPrefix('/violation_details_snapshot'),
      checkComplianceApiAccess(
        scopes => scopes.includes('compliance:read') || scopes.includes('compliance:read:provider')
      ),
      GetViolationDetailsSnapshotHandler
    )
    .get(
      pathPrefix('/compliance_snapshot_ids'),
      checkComplianceApiAccess(
        scopes => scopes.includes('compliance:read') || scopes.includes('compliance:read:provider')
      ),
      GetComplianceSnapshotIDsHandler
    )
    .get(
      pathPrefix('/violation/:violation_id'),
      checkComplianceApiAccess(
        scopes => scopes.includes('compliance:read') || scopes.includes('compliance:read:provider')
      ),
      GetViolationHandler
    )
    .use(ApiErrorHandlingMiddleware)

import { ErrorCheckFunction, isServiceError } from '@mds-core/mds-service-helpers'
import {
  AlreadyPublishedError,
  AuthorizationError,
  BadParamsError,
  ConflictError,
  DependencyMissingError,
  InsufficientPermissionsError,
  NotFoundError,
  ValidationError
} from '@mds-core/mds-utils'
import type express from 'express'
import { StatusCodes } from 'http-status-codes'
import type { ApiRequest, ApiResponse } from '../@types'
import { ApiServerLogger } from '../logger'

const isValidationError = ErrorCheckFunction(ValidationError)
const isAlreadyPublishedError = ErrorCheckFunction(AlreadyPublishedError)
const isBadParamsError = ErrorCheckFunction(BadParamsError)
const isNotFoundError = ErrorCheckFunction(NotFoundError)
const isConflictError = ErrorCheckFunction(ConflictError)
const isAuthorizationError = ErrorCheckFunction(AuthorizationError)
const isDependencyMissingError = ErrorCheckFunction(DependencyMissingError)
const isInsufficientPermissionsError = ErrorCheckFunction(InsufficientPermissionsError)

/**
 *
 * @param error Error to handle
 * @param req Express Request Object
 * @param res Express Response Object
 * @param next Unused (for the scope of this fn) express next() fn. Included to align with express type signature.
 * @returns API Client response
 *
 * This middleware is to be used as a global error handling middleware for any and all APIs which wish to utilize it.
 * It simplifies error handling, in an effort to reduce copy-paste and developer errors (e.g. sending detailed errors for internal server errors)
 */
export const ApiErrorHandlingMiddleware = (
  error: Error,
  req: ApiRequest,
  res: ApiResponse,
  next: express.NextFunction
) => {
  const { method, originalUrl } = req

  if (isValidationError(error) || isBadParamsError(error)) return res.status(StatusCodes.BAD_REQUEST).send({ error })
  if (isAlreadyPublishedError(error)) return res.status(StatusCodes.METHOD_NOT_ALLOWED).send({ error })
  if (isInsufficientPermissionsError(error)) return res.status(StatusCodes.FORBIDDEN).send({ error })
  if (isNotFoundError(error)) return res.status(StatusCodes.NOT_FOUND).send({ error })
  if (isConflictError(error)) return res.status(StatusCodes.CONFLICT).send({ error })
  if (isAuthorizationError(error)) return res.status(StatusCodes.FORBIDDEN).send({ error })
  if (isDependencyMissingError(error)) return res.status(StatusCodes.FAILED_DEPENDENCY).send({ error })
  if (isServiceError(error, 'ServiceUnavailable')) return res.status(StatusCodes.SERVICE_UNAVAILABLE).send({ error })

  ApiServerLogger.error('Fatal API Error (global error handling middleware)', {
    method,
    originalUrl,
    error
  })
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error })
}

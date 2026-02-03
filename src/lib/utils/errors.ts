export class ComplianceError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message)
    this.name = 'ComplianceError'
    this.code = code
    this.statusCode = statusCode
  }
}

export class AuthenticationError extends ComplianceError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 'AUTH_ERROR', 401)
  }
}

export class RateLimitError extends ComplianceError {
  resetAt: Date

  constructor(resetAt: Date) {
    super(
      `GitHub API rate limit exceeded. Resets at ${resetAt.toLocaleTimeString()}.`,
      'RATE_LIMIT',
      429,
    )
    this.resetAt = resetAt
  }
}

export class PermissionError extends ComplianceError {
  constructor(
    message: string = 'Insufficient permissions. Ensure your PAT has admin:org scope.',
  ) {
    super(message, 'PERMISSION_ERROR', 403)
  }
}

export class NotFoundError extends ComplianceError {
  constructor(resource: string) {
    super(`${resource} not found.`, 'NOT_FOUND', 404)
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

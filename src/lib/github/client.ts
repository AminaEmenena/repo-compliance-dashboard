import { Octokit } from '@octokit/rest'
import { RequestError } from '@octokit/request-error'
import {
  AuthenticationError,
  RateLimitError,
  PermissionError,
  NotFoundError,
  ComplianceError,
} from '@/lib/utils/errors'

let cachedClient: Octokit | null = null
let cachedToken: string | null = null

export function getOctokit(token: string): Octokit {
  if (cachedClient && cachedToken === token) return cachedClient
  cachedClient = new Octokit({ auth: token })
  cachedToken = token
  return cachedClient
}

export function clearClient(): void {
  cachedClient = null
  cachedToken = null
}

export function handleApiError(error: unknown): never {
  if (error instanceof RequestError) {
    switch (error.status) {
      case 401:
        throw new AuthenticationError()
      case 403: {
        const remaining = error.response?.headers['x-ratelimit-remaining']
        if (remaining === '0') {
          const reset = Number(
            error.response?.headers['x-ratelimit-reset'],
          )
          throw new RateLimitError(new Date(reset * 1000))
        }
        throw new PermissionError()
      }
      case 404:
        throw new NotFoundError('Organization')
      default:
        throw new ComplianceError(
          error.message || 'An unexpected error occurred',
          'API_ERROR',
          error.status,
        )
    }
  }
  throw new ComplianceError(
    error instanceof Error ? error.message : 'An unexpected error occurred',
    'UNKNOWN_ERROR',
  )
}

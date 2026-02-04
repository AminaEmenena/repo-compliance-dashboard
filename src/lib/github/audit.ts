import type { Octokit } from '@octokit/rest'
import type { AuditEntry, AuditLogConfig } from '@/types/audit'

interface FileContentsResponse {
  content?: string
  sha?: string
  encoding?: string
}

/**
 * Fetch the current audit log file from the repo.
 * Returns parsed entries and the file SHA (needed for updates).
 */
export async function fetchAuditLogFile(
  octokit: Octokit,
  config: AuditLogConfig,
): Promise<{ entries: AuditEntry[]; sha: string | null }> {
  try {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: config.repoOwner,
        repo: config.repoName,
        path: config.filePath,
      },
    )
    const file = data as FileContentsResponse
    if (!file.content) return { entries: [], sha: file.sha ?? null }

    const decoded = atob(file.content.replace(/\n/g, ''))
    const entries = JSON.parse(decoded) as AuditEntry[]
    return { entries, sha: file.sha ?? null }
  } catch (err: unknown) {
    const error = err as { status?: number }
    if (error.status === 404) {
      return { entries: [], sha: null }
    }
    throw err
  }
}

/**
 * Append an audit entry by updating the file in the repo.
 * Creates the file if it doesn't exist (sha=null).
 * Retries up to 3 times on 409 (SHA conflict).
 */
export async function appendAuditEntry(
  octokit: Octokit,
  config: AuditLogConfig,
  entry: AuditEntry,
  currentSha: string | null,
): Promise<{ sha: string }> {
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Re-fetch on retry to get fresh SHA
      let entries: AuditEntry[] = []
      let sha = currentSha
      if (attempt > 0) {
        const fresh = await fetchAuditLogFile(octokit, config)
        entries = fresh.entries
        sha = fresh.sha
      }

      if (attempt === 0) {
        // First attempt: fetch current entries to append to
        if (sha) {
          const current = await fetchAuditLogFile(octokit, config)
          entries = current.entries
          sha = current.sha
        }
      }

      entries.push(entry)
      const content = btoa(JSON.stringify(entries, null, 2))

      const { data } = await octokit.request(
        'PUT /repos/{owner}/{repo}/contents/{path}',
        {
          owner: config.repoOwner,
          repo: config.repoName,
          path: config.filePath,
          message: `audit: ${entry.action} by ${entry.actor}`,
          content,
          ...(sha ? { sha } : {}),
        },
      )
      const result = data as { content?: { sha?: string } }
      return { sha: result.content?.sha ?? '' }
    } catch (err: unknown) {
      const error = err as { status?: number }
      if (error.status === 409 && attempt < MAX_RETRIES - 1) {
        continue // Retry with fresh SHA
      }
      throw err
    }
  }

  throw new Error('Failed to append audit entry after retries')
}

/**
 * Fetch org audit log events from GitHub Enterprise Cloud.
 * Gracefully returns [] on 403/404 (not Enterprise Cloud).
 */
export async function fetchGitHubAuditLog(
  octokit: Octokit,
  org: string,
  options?: { since?: string; perPage?: number },
): Promise<AuditEntry[]> {
  try {
    const params: Record<string, unknown> = {
      org,
      per_page: options?.perPage ?? 100,
      include: 'web',
    }
    if (options?.since) params.after = options.since

    const { data } = await octokit.request(
      'GET /orgs/{org}/audit-log',
      params as Parameters<Octokit['request']>[1],
    )

    const events = data as Array<{
      '@timestamp'?: number
      action?: string
      actor?: string
      repo?: string
      data?: Record<string, unknown>
    }>

    return events.map((evt) => ({
      id: `gh-${evt['@timestamp'] ?? Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: evt['@timestamp']
        ? new Date(evt['@timestamp']).toISOString()
        : new Date().toISOString(),
      actor: evt.actor ?? 'unknown',
      action: mapGitHubAction(evt.action ?? ''),
      details: {
        githubAction: evt.action,
        repo: evt.repo,
        ...evt.data,
      },
      source: 'github' as const,
    }))
  } catch (err: unknown) {
    const error = err as { status?: number }
    if (error.status === 403 || error.status === 404) {
      return []
    }
    throw err
  }
}

/** Map GitHub audit log action strings to our AuditAction type */
function mapGitHubAction(action: string): AuditEntry['action'] {
  if (action.startsWith('protected_branch.')) return 'property.updated'
  if (action.startsWith('repo.')) return 'data.refreshed'
  if (action.startsWith('org.')) return 'data.refreshed'
  return 'data.refreshed'
}

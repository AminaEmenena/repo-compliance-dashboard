import type { Octokit } from '@octokit/rest'
import type {
  BranchProtection,
  BypassActor,
  RepoAppInstallation,
} from '@/types/compliance'

export async function fetchBranchProtection(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<{ protection: BranchProtection | null; error: string | null }> {
  try {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/branches/{branch}/protection',
      { owner, repo, branch },
    )

    const prReviews = (data as Record<string, unknown>).required_pull_request_reviews as
      | {
          dismiss_stale_reviews?: boolean
          require_code_owner_reviews?: boolean
          required_approving_review_count?: number
          require_last_push_approval?: boolean
          bypass_pull_request_allowances?: {
            users?: Array<{ login?: string }>
            teams?: Array<{ slug?: string }>
            apps?: Array<{ slug?: string } | null>
          }
        }
      | undefined
      | null

    const bypassActors: BypassActor[] = []

    if (prReviews?.bypass_pull_request_allowances) {
      const bp = prReviews.bypass_pull_request_allowances
      for (const u of bp.users ?? []) {
        bypassActors.push({ name: u.login ?? 'unknown', type: 'user' })
      }
      for (const t of bp.teams ?? []) {
        bypassActors.push({ name: t.slug ?? 'unknown', type: 'team' })
      }
      for (const a of bp.apps ?? []) {
        if (a) bypassActors.push({ name: a.slug ?? 'unknown', type: 'app' })
      }
    }

    return {
      protection: {
        requirePr: prReviews != null,
        requiredApprovals: prReviews?.required_approving_review_count ?? null,
        dismissStaleReviews: prReviews?.dismiss_stale_reviews ?? false,
        requireCodeOwnerReviews: prReviews?.require_code_owner_reviews ?? false,
        requireLastPushApproval: prReviews?.require_last_push_approval ?? false,
        bypassActors,
      },
      error: null,
    }
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string }
    if (error.status === 404) {
      // No branch protection configured
      return {
        protection: {
          requirePr: false,
          requiredApprovals: null,
          dismissStaleReviews: false,
          requireCodeOwnerReviews: false,
          requireLastPushApproval: false,
          bypassActors: [],
        },
        error: null,
      }
    }
    return {
      protection: null,
      error: `${error.status ?? 'unknown'}: ${error.message ?? 'Unknown error'}`,
    }
  }
}

export async function fetchOrgInstallations(
  octokit: Octokit,
  org: string,
): Promise<RepoAppInstallation[]> {
  try {
    const { data } = await octokit.request(
      'GET /orgs/{org}/installations',
      { org, per_page: 100 },
    )
    const installations = (data as { installations?: Array<{ app_slug?: string; app_id?: number }> }).installations ?? []
    return installations.map((inst) => ({
      appSlug: inst.app_slug ?? 'unknown',
      appId: inst.app_id ?? 0,
    }))
  } catch {
    return []
  }
}

// Fetch branch protection for multiple repos with concurrency control
export async function fetchAllCompliance(
  octokit: Octokit,
  org: string,
  repos: Array<{ name: string; default_branch: string }>,
  onProgress?: (completed: number, total: number) => void,
): Promise<
  Map<string, { protection: BranchProtection | null; error: string | null }>
> {
  const results = new Map<
    string,
    { protection: BranchProtection | null; error: string | null }
  >()
  const CONCURRENCY = 8
  let completed = 0

  const queue = [...repos]
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const repo = queue.shift()
      if (!repo) break

      const result = await fetchBranchProtection(
        octokit,
        org,
        repo.name,
        repo.default_branch,
      )
      results.set(repo.name, result)
      completed++
      onProgress?.(completed, repos.length)
    }
  })

  await Promise.all(workers)
  return results
}

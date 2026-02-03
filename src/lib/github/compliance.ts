import type { Octokit } from '@octokit/rest'
import type {
  BranchProtection,
  BypassActor,
  MergedProtection,
  RepoAppInstallation,
  RuleSource,
  SourcedCheck,
} from '@/types/compliance'

// --- Classic branch protection ---

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

// --- Branch rules (rulesets + classic, merged by GitHub) ---

interface GitHubBranchRule {
  type: string
  ruleset_source_type?: string
  ruleset_source?: string
  ruleset_id?: number
  parameters?: Record<string, unknown>
}

export async function fetchBranchRules(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<{ rules: GitHubBranchRule[]; error: string | null }> {
  try {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/rules/branches/{branch}',
      { owner, repo, branch },
    )
    return { rules: data as GitHubBranchRule[], error: null }
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string }
    if (error.status === 404) {
      return { rules: [], error: null }
    }
    return {
      rules: [],
      error: `${error.status ?? 'unknown'}: ${error.message ?? 'Unknown error'}`,
    }
  }
}

// --- Merge classic protection + rules into MergedProtection ---

function sourcedDefault<T>(value: T): SourcedCheck<T> {
  return { effectiveValue: value, enforcedBy: [] }
}

function ruleSourceFromGitHub(rule: GitHubBranchRule): RuleSource {
  const sourceType = rule.ruleset_source_type
  return {
    type:
      sourceType === 'Organization'
        ? 'org-ruleset'
        : sourceType === 'Repository'
          ? 'repo-ruleset'
          : 'repo-ruleset',
    rulesetId: rule.ruleset_id ?? null,
    sourceName: rule.ruleset_source ?? null,
  }
}

export function mergeProtection(
  classic: BranchProtection | null,
  rules: GitHubBranchRule[],
): MergedProtection {
  const classicSource: RuleSource = {
    type: 'classic',
    rulesetId: null,
    sourceName: null,
  }

  const result: MergedProtection = {
    requirePr: sourcedDefault(false),
    requiredApprovals: sourcedDefault<number | null>(null),
    dismissStaleReviews: sourcedDefault(false),
    requireCodeOwnerReviews: sourcedDefault(false),
    requireLastPushApproval: sourcedDefault(false),
    bypassActors: [],
  }

  // Fold in classic protection
  if (classic) {
    if (classic.requirePr) {
      result.requirePr = { effectiveValue: true, enforcedBy: [classicSource] }
    }
    if (classic.requiredApprovals != null && classic.requiredApprovals > 0) {
      result.requiredApprovals = {
        effectiveValue: classic.requiredApprovals,
        enforcedBy: [classicSource],
      }
    }
    if (classic.dismissStaleReviews) {
      result.dismissStaleReviews = {
        effectiveValue: true,
        enforcedBy: [classicSource],
      }
    }
    if (classic.requireCodeOwnerReviews) {
      result.requireCodeOwnerReviews = {
        effectiveValue: true,
        enforcedBy: [classicSource],
      }
    }
    if (classic.requireLastPushApproval) {
      result.requireLastPushApproval = {
        effectiveValue: true,
        enforcedBy: [classicSource],
      }
    }
    result.bypassActors.push(
      ...classic.bypassActors.map((a) => ({ ...a, source: classicSource })),
    )
  }

  // Fold in ruleset rules
  const prRules = rules.filter((r) => r.type === 'pull_request')
  for (const rule of prRules) {
    const source = ruleSourceFromGitHub(rule)
    const params = rule.parameters ?? {}

    // pull_request rule type implies PR is required
    result.requirePr.effectiveValue = true
    result.requirePr.enforcedBy.push(source)

    const approvals = params.required_approving_review_count as number | undefined
    if (approvals != null && approvals > 0) {
      const current = result.requiredApprovals.effectiveValue ?? 0
      if (approvals > current) {
        result.requiredApprovals.effectiveValue = approvals
      }
      result.requiredApprovals.enforcedBy.push(source)
    }

    if (params.dismiss_stale_reviews_on_push) {
      result.dismissStaleReviews.effectiveValue = true
      result.dismissStaleReviews.enforcedBy.push(source)
    }
    if (params.require_code_owner_review) {
      result.requireCodeOwnerReviews.effectiveValue = true
      result.requireCodeOwnerReviews.enforcedBy.push(source)
    }
    if (params.require_last_push_approval) {
      result.requireLastPushApproval.effectiveValue = true
      result.requireLastPushApproval.enforcedBy.push(source)
    }
  }

  return result
}

// --- Org installations ---

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

// --- Batch compliance fetch ---

interface ComplianceResult {
  protection: BranchProtection | null
  protectionError: string | null
  mergedProtection: MergedProtection | null
  rulesError: string | null
  hasRulesets: boolean
}

export async function fetchAllCompliance(
  octokit: Octokit,
  org: string,
  repos: Array<{ name: string; default_branch: string }>,
  onProgress?: (completed: number, total: number) => void,
): Promise<Map<string, ComplianceResult>> {
  const results = new Map<string, ComplianceResult>()
  const CONCURRENCY = 8
  let completed = 0

  const queue = [...repos]
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const repo = queue.shift()
      if (!repo) break

      // Fetch classic protection + branch rules in parallel
      const [classicResult, rulesResult] = await Promise.all([
        fetchBranchProtection(octokit, org, repo.name, repo.default_branch),
        fetchBranchRules(octokit, org, repo.name, repo.default_branch),
      ])

      const merged = mergeProtection(
        classicResult.protection,
        rulesResult.rules,
      )

      results.set(repo.name, {
        protection: classicResult.protection,
        protectionError: classicResult.error,
        mergedProtection: merged,
        rulesError: rulesResult.error,
        hasRulesets: rulesResult.rules.length > 0,
      })

      completed++
      onProgress?.(completed, repos.length)
    }
  })

  await Promise.all(workers)
  return results
}

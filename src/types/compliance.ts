// --- Rule source attribution ---

export type RuleSourceType = 'classic' | 'repo-ruleset' | 'org-ruleset'

export interface RuleSource {
  type: RuleSourceType
  rulesetId: number | null
  sourceName: string | null
}

export interface SourcedCheck<T> {
  effectiveValue: T
  enforcedBy: RuleSource[]
}

// --- Protection types ---

export interface BranchProtection {
  requirePr: boolean
  requiredApprovals: number | null
  dismissStaleReviews: boolean
  requireCodeOwnerReviews: boolean
  requireLastPushApproval: boolean
  bypassActors: BypassActor[]
}

export interface MergedProtection {
  requirePr: SourcedCheck<boolean>
  requiredApprovals: SourcedCheck<number | null>
  dismissStaleReviews: SourcedCheck<boolean>
  requireCodeOwnerReviews: SourcedCheck<boolean>
  requireLastPushApproval: SourcedCheck<boolean>
  bypassActors: BypassActor[]
}

export interface BypassActor {
  name: string
  type: 'user' | 'team' | 'app'
  source?: RuleSource
}

export interface RepoAppInstallation {
  appSlug: string
  appId: number
}

export interface ComplianceData {
  protection: BranchProtection | null
  protectionError: string | null
  mergedProtection: MergedProtection | null
  rulesError: string | null
  hasRulesets: boolean
  apps: RepoAppInstallation[]
}

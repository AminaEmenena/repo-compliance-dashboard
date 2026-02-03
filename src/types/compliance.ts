export interface BranchProtection {
  requirePr: boolean
  requiredApprovals: number | null
  dismissStaleReviews: boolean
  requireCodeOwnerReviews: boolean
  requireLastPushApproval: boolean
  bypassActors: BypassActor[]
}

export interface BypassActor {
  name: string
  type: 'user' | 'team' | 'app'
}

export interface RepoAppInstallation {
  appSlug: string
  appId: number
}

export interface ComplianceData {
  protection: BranchProtection | null
  protectionError: string | null
  apps: RepoAppInstallation[]
}

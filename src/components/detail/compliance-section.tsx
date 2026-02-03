import type { RepoWithProperties } from '@/types/repo'
import type { RuleSource } from '@/types/compliance'
import { YesNo } from '@/components/ui/yes-no-badge'
import { SourceBadge } from '@/components/ui/source-badge'
import { Spinner } from '@/components/ui/spinner'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function ComplianceSection({ repo }: { repo: RepoWithProperties }) {
  const c = repo.compliance

  if (!c) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <Spinner className="h-5 w-5" />
        <span className="text-sm text-gray-500">
          Loading protection rules...
        </span>
      </div>
    )
  }

  if (c.protectionError && !c.protection && !c.mergedProtection) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <span className="text-sm text-red-700 dark:text-red-300">
          {c.protectionError}
        </span>
      </div>
    )
  }

  const m = c.mergedProtection
  const p = c.protection

  // Use merged data when available, fall back to classic
  const checks: Array<{
    label: string
    value: boolean | null
    sources: RuleSource[]
  }> = [
    {
      label: 'Require PR Before Merging',
      value: m?.requirePr.effectiveValue ?? p?.requirePr ?? null,
      sources: m?.requirePr.enforcedBy ?? [],
    },
    {
      label: 'Dismiss Stale Reviews',
      value: m?.dismissStaleReviews.effectiveValue ?? p?.dismissStaleReviews ?? null,
      sources: m?.dismissStaleReviews.enforcedBy ?? [],
    },
    {
      label: 'Require Code Owner Reviews',
      value: m?.requireCodeOwnerReviews.effectiveValue ?? p?.requireCodeOwnerReviews ?? null,
      sources: m?.requireCodeOwnerReviews.enforcedBy ?? [],
    },
    {
      label: 'Last Push Approval',
      value: m?.requireLastPushApproval.effectiveValue ?? p?.requireLastPushApproval ?? null,
      sources: m?.requireLastPushApproval.enforcedBy ?? [],
    },
  ]

  const approvals = m?.requiredApprovals.effectiveValue ?? p?.requiredApprovals ?? null
  const approvalSources = m?.requiredApprovals.enforcedBy ?? []

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <ShieldAlert className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Protection Rules
        </h3>
        {c.hasRulesets && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Rulesets active
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {checks.map((check) => (
          <div key={check.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {check.label}
              </span>
              <YesNo value={check.value} />
            </div>
            {check.sources.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {check.sources.map((s, i) => (
                  <SourceBadge key={i} source={s} />
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Required Approvals
            </span>
            {approvals != null ? (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  approvals > 0
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
                    : 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
                )}
              >
                {approvals}
              </span>
            ) : (
              <span className="text-xs text-gray-400">N/A</span>
            )}
          </div>
          {approvalSources.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {approvalSources.map((s, i) => (
                <SourceBadge key={i} source={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

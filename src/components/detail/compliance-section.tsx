import type { RepoWithProperties } from '@/types/repo'
import { YesNo } from '@/components/ui/yes-no-badge'
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
          Loading branch protection...
        </span>
      </div>
    )
  }

  if (c.protectionError && !c.protection) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <span className="text-sm text-red-700 dark:text-red-300">
          {c.protectionError}
        </span>
      </div>
    )
  }

  const p = c.protection

  const checks = [
    { label: 'Require PR Before Merging', value: p?.requirePr ?? null },
    { label: 'Dismiss Stale Reviews', value: p?.dismissStaleReviews ?? null },
    {
      label: 'Require Code Owner Reviews',
      value: p?.requireCodeOwnerReviews ?? null,
    },
    {
      label: 'Last Push Approval',
      value: p?.requireLastPushApproval ?? null,
    },
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <ShieldAlert className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Branch Protection
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {check.label}
            </span>
            <YesNo value={check.value} />
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Required Approvals
          </span>
          {p?.requiredApprovals != null ? (
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                p.requiredApprovals > 0
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
                  : 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
              )}
            >
              {p.requiredApprovals}
            </span>
          ) : (
            <span className="text-xs text-gray-400">N/A</span>
          )}
        </div>
      </div>
    </div>
  )
}

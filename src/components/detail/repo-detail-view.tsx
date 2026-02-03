import type { RepoWithProperties } from '@/types/repo'
import { DetailHeader } from './detail-header'
import { ComplianceSection } from './compliance-section'
import { AppsSection } from './apps-section'
import { BypassSection } from './bypass-section'
import { SoxToggle } from '@/components/dashboard/sox-toggle'
import { ShieldCheck } from 'lucide-react'

const SOX_PROPERTY = 'SOX-Compliance-Scope'

export function RepoDetailView({
  repo,
  onPropertyUpdate,
}: {
  repo: RepoWithProperties
  onPropertyUpdate: (
    repoName: string,
    propertyName: string,
    value: string | null,
  ) => Promise<void>
}) {
  const isInScope = repo.custom_properties[SOX_PROPERTY] === 'true'

  return (
    <div className="space-y-6">
      <DetailHeader repo={repo} />

      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <ShieldCheck className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            SOX Compliance Scope
          </h3>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isInScope
              ? 'This repository is in scope for SOX compliance.'
              : 'This repository is not in scope for SOX compliance.'}
          </span>
          <SoxToggle
            value={isInScope}
            onChange={async (newVal) => {
              await onPropertyUpdate(
                repo.name,
                SOX_PROPERTY,
                newVal ? 'true' : 'false',
              )
            }}
          />
        </div>
      </div>

      <ComplianceSection repo={repo} />
      <AppsSection repo={repo} />
      <BypassSection repo={repo} />
    </div>
  )
}

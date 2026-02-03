import type { RepoWithProperties } from '@/types/repo'
import { Database, ShieldCheck, ShieldOff, GitBranch } from 'lucide-react'

interface ComplianceStatsProps {
  repositories: RepoWithProperties[]
}

export function ComplianceStats({ repositories }: ComplianceStatsProps) {
  const total = repositories.length
  const inScope = repositories.filter(
    (r) => r.custom_properties['SOX-Compliance-Scope'] === 'true',
  ).length
  const outOfScope = total - inScope
  const archived = repositories.filter((r) => r.archived).length

  const stats = [
    {
      label: 'Total Repos',
      value: total,
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'SOX In-Scope',
      value: inScope,
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      label: 'SOX Out-of-Scope',
      value: outOfScope,
      icon: ShieldOff,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: 'Archived',
      value: archived,
      icon: GitBranch,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

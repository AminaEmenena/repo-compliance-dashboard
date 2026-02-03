import type { RuleSource } from '@/types/compliance'
import { Shield, GitBranch, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const sourceConfig = {
  classic: {
    label: 'Classic',
    Icon: Shield,
    colors:
      'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
  },
  'repo-ruleset': {
    label: 'Repo Ruleset',
    Icon: GitBranch,
    colors:
      'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800',
  },
  'org-ruleset': {
    label: 'Org Ruleset',
    Icon: Building2,
    colors:
      'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800',
  },
} as const

export function SourceBadge({ source }: { source: RuleSource }) {
  const config = sourceConfig[source.type]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
        config.colors,
      )}
    >
      <config.Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  )
}

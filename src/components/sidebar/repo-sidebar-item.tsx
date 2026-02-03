import type { RepoWithProperties } from '@/types/repo'
import { cn } from '@/lib/utils/cn'

const SOX_PROPERTY = 'SOX-Compliance-Scope'

export function RepoSidebarItem({
  repo,
  isSelected,
  onSelect,
}: {
  repo: RepoWithProperties
  isSelected: boolean
  onSelect: (repoName: string) => void
}) {
  const isInScope = repo.custom_properties[SOX_PROPERTY] === 'true'

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(repo.name)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
          isSelected
            ? 'border-l-2 border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
            : 'border-l-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            isInScope
              ? 'bg-emerald-500'
              : 'bg-gray-300 dark:bg-gray-600',
          )}
        />
        <span className="truncate text-gray-700 dark:text-gray-300">
          {repo.name}
        </span>
        {repo.archived && (
          <span className="ml-auto shrink-0 text-[10px] text-gray-400">
            archived
          </span>
        )}
      </button>
    </li>
  )
}

import type { RepoWithProperties } from '@/types/repo'
import { VisibilityBadge } from '@/components/ui/visibility-badge'
import { useUIStore } from '@/stores/ui-store'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export function DetailHeader({ repo }: { repo: RepoWithProperties }) {
  const selectRepo = useUIStore((s) => s.selectRepo)

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => selectRepo(null)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {repo.name}
            </h2>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          {repo.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {repo.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <VisibilityBadge visibility={repo.visibility} />
            {repo.archived && (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 ring-inset dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800">
                Archived
              </span>
            )}
            {repo.language && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {repo.language}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

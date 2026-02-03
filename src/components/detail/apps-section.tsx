import { useState } from 'react'
import type { RepoWithProperties } from '@/types/repo'
import { Bot, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export function AppsSection({ repo }: { repo: RepoWithProperties }) {
  const c = repo.compliance
  const [isOpen, setIsOpen] = useState(false)

  if (!c) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <Spinner className="h-5 w-5" />
        <span className="text-sm text-gray-500">Loading apps...</span>
      </div>
    )
  }

  const appCount = c.apps.length
  const hasApps = appCount > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <Bot className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          GitHub Apps
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {appCount}
        </span>
        {hasApps && !isOpen && (
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            Review installed apps
          </span>
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          {!hasApps ? (
            <span className="text-sm text-gray-400 dark:text-gray-500">
              No apps installed
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {c.apps.map((app) => (
                <span
                  key={app.appSlug}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 ring-1 ring-blue-200 ring-inset dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800"
                >
                  <Bot className="h-3 w-3" />
                  {app.appSlug}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

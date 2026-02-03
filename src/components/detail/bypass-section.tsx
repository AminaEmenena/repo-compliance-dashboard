import type { RepoWithProperties } from '@/types/repo'
import { Users } from 'lucide-react'
import { SourceBadge } from '@/components/ui/source-badge'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'

export function BypassSection({ repo }: { repo: RepoWithProperties }) {
  const c = repo.compliance

  if (!c) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <Spinner className="h-5 w-5" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  const actors = c.mergedProtection?.bypassActors ?? c.protection?.bypassActors ?? []

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <Users className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Bypass Actors
        </h3>
      </div>
      <div className="p-4">
        {!c.protection ? (
          <span className="text-sm text-gray-400">N/A</span>
        ) : actors.length === 0 ? (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            None
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actors.map((actor) => (
              <span
                key={`${actor.type}-${actor.name}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ring-1 ring-inset',
                  actor.type === 'app'
                    ? 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800'
                    : 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800',
                )}
              >
                <Users className="h-3 w-3" />
                {actor.name}
                <span className="text-[10px] opacity-60">({actor.type})</span>
                {actor.source && <SourceBadge source={actor.source} />}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

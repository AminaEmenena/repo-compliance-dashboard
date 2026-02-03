import { useMemo } from 'react'
import { useRepoStore } from '@/stores/repo-store'
import { useUIStore } from '@/stores/ui-store'
import { SidebarSearch } from './sidebar-search'
import { RepoSidebarItem } from './repo-sidebar-item'
import { X } from 'lucide-react'
import { useIsDesktop } from '@/hooks/use-media-query'

export function RepoSidebar() {
  const repositories = useRepoStore((s) => s.repositories)
  const { selectedRepoName, selectRepo, sidebarSearchQuery, setSidebarOpen } =
    useUIStore()
  const isDesktop = useIsDesktop()

  const filteredRepos = useMemo(() => {
    const sorted = [...repositories].sort((a, b) =>
      a.name.localeCompare(b.name),
    )
    if (!sidebarSearchQuery) return sorted
    const q = sidebarSearchQuery.toLowerCase()
    return sorted.filter((r) => r.name.toLowerCase().includes(q))
  }, [repositories, sidebarSearchQuery])

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Repositories ({repositories.length})
        </span>
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <SidebarSearch />
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {filteredRepos.map((repo) => (
            <RepoSidebarItem
              key={repo.name}
              repo={repo}
              isSelected={selectedRepoName === repo.name}
              onSelect={selectRepo}
            />
          ))}
          {filteredRepos.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-gray-400">
              No repositories match your search.
            </li>
          )}
        </ul>
      </nav>
    </aside>
  )
}

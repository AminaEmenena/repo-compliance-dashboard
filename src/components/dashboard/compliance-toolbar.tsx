import { useUIStore } from '@/stores/ui-store'
import { Search, Filter, Archive } from 'lucide-react'

export function ComplianceToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    visibilityFilter,
    setVisibilityFilter,
    showArchived,
    setShowArchived,
  } = useUIStore()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search in-scope repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={visibilityFilter}
          onChange={(e) =>
            setVisibilityFilter(
              e.target.value as 'all' | 'public' | 'private' | 'internal',
            )
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="all">All visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="internal">Internal</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowArchived(!showArchived)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
          showArchived
            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
        }`}
      >
        <Archive className="h-4 w-4" />
        {showArchived ? 'Showing archived' : 'Hide archived'}
      </button>
    </div>
  )
}

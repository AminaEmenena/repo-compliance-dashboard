import { Search } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

export function SidebarSearch() {
  const { sidebarSearchQuery, setSidebarSearchQuery } = useUIStore()

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Filter repositories..."
          value={sidebarSearchQuery}
          onChange={(e) => setSidebarSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>
    </div>
  )
}

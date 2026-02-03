import { Menu } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

export function SidebarToggle() {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  return (
    <button
      type="button"
      onClick={() => setSidebarOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 lg:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      <Menu className="h-4 w-4" />
      Repositories
    </button>
  )
}

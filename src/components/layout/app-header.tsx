import { useAuthStore } from '@/stores/auth-store'
import { useRepoStore } from '@/stores/repo-store'
import {
  ShieldCheck,
  RefreshCw,
  LogOut,
  Building2,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export function AppHeader() {
  const { authMode, orgName, orgDisplayName, disconnect } = useAuthStore()
  const { isLoading, lastFetchedAt, fetchAll } = useRepoStore()

  const handleRefresh = () => {
    if (orgName) {
      fetchAll(orgName)
    }
  }

  const handleDisconnect = () => {
    useRepoStore.getState().reset()
    disconnect()
  }

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
            <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Compliance Dashboard
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Building2 className="h-3 w-3" />
              <span>{orgDisplayName ?? orgName}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-400 dark:text-gray-500">
                via {authMode === 'github-app' ? 'GitHub App' : 'PAT'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastFetchedAt && (
            <span className="hidden text-xs text-gray-400 sm:inline dark:text-gray-500">
              Updated {new Date(lastFetchedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-950 dark:hover:text-red-400 dark:hover:border-red-800"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>
    </header>
  )
}

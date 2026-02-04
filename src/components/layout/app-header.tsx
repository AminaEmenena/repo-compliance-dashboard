import { useAuthStore } from '@/stores/auth-store'
import { useRepoStore } from '@/stores/repo-store'
import { useUIStore, type AppView } from '@/stores/ui-store'
import {
  ShieldCheck,
  RefreshCw,
  LogOut,
  Building2,
  LayoutDashboard,
  BookOpen,
  UserCircle,
  X,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'

const NAV_TABS: { view: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'docs', label: 'Docs', icon: BookOpen },
]

export function AppHeader() {
  const { authMode, orgName, orgDisplayName, actorLogin, clearIdentity, needsUserIdentity, disconnect } = useAuthStore()
  const { isLoading, lastFetchedAt, fetchAll } = useRepoStore()
  const { currentView, setCurrentView } = useUIStore()
  const isIdentified = authMode === 'github-app' && !needsUserIdentity()

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
              {isIdentified && actorLogin && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <UserCircle className="h-3 w-3" />
                    {actorLogin}
                    <button
                      type="button"
                      onClick={clearIdentity}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      title="Change identity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastFetchedAt && currentView === 'dashboard' && (
            <span className="hidden text-xs text-gray-400 sm:inline dark:text-gray-500">
              Updated {new Date(lastFetchedAt).toLocaleTimeString()}
            </span>
          )}
          {currentView === 'dashboard' && (
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
          )}
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

      {/* Navigation tabs */}
      <nav className="flex gap-1 px-4 sm:px-6 lg:px-8">
        {NAV_TABS.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            type="button"
            onClick={() => setCurrentView(view)}
            className={cn(
              'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              currentView === view
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}

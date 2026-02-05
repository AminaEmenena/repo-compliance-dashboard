import { useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRepoStore } from '@/stores/repo-store'
import { useUIStore } from '@/stores/ui-store'
import { useSelectedRepo } from '@/hooks/use-selected-repo'
import { useIsDesktop } from '@/hooks/use-media-query'
import { AppHeader } from './app-header'
import { SidebarToggle } from './sidebar-toggle'
import { RepoSidebar } from '@/components/sidebar/repo-sidebar'
import { RepoDetailView } from '@/components/detail/repo-detail-view'
import { ComplianceStats } from '@/components/dashboard/compliance-stats'
import { ComplianceToolbar } from '@/components/dashboard/compliance-toolbar'
import { ComplianceTable } from '@/components/dashboard/compliance-table'
import { SoxSetupBanner } from '@/components/dashboard/sox-setup-banner'
import { DocsView } from '@/components/docs/docs-view'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, Info } from 'lucide-react'

const SOX_PROPERTY = 'SOX-Compliance-Scope'

export function AppLayout() {
  const { orgName } = useAuthStore()
  const {
    repositories,
    propertySchema,
    isLoading,
    isCachedData,
    complianceProgress,
    error,
    fetchAll,
    loadFromCache,
    createSoxProperty,
  } = useRepoStore()
  const { currentView, sidebarOpen, setSidebarOpen } = useUIStore()
  const selectedRepo = useSelectedRepo()
  const isDesktop = useIsDesktop()
  const showSidebar = currentView === 'dashboard'

  useEffect(() => {
    if (orgName) {
      // Show cached data immediately, then refresh in background
      loadFromCache(orgName)
      fetchAll(orgName)
    }
  }, [orgName, fetchAll, loadFromCache])

  const hasSoxProperty = useMemo(
    () => propertySchema.some((p) => p.property_name === SOX_PROPERTY),
    [propertySchema],
  )

  const handlePropertyUpdate = useCallback(
    async (repoName: string, propertyName: string, value: string | null) => {
      if (!orgName) return
      await useRepoStore
        .getState()
        .updateProperty(orgName, repoName, propertyName, value)
    },
    [orgName],
  )

  const handleCreateSoxProperty = useCallback(async () => {
    if (!orgName) return
    await createSoxProperty(orgName)
  }, [orgName, createSoxProperty])

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <AppHeader />
      <div className="flex flex-1 min-h-0">
        {/* Mobile sidebar overlay */}
        {showSidebar && !isDesktop && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar (dashboard view only) */}
        {showSidebar && (
          isDesktop ? (
            <RepoSidebar />
          ) : sidebarOpen ? (
            <div className="fixed inset-y-0 left-0 z-50 w-72">
              <RepoSidebar />
            </div>
          ) : null
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {showSidebar && !isDesktop && (
            <div className="mb-4">
              <SidebarToggle />
            </div>
          )}

          {currentView === 'docs' ? (
            <DocsView />
          ) : isLoading && repositories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Spinner className="h-8 w-8 text-primary-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading repositories from {orgName}...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                type="button"
                onClick={() => orgName && fetchAll(orgName)}
                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
              >
                Retry
              </button>
            </div>
          ) : selectedRepo ? (
            <RepoDetailView
              repo={selectedRepo}
              onPropertyUpdate={handlePropertyUpdate}
            />
          ) : (
            <div className="space-y-6">
              {isCachedData && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Info className="h-4 w-4 shrink-0" />
                  Showing cached data. Please wait while the latest data is loaded.
                </div>
              )}
              {!hasSoxProperty && repositories.length > 0 && (
                <SoxSetupBanner onCreateProperty={handleCreateSoxProperty} />
              )}
              <ComplianceStats repositories={repositories} />
              {complianceProgress && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <Spinner className="h-4 w-4" />
                  {complianceProgress}
                </div>
              )}
              <ComplianceToolbar />
              <ComplianceTable
                repositories={repositories}
                propertySchema={propertySchema}
                onPropertyUpdate={handlePropertyUpdate}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

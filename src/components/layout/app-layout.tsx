import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRepoStore } from '@/stores/repo-store'
import { AppHeader } from './app-header'
import { ComplianceStats } from '@/components/dashboard/compliance-stats'
import { ComplianceToolbar } from '@/components/dashboard/compliance-toolbar'
import { ComplianceTable } from '@/components/dashboard/compliance-table'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle } from 'lucide-react'

export function AppLayout() {
  const { token, orgName } = useAuthStore()
  const { repositories, propertySchema, isLoading, error, fetchAll } =
    useRepoStore()

  useEffect(() => {
    if (token && orgName) {
      fetchAll(token, orgName)
    }
  }, [token, orgName, fetchAll])

  const handlePropertyUpdate = useCallback(
    async (repoName: string, propertyName: string, value: string | null) => {
      if (!token || !orgName) return
      await useRepoStore
        .getState()
        .updateProperty(token, orgName, repoName, propertyName, value)
    },
    [token, orgName],
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {isLoading && repositories.length === 0 ? (
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
              onClick={() => token && orgName && fetchAll(token, orgName)}
              className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <ComplianceStats repositories={repositories} />
            <ComplianceToolbar />
            <ComplianceTable
              repositories={repositories}
              propertySchema={propertySchema}
              onPropertyUpdate={handlePropertyUpdate}
            />
          </>
        )}
      </main>
    </div>
  )
}

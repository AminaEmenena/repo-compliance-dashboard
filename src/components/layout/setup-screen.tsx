import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { ShieldCheck, Key, Building2, AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export function SetupScreen() {
  const [token, setToken] = useState('')
  const [orgName, setOrgName] = useState('')
  const { isValidating, validationError, connect } = useAuthStore()

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim() || !orgName.trim()) return
    try {
      await connect(token.trim(), orgName.trim())
    } catch {
      // Error is handled in the store
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900">
            <ShieldCheck className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Repo Compliance Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect to a GitHub organization to manage repository compliance
            properties.
          </p>
        </div>

        <form
          onSubmit={handleConnect}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div>
            <label
              htmlFor="token"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Key className="h-4 w-4" />
              Personal Access Token
            </label>
            <input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Requires <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">admin:org</code> scope
              for custom property management.
            </p>
          </div>

          <div>
            <label
              htmlFor="org"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Building2 className="h-4 w-4" />
              Organization Name
            </label>
            <input
              id="org"
              type="text"
              placeholder="my-org"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              required
            />
          </div>

          {validationError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating || !token.trim() || !orgName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
          >
            {isValidating ? (
              <>
                <Spinner />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Your token is stored in this browser's localStorage and is only
              used for direct API calls to GitHub. It never leaves your browser.
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

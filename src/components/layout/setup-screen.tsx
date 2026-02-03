import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthMode } from '@/types/auth'
import { ShieldCheck, Key, Building2, AlertTriangle, Bot } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'

export function SetupScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('github-app')
  const { isValidating, validationError, connectWithPat, connectWithApp } =
    useAuthStore()

  // PAT fields
  const [token, setToken] = useState('')
  const [patOrg, setPatOrg] = useState('')

  // GitHub App fields
  const [appId, setAppId] = useState('')
  const [appOrg, setAppOrg] = useState('')
  const [privateKey, setPrivateKey] = useState('')

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (authMode === 'pat') {
        if (!token.trim() || !patOrg.trim()) return
        await connectWithPat(token.trim(), patOrg.trim())
      } else {
        if (!appId.trim() || !appOrg.trim() || !privateKey.trim()) return
        await connectWithApp(appId.trim(), privateKey.trim(), appOrg.trim())
      }
    } catch {
      // Error is handled in the store
    }
  }

  const canSubmit =
    authMode === 'pat'
      ? token.trim() && patOrg.trim()
      : appId.trim() && appOrg.trim() && privateKey.trim()

  const tabClass = (mode: AuthMode) =>
    cn(
      'flex-1 px-4 py-2 text-sm font-medium text-center transition-colors',
      authMode === mode
        ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    )

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
            Connect to a GitHub organization to manage repository compliance.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Auth mode tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setAuthMode('github-app')}
              className={tabClass('github-app')}
            >
              <Bot className="mr-1.5 inline h-4 w-4" />
              GitHub App
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('pat')}
              className={tabClass('pat')}
            >
              <Key className="mr-1.5 inline h-4 w-4" />
              Personal Access Token
            </button>
          </div>

          <form onSubmit={handleConnect} className="space-y-4 p-6">
            {authMode === 'pat' ? (
              <>
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
                    Requires{' '}
                    <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
                      admin:org
                    </code>{' '}
                    scope for custom property management.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="pat-org"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Building2 className="h-4 w-4" />
                    Organization Name
                  </label>
                  <input
                    id="pat-org"
                    type="text"
                    placeholder="my-org"
                    value={patOrg}
                    onChange={(e) => setPatOrg(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="app-id"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Bot className="h-4 w-4" />
                    App ID
                  </label>
                  <input
                    id="app-id"
                    type="text"
                    placeholder="123456"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="app-org"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Building2 className="h-4 w-4" />
                    Organization Name
                  </label>
                  <input
                    id="app-org"
                    type="text"
                    placeholder="my-org"
                    value={appOrg}
                    onChange={(e) => setAppOrg(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="pem"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Key className="h-4 w-4" />
                    Private Key (PEM)
                  </label>
                  <textarea
                    id="pem"
                    rows={6}
                    placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Paste the full PEM file contents from your GitHub App settings.
                  </p>
                </div>
              </>
            )}

            {validationError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isValidating || !canSubmit}
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
                Your credentials are stored in this browser's localStorage and
                are only used for direct API calls to GitHub. They never leave
                your browser.
              </span>
            </div>

            {authMode === 'github-app' && (
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium text-gray-600 dark:text-gray-300">
                  Setup steps:
                </p>
                <ol className="list-inside list-decimal space-y-0.5">
                  <li>Register a GitHub App on your organization</li>
                  <li>
                    Grant permissions: Administration (read), Custom properties
                    (read/write), Metadata (read)
                  </li>
                  <li>Install the app on your organization</li>
                  <li>Generate and download a private key from the app settings</li>
                </ol>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

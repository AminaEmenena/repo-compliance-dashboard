import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Spinner } from '@/components/ui/spinner'
import {
  UserCircle,
  AlertTriangle,
  X,
} from 'lucide-react'

export function UserIdentityBanner() {
  const {
    authMode,
    identifyingUser,
    identityError,
    setManualLogin,
    needsUserIdentity,
  } = useAuthStore()

  const [manualUsername, setManualUsername] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Only show for GitHub App auth when user isn't identified
  if (authMode !== 'github-app') return null
  if (!needsUserIdentity()) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualUsername.trim()) return
    setManualLogin(manualUsername.trim())
  }

  if (showForm) {
    return (
      <div className="border-b border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-md items-center gap-2"
        >
          <UserCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <input
            type="text"
            placeholder="Enter your GitHub username"
            value={manualUsername}
            onChange={(e) => setManualUsername(e.target.value)}
            className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm placeholder:text-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-blue-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-blue-600"
            disabled={identifyingUser}
            autoFocus
          />
          <button
            type="submit"
            disabled={identifyingUser || !manualUsername.trim()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {identifyingUser ? <Spinner className="h-4 w-4" /> : 'Verify'}
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setManualUsername('') }}
            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
        {identityError && (
          <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
            {identityError}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <UserCircle className="h-4 w-4" />
          <span>Identify yourself to track actions in the audit log</span>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserCircle className="h-3.5 w-3.5" />
          Enter GitHub username
        </button>
      </div>
      {identityError && (
        <p className="mt-1.5 text-center text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="mr-1 inline h-3 w-3" />
          {identityError}
        </p>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Spinner } from '@/components/ui/spinner'
import {
  UserCircle,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  X,
  KeyRound,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type IdentityMode = 'choose' | 'device-flow' | 'manual'

export function UserIdentityBanner() {
  const {
    authMode,
    clientId,
    deviceFlowState,
    identifyingUser,
    identityError,
    startDeviceFlow,
    cancelDeviceFlow,
    setManualLogin,
    needsUserIdentity,
  } = useAuthStore()

  const [mode, setMode] = useState<IdentityMode>('choose')
  const [manualUsername, setManualUsername] = useState('')
  const [copied, setCopied] = useState(false)

  // Only show for GitHub App auth when user isn't identified
  if (authMode !== 'github-app') return null
  if (!needsUserIdentity()) return null

  const handleCopyCode = async () => {
    if (!deviceFlowState) return
    await navigator.clipboard.writeText(deviceFlowState.userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartDeviceFlow = () => {
    setMode('device-flow')
    startDeviceFlow()
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualUsername.trim()) return
    setManualLogin(manualUsername.trim())
  }

  const handleCancel = () => {
    cancelDeviceFlow()
    setMode('choose')
    setManualUsername('')
  }

  // Device flow in progress — show code dialog
  if (mode === 'device-flow' && deviceFlowState) {
    return (
      <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
            <KeyRound className="h-4 w-4" />
            Enter this code on GitHub to sign in
          </div>

          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-white px-4 py-2 font-mono text-2xl font-bold tracking-widest text-indigo-900 shadow-sm dark:bg-gray-800 dark:text-indigo-200">
              {deviceFlowState.userCode}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-lg border border-indigo-300 bg-white p-2 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700"
              title="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={deviceFlowState.verificationUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Open GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-400">
            <Spinner className="h-3 w-3" />
            Waiting for authorization...
          </div>
        </div>
      </div>
    )
  }

  // Device flow loading (before code is received)
  if (mode === 'device-flow' && identifyingUser) {
    return (
      <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950">
        <div className="flex items-center justify-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
          <Spinner className="h-4 w-4" />
          Starting sign-in flow...
          <button
            type="button"
            onClick={handleCancel}
            className="ml-2 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Manual username entry
  if (mode === 'manual') {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
        <form
          onSubmit={handleManualSubmit}
          className="mx-auto flex max-w-md items-center gap-2"
        >
          <UserCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <input
            type="text"
            placeholder="Enter your GitHub username"
            value={manualUsername}
            onChange={(e) => setManualUsername(e.target.value)}
            className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm placeholder:text-amber-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-amber-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-amber-600"
            disabled={identifyingUser}
          />
          <button
            type="submit"
            disabled={identifyingUser || !manualUsername.trim()}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {identifyingUser ? <Spinner className="h-4 w-4" /> : 'Verify'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
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

  // Default: choose mode
  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <UserCircle className="h-4 w-4" />
          <span>Identify yourself to track actions in the audit log</span>
        </div>
        <div className="flex items-center gap-2">
          {clientId && (
            <button
              type="button"
              onClick={handleStartDeviceFlow}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium',
                'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Sign in with GitHub
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm',
              'border-blue-300 bg-white text-blue-700 hover:bg-blue-50',
              'dark:border-blue-700 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700',
            )}
          >
            <UserCircle className="h-3.5 w-3.5" />
            Enter username
          </button>
        </div>
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

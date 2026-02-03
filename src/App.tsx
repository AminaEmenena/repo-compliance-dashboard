import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { SetupScreen } from '@/components/layout/setup-screen'
import { AppLayout } from '@/components/layout/app-layout'

const ENV_APP_ID = import.meta.env.VITE_GITHUB_APP_ID as string | undefined
const ENV_APP_PEM_RAW = import.meta.env.VITE_GITHUB_APP_PEM as string | undefined
// Env vars may have literal \n instead of real newlines after Vite inlining
const ENV_APP_PEM = ENV_APP_PEM_RAW?.replace(/\\n/g, '\n')
const ENV_ORG = import.meta.env.VITE_GITHUB_ORG as string | undefined

function App() {
  const { isConnected, isValidating, loadFromStorage, connectWithApp } =
    useAuthStore()
  const autoConnectAttempted = useRef(false)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Auto-connect from env vars — only attempt once
  useEffect(() => {
    if (
      !autoConnectAttempted.current &&
      !isConnected &&
      !isValidating &&
      ENV_APP_ID &&
      ENV_APP_PEM &&
      ENV_ORG
    ) {
      autoConnectAttempted.current = true
      connectWithApp(ENV_APP_ID, ENV_APP_PEM, ENV_ORG).catch(() => {
        // Error is surfaced via validationError in the store
      })
    }
  }, [isConnected, isValidating, connectWithApp])

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-500">Connecting...</p>
      </div>
    )
  }

  return isConnected ? <AppLayout /> : <SetupScreen />
}

export default App

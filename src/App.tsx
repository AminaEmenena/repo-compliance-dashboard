import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { SetupScreen } from '@/components/layout/setup-screen'
import { AppLayout } from '@/components/layout/app-layout'

const ENV_APP_ID = import.meta.env.VITE_GITHUB_APP_ID as string | undefined
const ENV_APP_PEM = import.meta.env.VITE_GITHUB_APP_PEM as string | undefined
const ENV_ORG = import.meta.env.VITE_GITHUB_ORG as string | undefined

function App() {
  const { isConnected, isValidating, loadFromStorage, connectWithApp } =
    useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Auto-connect from env vars if present and not already connected
  useEffect(() => {
    if (!isConnected && !isValidating && ENV_APP_ID && ENV_APP_PEM && ENV_ORG) {
      connectWithApp(ENV_APP_ID, ENV_APP_PEM, ENV_ORG).catch(() => {
        // Error is surfaced via validationError in the store
      })
    }
  }, [isConnected, isValidating, connectWithApp])

  return isConnected ? <AppLayout /> : <SetupScreen />
}

export default App

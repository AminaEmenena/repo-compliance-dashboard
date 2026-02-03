import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { SetupScreen } from '@/components/layout/setup-screen'
import { AppLayout } from '@/components/layout/app-layout'

function App() {
  const { isConnected, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  return isConnected ? <AppLayout /> : <SetupScreen />
}

export default App

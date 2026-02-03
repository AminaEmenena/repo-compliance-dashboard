import { create } from 'zustand'
import { getOctokit, clearClient } from '@/lib/github/client'
import { getErrorMessage } from '@/lib/utils/errors'

const STORAGE_KEY_TOKEN = 'rcd_token'
const STORAGE_KEY_ORG = 'rcd_org'

interface AuthState {
  token: string | null
  orgName: string | null
  orgDisplayName: string | null
  isConnected: boolean
  isValidating: boolean
  validationError: string | null

  connect: (token: string, orgName: string) => Promise<void>
  disconnect: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  orgName: null,
  orgDisplayName: null,
  isConnected: false,
  isValidating: false,
  validationError: null,

  connect: async (token: string, orgName: string) => {
    set({ isValidating: true, validationError: null })
    try {
      const octokit = getOctokit(token)
      const { data } = await octokit.orgs.get({ org: orgName })

      localStorage.setItem(STORAGE_KEY_TOKEN, token)
      localStorage.setItem(STORAGE_KEY_ORG, orgName)

      set({
        token,
        orgName,
        orgDisplayName: data.name ?? orgName,
        isConnected: true,
        isValidating: false,
        validationError: null,
      })
    } catch (error) {
      clearClient()
      set({
        isValidating: false,
        validationError: getErrorMessage(error),
        isConnected: false,
      })
      throw error
    }
  },

  disconnect: () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_ORG)
    clearClient()
    set({
      token: null,
      orgName: null,
      orgDisplayName: null,
      isConnected: false,
      isValidating: false,
      validationError: null,
    })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    const orgName = localStorage.getItem(STORAGE_KEY_ORG)
    if (token && orgName) {
      set({ token, orgName, isConnected: true })
    }
  },
}))

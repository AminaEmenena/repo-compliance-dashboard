import { create } from 'zustand'
import { getOctokit, clearClient } from '@/lib/github/client'
import { getErrorMessage, AuthenticationError } from '@/lib/utils/errors'
import {
  generateAppJwt,
  findOrgInstallation,
  createInstallationToken,
  validatePemFormat,
  isTokenExpiringSoon,
} from '@/lib/github/app-auth'
import type { AuthMode } from '@/types/auth'

const STORAGE_KEY_AUTH_MODE = 'rcd_auth_mode'
const STORAGE_KEY_TOKEN = 'rcd_token'
const STORAGE_KEY_ORG = 'rcd_org'
const STORAGE_KEY_APP_ID = 'rcd_app_id'
const STORAGE_KEY_APP_PEM = 'rcd_app_pem'
const STORAGE_KEY_INSTALLATION_ID = 'rcd_installation_id'

// Concurrency guard for token refresh
let refreshPromise: Promise<void> | null = null

interface AuthState {
  // Shared state
  authMode: AuthMode | null
  orgName: string | null
  orgDisplayName: string | null
  isConnected: boolean
  isValidating: boolean
  validationError: string | null

  // PAT-specific
  patToken: string | null

  // GitHub App-specific
  appId: string | null
  privateKeyPem: string | null
  installationId: number | null
  installationToken: string | null
  installationTokenExpiresAt: Date | null

  // Actions
  connectWithPat: (token: string, orgName: string) => Promise<void>
  connectWithApp: (
    appId: string,
    privateKeyPem: string,
    orgName: string,
  ) => Promise<void>
  disconnect: () => void
  loadFromStorage: () => void
  getToken: () => Promise<string>
  refreshInstallationToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authMode: null,
  orgName: null,
  orgDisplayName: null,
  isConnected: false,
  isValidating: false,
  validationError: null,

  patToken: null,

  appId: null,
  privateKeyPem: null,
  installationId: null,
  installationToken: null,
  installationTokenExpiresAt: null,

  connectWithPat: async (token: string, orgName: string) => {
    set({ isValidating: true, validationError: null })
    try {
      const octokit = getOctokit(token)
      const { data } = await octokit.orgs.get({ org: orgName })

      localStorage.setItem(STORAGE_KEY_AUTH_MODE, 'pat')
      localStorage.setItem(STORAGE_KEY_TOKEN, token)
      localStorage.setItem(STORAGE_KEY_ORG, orgName)

      set({
        authMode: 'pat',
        patToken: token,
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

  connectWithApp: async (
    appId: string,
    privateKeyPem: string,
    orgName: string,
  ) => {
    set({ isValidating: true, validationError: null })
    try {
      // Validate PEM format
      const pemCheck = validatePemFormat(privateKeyPem)
      if (!pemCheck.valid) {
        throw new Error(pemCheck.error)
      }

      // Generate JWT and find installation
      const jwt = await generateAppJwt(appId, privateKeyPem)
      const installationId = await findOrgInstallation(jwt, orgName)

      // Get installation token
      const instToken = await createInstallationToken(jwt, installationId)

      // Validate by fetching org or user info with the installation token
      const octokit = getOctokit(instToken.token)
      let displayName = orgName
      try {
        const { data } = await octokit.orgs.get({ org: orgName })
        displayName = data.name ?? orgName
      } catch {
        // Not an org — try as user
        const { data } = await octokit.users.getByUsername({ username: orgName })
        displayName = data.name ?? orgName
      }

      // Persist credentials
      localStorage.setItem(STORAGE_KEY_AUTH_MODE, 'github-app')
      localStorage.setItem(STORAGE_KEY_ORG, orgName)
      localStorage.setItem(STORAGE_KEY_APP_ID, appId)
      localStorage.setItem(STORAGE_KEY_APP_PEM, privateKeyPem)
      localStorage.setItem(STORAGE_KEY_INSTALLATION_ID, String(installationId))

      set({
        authMode: 'github-app',
        appId,
        privateKeyPem,
        installationId,
        installationToken: instToken.token,
        installationTokenExpiresAt: instToken.expiresAt,
        orgName,
        orgDisplayName: displayName,
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
    localStorage.removeItem(STORAGE_KEY_AUTH_MODE)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_ORG)
    localStorage.removeItem(STORAGE_KEY_APP_ID)
    localStorage.removeItem(STORAGE_KEY_APP_PEM)
    localStorage.removeItem(STORAGE_KEY_INSTALLATION_ID)
    clearClient()
    set({
      authMode: null,
      orgName: null,
      orgDisplayName: null,
      isConnected: false,
      isValidating: false,
      validationError: null,
      patToken: null,
      appId: null,
      privateKeyPem: null,
      installationId: null,
      installationToken: null,
      installationTokenExpiresAt: null,
    })
  },

  loadFromStorage: () => {
    const authMode = localStorage.getItem(STORAGE_KEY_AUTH_MODE) as AuthMode | null
    const orgName = localStorage.getItem(STORAGE_KEY_ORG)

    if (authMode === 'github-app') {
      const appId = localStorage.getItem(STORAGE_KEY_APP_ID)
      const pem = localStorage.getItem(STORAGE_KEY_APP_PEM)
      const instId = localStorage.getItem(STORAGE_KEY_INSTALLATION_ID)
      if (appId && pem && orgName && instId) {
        set({
          authMode: 'github-app',
          appId,
          privateKeyPem: pem,
          installationId: Number(instId),
          orgName,
          isConnected: true,
          // installationToken is NOT persisted — fetched lazily via getToken()
        })
        return
      }
    }

    // Fallback: PAT mode (also handles legacy storage without auth_mode key)
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    if (token && orgName) {
      set({
        authMode: 'pat',
        patToken: token,
        orgName,
        isConnected: true,
      })
    }
  },

  getToken: async () => {
    const state = get()

    if (state.authMode === 'pat') {
      if (!state.patToken) throw new AuthenticationError('No PAT configured')
      return state.patToken
    }

    if (state.authMode === 'github-app') {
      const needsRefresh =
        !state.installationToken ||
        !state.installationTokenExpiresAt ||
        isTokenExpiringSoon(state.installationTokenExpiresAt)

      if (needsRefresh) {
        // Deduplicate concurrent refresh calls
        if (!refreshPromise) {
          refreshPromise = get()
            .refreshInstallationToken()
            .finally(() => {
              refreshPromise = null
            })
        }
        await refreshPromise
      }

      const freshState = get()
      if (!freshState.installationToken) {
        throw new AuthenticationError('Failed to obtain installation token')
      }
      return freshState.installationToken
    }

    throw new AuthenticationError('Not authenticated')
  },

  refreshInstallationToken: async () => {
    const { appId, privateKeyPem, installationId } = get()
    if (!appId || !privateKeyPem || !installationId) {
      throw new AuthenticationError(
        'GitHub App credentials missing. Please re-authenticate.',
      )
    }

    try {
      const jwt = await generateAppJwt(appId, privateKeyPem)
      const instToken = await createInstallationToken(jwt, installationId)
      set({
        installationToken: instToken.token,
        installationTokenExpiresAt: instToken.expiresAt,
      })
    } catch (error) {
      // Credentials are invalid — force disconnect
      get().disconnect()
      throw new AuthenticationError(
        `Token refresh failed: ${getErrorMessage(error)}. Please re-authenticate.`,
      )
    }
  },
}))

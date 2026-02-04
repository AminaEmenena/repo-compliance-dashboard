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
import {
  fetchAppClientId,
  requestDeviceCode,
  pollForAccessToken,
  fetchUserLogin,
  verifyGitHubUsername,
  type DeviceCodeResponse,
} from '@/lib/github/device-flow'
import type { AuthMode } from '@/types/auth'
import { useAuditStore } from '@/stores/audit-store'

const STORAGE_KEY_AUTH_MODE = 'rcd_auth_mode'
const STORAGE_KEY_TOKEN = 'rcd_token'
const STORAGE_KEY_ORG = 'rcd_org'
const STORAGE_KEY_APP_ID = 'rcd_app_id'
const STORAGE_KEY_APP_PEM = 'rcd_app_pem'
const STORAGE_KEY_INSTALLATION_ID = 'rcd_installation_id'
const STORAGE_KEY_CLIENT_ID = 'rcd_client_id'
const STORAGE_KEY_ACTOR_LOGIN = 'rcd_actor_login'

// Concurrency guard for token refresh
let refreshPromise: Promise<void> | null = null
// Abort controller for device flow polling
let deviceFlowAbort: AbortController | null = null

export interface DeviceFlowState {
  userCode: string
  verificationUri: string
  expiresAt: Date
}

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

  // Actor identity (for audit log)
  actorLogin: string | null

  // GitHub App-specific
  appId: string | null
  privateKeyPem: string | null
  installationId: number | null
  installationToken: string | null
  installationTokenExpiresAt: Date | null
  clientId: string | null

  // Device flow / user identity
  deviceFlowState: DeviceFlowState | null
  identifyingUser: boolean
  identityError: string | null

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

  // User identity actions
  startDeviceFlow: () => Promise<void>
  cancelDeviceFlow: () => void
  setManualLogin: (username: string) => Promise<void>
  clearIdentity: () => void
  needsUserIdentity: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authMode: null,
  orgName: null,
  orgDisplayName: null,
  isConnected: false,
  isValidating: false,
  validationError: null,

  patToken: null,
  actorLogin: null,

  appId: null,
  privateKeyPem: null,
  installationId: null,
  installationToken: null,
  installationTokenExpiresAt: null,
  clientId: null,

  deviceFlowState: null,
  identifyingUser: false,
  identityError: null,

  connectWithPat: async (token: string, orgName: string) => {
    set({ isValidating: true, validationError: null })
    try {
      const octokit = getOctokit(token)
      const { data } = await octokit.orgs.get({ org: orgName })

      // Get authenticated user login for audit identity
      let actorLogin = orgName
      try {
        const { data: user } = await octokit.users.getAuthenticated()
        actorLogin = user.login
      } catch {
        // Fallback to org name
      }

      localStorage.setItem(STORAGE_KEY_AUTH_MODE, 'pat')
      localStorage.setItem(STORAGE_KEY_TOKEN, token)
      localStorage.setItem(STORAGE_KEY_ORG, orgName)
      localStorage.setItem(STORAGE_KEY_ACTOR_LOGIN, actorLogin)

      set({
        authMode: 'pat',
        patToken: token,
        orgName,
        orgDisplayName: data.name ?? orgName,
        actorLogin,
        isConnected: true,
        isValidating: false,
        validationError: null,
      })

      // Fire-and-forget audit
      useAuditStore.getState().initConfig(orgName)
      useAuditStore.getState().recordAction('auth.connected', actorLogin, {
        authMode: 'pat',
        orgName,
      }).catch(() => {})
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

      // Fetch the App's client_id for device flow (non-blocking)
      const clientId = await fetchAppClientId(jwt)

      // Try to fetch display name (org or user), but don't fail if it errors
      let displayName = orgName
      try {
        const octokit = getOctokit(instToken.token)
        const { data } = await octokit.orgs.get({ org: orgName })
        displayName = data.name ?? orgName
      } catch {
        // Not an org or insufficient permissions — use login as display name
      }

      // Persist credentials
      localStorage.setItem(STORAGE_KEY_AUTH_MODE, 'github-app')
      localStorage.setItem(STORAGE_KEY_ORG, orgName)
      localStorage.setItem(STORAGE_KEY_APP_ID, appId)
      localStorage.setItem(STORAGE_KEY_APP_PEM, privateKeyPem)
      localStorage.setItem(STORAGE_KEY_INSTALLATION_ID, String(installationId))
      if (clientId) {
        localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId)
      }

      // Actor defaults to app identifier until user identifies
      const actorLogin = `github-app[${appId}]`

      set({
        authMode: 'github-app',
        appId,
        privateKeyPem,
        installationId,
        installationToken: instToken.token,
        installationTokenExpiresAt: instToken.expiresAt,
        clientId,
        orgName,
        orgDisplayName: displayName,
        actorLogin,
        isConnected: true,
        isValidating: false,
        validationError: null,
      })

      // Fire-and-forget audit
      useAuditStore.getState().initConfig(orgName)
      useAuditStore.getState().recordAction('auth.connected', actorLogin, {
        authMode: 'github-app',
        orgName,
      }).catch(() => {})
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
    // Cancel any pending device flow
    deviceFlowAbort?.abort()
    deviceFlowAbort = null

    localStorage.removeItem(STORAGE_KEY_AUTH_MODE)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_ORG)
    localStorage.removeItem(STORAGE_KEY_APP_ID)
    localStorage.removeItem(STORAGE_KEY_APP_PEM)
    localStorage.removeItem(STORAGE_KEY_INSTALLATION_ID)
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID)
    localStorage.removeItem(STORAGE_KEY_ACTOR_LOGIN)
    clearClient()
    set({
      authMode: null,
      orgName: null,
      orgDisplayName: null,
      isConnected: false,
      isValidating: false,
      validationError: null,
      patToken: null,
      actorLogin: null,
      appId: null,
      privateKeyPem: null,
      installationId: null,
      installationToken: null,
      installationTokenExpiresAt: null,
      clientId: null,
      deviceFlowState: null,
      identifyingUser: false,
      identityError: null,
    })
  },

  loadFromStorage: () => {
    const authMode = localStorage.getItem(STORAGE_KEY_AUTH_MODE) as AuthMode | null
    const orgName = localStorage.getItem(STORAGE_KEY_ORG)
    const savedActorLogin = localStorage.getItem(STORAGE_KEY_ACTOR_LOGIN)

    if (authMode === 'github-app') {
      const appId = localStorage.getItem(STORAGE_KEY_APP_ID)
      const pem = localStorage.getItem(STORAGE_KEY_APP_PEM)
      const instId = localStorage.getItem(STORAGE_KEY_INSTALLATION_ID)
      const clientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID)
      if (appId && pem && orgName && instId) {
        set({
          authMode: 'github-app',
          appId,
          privateKeyPem: pem,
          installationId: Number(instId),
          clientId,
          orgName,
          actorLogin: savedActorLogin,
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
        actorLogin: savedActorLogin,
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

  // --- User Identity Actions ---

  startDeviceFlow: async () => {
    const { clientId } = get()
    if (!clientId) {
      set({
        identityError:
          'No Client ID available. The GitHub App may not have OAuth enabled. Use "Enter username" instead.',
      })
      return
    }

    // Cancel any previous flow
    deviceFlowAbort?.abort()
    const abort = new AbortController()
    deviceFlowAbort = abort

    set({ identifyingUser: true, identityError: null, deviceFlowState: null })

    try {
      // Step 1: Request device code
      const deviceCode: DeviceCodeResponse = await requestDeviceCode(clientId)

      set({
        deviceFlowState: {
          userCode: deviceCode.user_code,
          verificationUri: deviceCode.verification_uri,
          expiresAt: new Date(Date.now() + deviceCode.expires_in * 1000),
        },
      })

      // Step 2: Poll for access token
      const accessToken = await pollForAccessToken(
        clientId,
        deviceCode.device_code,
        deviceCode.interval,
        abort.signal,
      )

      // Step 3: Fetch user login
      const login = await fetchUserLogin(accessToken)

      localStorage.setItem(STORAGE_KEY_ACTOR_LOGIN, login)

      set({
        actorLogin: login,
        deviceFlowState: null,
        identifyingUser: false,
        identityError: null,
      })

      // Audit the identification
      const { orgName } = get()
      if (orgName) {
        useAuditStore.getState().recordAction('auth.connected', login, {
          authMode: 'github-app-oauth',
          orgName,
        }).catch(() => {})
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ identifyingUser: false, deviceFlowState: null })
        return
      }
      set({
        identifyingUser: false,
        deviceFlowState: null,
        identityError:
          err instanceof Error ? err.message : 'Device flow failed',
      })
    } finally {
      if (deviceFlowAbort === abort) {
        deviceFlowAbort = null
      }
    }
  },

  cancelDeviceFlow: () => {
    deviceFlowAbort?.abort()
    deviceFlowAbort = null
    set({
      deviceFlowState: null,
      identifyingUser: false,
      identityError: null,
    })
  },

  setManualLogin: async (username: string) => {
    set({ identifyingUser: true, identityError: null })

    try {
      const token = await get().getToken()
      const result = await verifyGitHubUsername(token, username)

      if (!result.valid) {
        set({
          identifyingUser: false,
          identityError: `GitHub user "${username}" not found. Please check the username.`,
        })
        return
      }

      localStorage.setItem(STORAGE_KEY_ACTOR_LOGIN, result.login)

      set({
        actorLogin: result.login,
        identifyingUser: false,
        identityError: null,
      })

      // Audit the identification
      const { orgName } = get()
      if (orgName) {
        useAuditStore.getState().recordAction('auth.connected', result.login, {
          authMode: 'github-app-manual',
          orgName,
        }).catch(() => {})
      }
    } catch (err) {
      set({
        identifyingUser: false,
        identityError:
          err instanceof Error ? err.message : 'Failed to verify username',
      })
    }
  },

  clearIdentity: () => {
    localStorage.removeItem(STORAGE_KEY_ACTOR_LOGIN)
    const { appId } = get()
    set({
      actorLogin: appId ? `github-app[${appId}]` : null,
      deviceFlowState: null,
      identifyingUser: false,
      identityError: null,
    })
  },

  needsUserIdentity: () => {
    const { authMode, actorLogin } = get()
    if (authMode !== 'github-app') return false
    return !actorLogin || actorLogin.startsWith('github-app[')
  },
}))

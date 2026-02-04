/**
 * GitHub OAuth Device Flow for user identity.
 * Used when the dashboard is connected via a shared GitHub App
 * to identify individual users for audit logging.
 */

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

/**
 * Fetch the GitHub App's client_id using JWT auth.
 * Called during connectWithApp to store the client_id for later OAuth flows.
 */
export async function fetchAppClientId(jwt: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/app', {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) return null

    const data: { client_id?: string } = await response.json()
    return data.client_id ?? null
  } catch {
    return null
  }
}

/**
 * Request a device code to start the OAuth device flow.
 * The user will be shown a code and directed to github.com/login/device.
 */
export async function requestDeviceCode(
  clientId: string,
): Promise<DeviceCodeResponse> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      scope: 'read:user',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to request device code (${response.status}). ` +
        'Ensure the GitHub App has "Device flow" enabled in its settings. ' +
        text,
    )
  }

  return response.json()
}

/**
 * Poll GitHub for the access token after the user has entered their device code.
 * Respects the polling interval and handles slow_down responses.
 */
export async function pollForAccessToken(
  clientId: string,
  deviceCode: string,
  interval: number,
  signal?: AbortSignal,
): Promise<string> {
  let pollInterval = interval * 1000

  while (!signal?.aborted) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, pollInterval)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })

    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
        signal,
      },
    )

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`)
    }

    const data: {
      access_token?: string
      error?: string
      error_description?: string
    } = await response.json()

    if (data.access_token) {
      return data.access_token
    }

    if (data.error === 'authorization_pending') {
      continue
    }

    if (data.error === 'slow_down') {
      pollInterval += 5000
      continue
    }

    if (data.error === 'expired_token') {
      throw new Error('Device code expired. Please try again.')
    }

    if (data.error === 'access_denied') {
      throw new Error('Authorization was denied by the user.')
    }

    throw new Error(data.error_description ?? data.error ?? 'Unknown error')
  }

  throw new DOMException('Aborted', 'AbortError')
}

/**
 * Fetch the authenticated user's login using an OAuth access token.
 */
export async function fetchUserLogin(accessToken: string): Promise<string> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`)
  }

  const data: { login: string } = await response.json()
  return data.login
}

/**
 * Verify a GitHub username exists using the installation token.
 * Used as a fallback when device flow is unavailable (CORS restrictions).
 */
export async function verifyGitHubUsername(
  token: string,
  username: string,
): Promise<{ valid: boolean; login: string }> {
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    },
  )

  if (!response.ok) {
    return { valid: false, login: username }
  }

  const data: { login: string } = await response.json()
  return { valid: true, login: data.login }
}

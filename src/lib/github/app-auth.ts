import { SignJWT, importPKCS8 } from 'jose'

export interface InstallationToken {
  token: string
  expiresAt: Date
  installationId: number
}

/**
 * Generate a JWT for GitHub App authentication.
 * Uses RS256 with a 9-minute expiry (under the 10-minute max).
 */
export async function generateAppJwt(
  appId: string,
  privateKeyPem: string,
): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, 'RS256')
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(appId)
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 540)
    .sign(privateKey)
}

/**
 * Find the installation ID for a given org by listing all app installations.
 * Uses raw fetch (not Octokit) since we're authenticating as the App via JWT.
 */
export async function findOrgInstallation(
  jwt: string,
  orgName: string,
): Promise<number> {
  const response = await fetch('https://api.github.com/app/installations', {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid App ID or private key. JWT authentication failed.')
    }
    throw new Error(`Failed to list installations: ${response.status}`)
  }

  const installations: Array<{
    id: number
    account: { login: string } | null
    target_type: string
  }> = await response.json()

  const match = installations.find(
    (inst) =>
      inst.account?.login.toLowerCase() === orgName.toLowerCase() &&
      inst.target_type === 'Organization',
  )

  if (!match) {
    const found = installations
      .map((i) => i.account?.login)
      .filter(Boolean)
      .join(', ')
    throw new Error(
      `GitHub App is not installed on organization "${orgName}". ` +
        (found ? `Found installations for: ${found}.` : 'No installations found.'),
    )
  }

  return match.id
}

/**
 * Create an installation access token (~1 hour lifetime).
 */
export async function createInstallationToken(
  jwt: string,
  installationId: number,
): Promise<InstallationToken> {
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'GitHub App is no longer installed on this organization.',
      )
    }
    throw new Error(
      `Failed to create installation token: ${response.status} ${response.statusText}`,
    )
  }

  const data: { token: string; expires_at: string } = await response.json()

  return {
    token: data.token,
    expiresAt: new Date(data.expires_at),
    installationId,
  }
}

/**
 * Basic PEM format validation.
 */
export function validatePemFormat(pem: string): {
  valid: boolean
  error?: string
} {
  const trimmed = pem.trim()
  if (
    !trimmed.startsWith('-----BEGIN') ||
    !trimmed.includes('PRIVATE KEY')
  ) {
    return {
      valid: false,
      error:
        'Private key must be in PEM format (starts with -----BEGIN RSA PRIVATE KEY----- or -----BEGIN PRIVATE KEY-----)',
    }
  }
  return { valid: true }
}

/**
 * Returns true if the token expires within the given buffer (default 5 minutes).
 */
export function isTokenExpiringSoon(
  expiresAt: Date,
  bufferMs: number = 5 * 60 * 1000,
): boolean {
  return Date.now() >= expiresAt.getTime() - bufferMs
}

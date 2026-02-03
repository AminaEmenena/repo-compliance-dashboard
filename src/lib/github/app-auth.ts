import { SignJWT, importPKCS8 } from 'jose'

export interface InstallationToken {
  token: string
  expiresAt: Date
  installationId: number
}

/**
 * Convert PKCS#1 PEM (BEGIN RSA PRIVATE KEY) to PKCS#8 PEM (BEGIN PRIVATE KEY).
 * GitHub App private keys are generated in PKCS#1 format, but jose requires PKCS#8.
 */
function convertPkcs1ToPkcs8(pem: string): string {
  if (pem.includes('BEGIN PRIVATE KEY')) {
    return pem // Already PKCS#8
  }

  // Extract base64 content from PKCS#1 PEM
  const b64 = pem
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const pkcs1Bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

  // ASN.1 PKCS#8 wrapper: version(0) + RSA algorithm OID + OCTET STRING of PKCS#1 key
  const rsaOid = [0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]
  const algorithmSeq = [0x30, rsaOid.length, ...rsaOid]
  const version = [0x02, 0x01, 0x00]

  // Encode OCTET STRING length for the PKCS#1 key
  const octetString = [0x04, ...encodeAsn1Length(pkcs1Bytes.length), ...pkcs1Bytes]

  const inner = [...version, ...algorithmSeq, ...octetString]
  const pkcs8Bytes = new Uint8Array([0x30, ...encodeAsn1Length(inner.length), ...inner])

  // Convert back to PEM
  const pkcs8B64 = btoa(String.fromCharCode(...pkcs8Bytes))
  const lines = pkcs8B64.match(/.{1,64}/g) ?? []
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`
}

function encodeAsn1Length(length: number): number[] {
  if (length < 0x80) return [length]
  if (length < 0x100) return [0x81, length]
  return [0x82, (length >> 8) & 0xff, length & 0xff]
}

/**
 * Generate a JWT for GitHub App authentication.
 * Uses RS256 with a 9-minute expiry (under the 10-minute max).
 */
export async function generateAppJwt(
  appId: string,
  privateKeyPem: string,
): Promise<string> {
  const pkcs8Pem = convertPkcs1ToPkcs8(privateKeyPem)
  const privateKey = await importPKCS8(pkcs8Pem, 'RS256')
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
      inst.account?.login.toLowerCase() === orgName.toLowerCase(),
  )

  if (!match) {
    const found = installations
      .map((i) => i.account?.login)
      .filter(Boolean)
      .join(', ')
    throw new Error(
      `GitHub App is not installed on "${orgName}". ` +
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

/**
 * User identity helpers for shared GitHub App authentication.
 * Verifies GitHub usernames so audit log entries are attributed
 * to real accounts.
 */

/**
 * Fetch the GitHub App's client_id using JWT auth.
 * Stored for potential future OAuth flows.
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
 * Verify a GitHub username exists using the installation token.
 * Returns the canonical login (correct casing) if found.
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

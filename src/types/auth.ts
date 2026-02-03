export type AuthMode = 'pat' | 'github-app'

export interface StoredGitHubAppConfig {
  appId: string
  privateKeyPem: string
  orgName: string
  installationId: number
}

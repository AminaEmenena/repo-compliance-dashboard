export type AuditAction =
  | 'auth.connected'
  | 'auth.disconnected'
  | 'property.updated'
  | 'property.created'
  | 'data.refreshed'

export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: AuditAction
  details: Record<string, unknown>
  source: 'dashboard' | 'github'
}

export interface AuditLogConfig {
  repoOwner: string
  repoName: string
  filePath: string
}

import { create } from 'zustand'
import { toast } from 'sonner'
import type { AuditAction, AuditEntry, AuditLogConfig } from '@/types/audit'
import {
  fetchAuditLogFile,
  appendAuditEntry,
  fetchGitHubAuditLog,
} from '@/lib/github/audit'
import { getOctokit } from '@/lib/github/client'
import { useAuthStore } from '@/stores/auth-store'

const STORAGE_KEY_AUDIT_CONFIG = 'rcd_audit_config'

type SourceFilter = 'all' | 'dashboard' | 'github'

interface AuditState {
  entries: AuditEntry[]
  isLoading: boolean
  error: string | null
  fileSha: string | null
  config: AuditLogConfig | null

  // Filters
  actionFilter: AuditAction | 'all'
  sourceFilter: SourceFilter

  // Actions
  initConfig: (orgName: string) => void
  fetchEntries: () => Promise<void>
  recordAction: (
    action: AuditAction,
    actor: string,
    details: Record<string, unknown>,
  ) => Promise<void>
  setActionFilter: (filter: AuditAction | 'all') => void
  setSourceFilter: (filter: SourceFilter) => void
  reset: () => void
}

function loadConfig(): AuditLogConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_CONFIG)
    if (!raw) return null
    return JSON.parse(raw) as AuditLogConfig
  } catch {
    return null
  }
}

function saveConfig(config: AuditLogConfig) {
  localStorage.setItem(STORAGE_KEY_AUDIT_CONFIG, JSON.stringify(config))
}

async function getAuthedOctokit() {
  const token = await useAuthStore.getState().getToken()
  return getOctokit(token)
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,
  fileSha: null,
  config: loadConfig(),

  actionFilter: 'all',
  sourceFilter: 'all',

  initConfig: (orgName: string) => {
    const existing = get().config
    if (existing && existing.repoOwner === orgName) return

    const config: AuditLogConfig = {
      repoOwner: orgName,
      repoName: '.github',
      filePath: '.compliance-dashboard/audit-log.json',
    }
    saveConfig(config)
    set({ config })
  },

  fetchEntries: async () => {
    const { config } = get()
    if (!config) return

    set({ isLoading: true, error: null })

    try {
      const octokit = await getAuthedOctokit()

      // Fetch dashboard entries and GitHub audit log in parallel
      const [fileResult, githubEntries] = await Promise.all([
        fetchAuditLogFile(octokit, config).catch(() => ({
          entries: [] as AuditEntry[],
          sha: null,
        })),
        fetchGitHubAuditLog(octokit, config.repoOwner).catch(
          () => [] as AuditEntry[],
        ),
      ])

      const combined = [...fileResult.entries, ...githubEntries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )

      set({
        entries: combined,
        fileSha: fileResult.sha,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch audit log',
      })
    }
  },

  recordAction: async (
    action: AuditAction,
    actor: string,
    details: Record<string, unknown>,
  ) => {
    const { config, fileSha } = get()
    if (!config) return

    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      source: 'dashboard',
    }

    try {
      const octokit = await getAuthedOctokit()
      const result = await appendAuditEntry(octokit, config, entry, fileSha)
      set((state) => ({
        entries: [entry, ...state.entries],
        fileSha: result.sha,
      }))
    } catch {
      toast.error('Failed to write audit log entry')
    }
  },

  setActionFilter: (filter) => set({ actionFilter: filter }),
  setSourceFilter: (filter) => set({ sourceFilter: filter }),

  reset: () => {
    localStorage.removeItem(STORAGE_KEY_AUDIT_CONFIG)
    set({
      entries: [],
      isLoading: false,
      error: null,
      fileSha: null,
      config: null,
      actionFilter: 'all',
      sourceFilter: 'all',
    })
  },
}))

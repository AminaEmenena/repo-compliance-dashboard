import { useEffect, useMemo } from 'react'
import { useAuditStore } from '@/stores/audit-store'
import { useAuthStore } from '@/stores/auth-store'
import type { AuditAction, AuditEntry } from '@/types/audit'
import { Spinner } from '@/components/ui/spinner'
import {
  ScrollText,
  LogIn,
  RefreshCw,
  Shield,
  Plus,
  Globe,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const ACTION_LABELS: Record<AuditAction, { label: string; icon: typeof LogIn; color: string }> = {
  'auth.connected': {
    label: 'Authenticated',
    icon: LogIn,
    color: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800',
  },
  'auth.disconnected': {
    label: 'Disconnected',
    icon: LogIn,
    color: 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700',
  },
  'property.updated': {
    label: 'Property Updated',
    icon: Shield,
    color: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  },
  'property.created': {
    label: 'Property Created',
    icon: Plus,
    color: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800',
  },
  'data.refreshed': {
    label: 'Data Refreshed',
    icon: RefreshCw,
    color: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800',
  },
}

function ActionBadge({ action }: { action: AuditAction }) {
  const config = ACTION_LABELS[action] ?? ACTION_LABELS['data.refreshed']
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.color,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

function SourceBadge({ source }: { source: 'dashboard' | 'github' }) {
  const Icon = source === 'dashboard' ? Monitor : Globe
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ring-1 ring-inset',
        source === 'dashboard'
          ? 'bg-indigo-50 text-indigo-600 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800'
          : 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
      )}
    >
      <Icon className="h-3 w-3" />
      {source === 'dashboard' ? 'Dashboard' : 'GitHub'}
    </span>
  )
}

function EntryDetails({ entry }: { entry: AuditEntry }) {
  const details = entry.details
  if (!details || Object.keys(details).length === 0) return null

  const items: string[] = []
  if (details.repoName) items.push(`Repo: ${details.repoName}`)
  if (details.propertyName) items.push(`Property: ${details.propertyName}`)
  if (details.oldValue !== undefined && details.newValue !== undefined) {
    items.push(`${String(details.oldValue || 'none')} \u2192 ${String(details.newValue || 'none')}`)
  }
  if (details.authMode) items.push(`Mode: ${details.authMode}`)
  if (details.orgName) items.push(`Org: ${details.orgName}`)
  if (details.repoCount) items.push(`Repos: ${details.repoCount}`)
  if (details.githubAction) items.push(`Action: ${details.githubAction}`)
  if (details.repo) items.push(`Repo: ${details.repo}`)

  if (items.length === 0) return null

  return (
    <p className="text-xs text-gray-500 dark:text-gray-400">
      {items.join(' \u00b7 ')}
    </p>
  )
}

function EntryCard({ entry }: { entry: AuditEntry }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <ActionBadge action={entry.action} />
          <SourceBadge source={entry.source} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            by <span className="font-medium text-gray-700 dark:text-gray-300">{entry.actor}</span>
          </span>
        </div>
        <EntryDetails entry={entry} />
      </div>
      <time className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
        {new Date(entry.timestamp).toLocaleString()}
      </time>
    </div>
  )
}

const ACTION_OPTIONS: { value: AuditAction | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'auth.connected', label: 'Authenticated' },
  { value: 'auth.disconnected', label: 'Disconnected' },
  { value: 'property.updated', label: 'Property Updated' },
  { value: 'property.created', label: 'Property Created' },
  { value: 'data.refreshed', label: 'Data Refreshed' },
]

const SOURCE_OPTIONS: { value: 'all' | 'dashboard' | 'github'; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'github', label: 'GitHub' },
]

export function AuditLogView() {
  const {
    entries,
    isLoading,
    error,
    actionFilter,
    sourceFilter,
    config,
    initConfig,
    fetchEntries,
    setActionFilter,
    setSourceFilter,
  } = useAuditStore()
  const { orgName } = useAuthStore()

  useEffect(() => {
    if (orgName) {
      initConfig(orgName)
    }
  }, [orgName, initConfig])

  useEffect(() => {
    if (config) {
      fetchEntries()
    }
  }, [config, fetchEntries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false
      if (sourceFilter !== 'all' && e.source !== sourceFilter) return false
      return true
    })
  }, [entries, actionFilter, sourceFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Audit Log
        </h2>
        {isLoading && <Spinner className="h-4 w-4" />}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as AuditAction | 'all')}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as 'all' | 'dashboard' | 'github')}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Entry list */}
      {!isLoading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400 dark:text-gray-500">
          <ScrollText className="h-10 w-10" />
          <p className="text-sm">No audit log entries found.</p>
          <p className="text-xs">Actions performed in the dashboard will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

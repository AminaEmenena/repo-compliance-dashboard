import { useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import type { RepoWithProperties } from '@/types/repo'
import type { ComplianceData, RepoAppInstallation } from '@/types/compliance'
import type { PropertyDefinition } from '@/types/property'
import { useUIStore } from '@/stores/ui-store'
import { SoxToggle } from './sox-toggle'
import { YesNo } from '@/components/ui/yes-no-badge'
import { Spinner } from '@/components/ui/spinner'
import {
  ExternalLink,
  Lock,
  Globe,
  Building2,
  Users,
  Bot,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const APPS_PREVIEW_COUNT = 5

function AppsCell({ apps }: { apps: RepoAppInstallation[] }) {
  const [expanded, setExpanded] = useState(false)

  if (apps.length === 0) {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
    )
  }

  const visible = expanded ? apps : apps.slice(0, APPS_PREVIEW_COUNT)
  const hiddenCount = apps.length - APPS_PREVIEW_COUNT

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {visible.map((app) => (
          <span
            key={app.appSlug}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 ring-1 ring-blue-200 ring-inset dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800"
          >
            <Bot className="h-3 w-3" />
            {app.appSlug}
          </span>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" />
              +{hiddenCount} more
            </>
          )}
        </button>
      )}
    </div>
  )
}

const columnHelper = createColumnHelper<RepoWithProperties>()

const SOX_PROPERTY = 'SOX-Compliance-Scope'

function Loading() {
  return <Spinner className="h-4 w-4" />
}

/** Read effective value from merged protection, falling back to classic */
function getCheck(c: ComplianceData, key: 'requirePr' | 'dismissStaleReviews' | 'requireCodeOwnerReviews' | 'requireLastPushApproval'): boolean | null {
  if (c.mergedProtection) return c.mergedProtection[key].effectiveValue
  if (c.protection) return c.protection[key]
  return null
}

function getApprovals(c: ComplianceData): number | null {
  if (c.mergedProtection) return c.mergedProtection.requiredApprovals.effectiveValue
  if (c.protection) return c.protection.requiredApprovals
  return null
}

function getBypassActors(c: ComplianceData) {
  return c.mergedProtection?.bypassActors ?? c.protection?.bypassActors ?? []
}

export function buildColumns(
  schema: PropertyDefinition[],
  onPropertyUpdate: (
    repoName: string,
    propertyName: string,
    value: string | null,
  ) => Promise<void>,
) {
  const hasSox = schema.some((p) => p.property_name === SOX_PROPERTY)

  return [
    // Repository name
    columnHelper.accessor('name', {
      header: 'Repository',
      cell: (info) => {
        const selectRepo = useUIStore.getState().selectRepo
        return (
          <div>
            <div className="flex items-center gap-2">
              <a
                href={info.row.original.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {info.getValue()}
              </a>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </div>
            <button
              type="button"
              onClick={() => selectRepo(info.row.original.name)}
              className="inline-flex items-center gap-0.5 text-xs text-blue-500 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View details
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )
      },
      enableSorting: true,
    }),

    // A. SOX Compliance Scope
    ...(hasSox
      ? [
          columnHelper.accessor(
            (row) => row.custom_properties[SOX_PROPERTY] ?? null,
            {
              id: 'sox_scope',
              header: 'SOX Scope',
              cell: (info) => {
                const value =
                  info.row.original.custom_properties[SOX_PROPERTY]
                return (
                  <SoxToggle
                    value={value === 'true'}
                    onChange={async (newVal) => {
                      await onPropertyUpdate(
                        info.row.original.name,
                        SOX_PROPERTY,
                        newVal ? 'true' : 'false',
                      )
                    }}
                  />
                )
              },
              enableSorting: true,
            },
          ),
        ]
      : []),

    // Visibility
    columnHelper.accessor('visibility', {
      header: 'Visibility',
      cell: (info) => {
        const v = info.getValue()
        const Icon =
          v === 'private' ? Lock : v === 'internal' ? Building2 : Globe
        const colors =
          v === 'private'
            ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800'
            : v === 'internal'
              ? 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800'
              : 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800'
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colors}`}
          >
            <Icon className="h-3 w-3" />
            {v}
          </span>
        )
      },
      enableSorting: true,
    }),

    // B. Admin Apps (collapsible — shows count, click to expand)
    columnHelper.display({
      id: 'github_apps',
      header: 'Admin Apps',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        const adminApps = c.apps.filter((a) => a.hasAdminAccess)
        return <AppsCell apps={adminApps} />
      },
    }),

    // C. Bypass Actors
    columnHelper.display({
      id: 'bypass_actors',
      header: 'Bypass Accounts',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        const actors = getBypassActors(c)
        if (actors.length === 0) {
          return (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              None
            </span>
          )
        }
        return (
          <div className="flex flex-wrap gap-1">
            {actors.map((actor) => (
              <span
                key={`${actor.type}-${actor.name}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ring-1 ring-inset',
                  actor.type === 'app'
                    ? 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800'
                    : 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800',
                )}
              >
                <Users className="h-3 w-3" />
                {actor.name}
              </span>
            ))}
          </div>
        )
      },
    }),

    // D. Require PR Before Merging
    columnHelper.display({
      id: 'require_pr',
      header: 'Require PR',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        return <YesNo value={getCheck(c, 'requirePr')} />
      },
    }),

    // E. Required Approvals
    columnHelper.display({
      id: 'required_approvals',
      header: 'Approvals',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        const count = getApprovals(c)
        if (count === null) {
          return <span className="text-xs text-gray-400">N/A</span>
        }
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
              count > 0
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
                : 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
            )}
          >
            {count}
          </span>
        )
      },
    }),

    // F. Dismiss Stale PR Approvals
    columnHelper.display({
      id: 'dismiss_stale',
      header: 'Dismiss Stale',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        return <YesNo value={getCheck(c, 'dismissStaleReviews')} />
      },
    }),

    // G. Require Code Owner Reviews
    columnHelper.display({
      id: 'code_owner_review',
      header: 'Code Owners',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        return <YesNo value={getCheck(c, 'requireCodeOwnerReviews')} />
      },
    }),

    // H. Bypass PR Allowances
    columnHelper.display({
      id: 'bypass_pr',
      header: 'PR Bypass Actors',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        const actors = getBypassActors(c)
        if (actors.length === 0) {
          return (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              None
            </span>
          )
        }
        return (
          <div className="flex flex-wrap gap-1">
            {actors.map((actor) => (
              <span
                key={`${actor.type}-${actor.name}`}
                className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-xs text-orange-700 ring-1 ring-orange-200 ring-inset dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800"
              >
                {actor.name} ({actor.type})
              </span>
            ))}
          </div>
        )
      },
    }),

    // I. Require Last Push Approval
    columnHelper.display({
      id: 'last_push_approval',
      header: 'Last Push Approval',
      cell: (info) => {
        const c = info.row.original.compliance
        if (!c) return <Loading />
        return <YesNo value={getCheck(c, 'requireLastPushApproval')} />
      },
    }),
  ]
}

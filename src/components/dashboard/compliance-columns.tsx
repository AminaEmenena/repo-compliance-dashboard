import { createColumnHelper } from '@tanstack/react-table'
import type { RepoWithProperties } from '@/types/repo'
import type { PropertyDefinition } from '@/types/property'
import { SoxToggle } from './sox-toggle'
import { PropertyBadge } from './property-badge'
import { ExternalLink, Lock, Globe, Building2, Archive } from 'lucide-react'

const columnHelper = createColumnHelper<RepoWithProperties>()

function formatPropertyName(name: string): string {
  return name.replace(/[-_]/g, ' ')
}

export function buildColumns(
  schema: PropertyDefinition[],
  onPropertyUpdate: (
    repoName: string,
    propertyName: string,
    value: string | null,
  ) => Promise<void>,
) {
  const staticColumns = [
    columnHelper.accessor('name', {
      header: 'Repository',
      cell: (info) => (
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
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('visibility', {
      header: 'Visibility',
      cell: (info) => {
        const v = info.getValue()
        const Icon = v === 'private' ? Lock : v === 'internal' ? Building2 : Globe
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
    columnHelper.accessor('language', {
      header: 'Language',
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue() ?? '-'}
        </span>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('archived', {
      header: 'Archived',
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200 ring-inset dark:bg-red-950 dark:text-red-300 dark:ring-red-800">
            <Archive className="h-3 w-3" />
            Yes
          </span>
        ) : null,
      enableSorting: true,
    }),
  ]

  const propertyColumns = schema.map((prop) =>
    columnHelper.accessor(
      (row) => row.custom_properties[prop.property_name] ?? null,
      {
        id: `prop_${prop.property_name}`,
        header: formatPropertyName(prop.property_name),
        cell: (info) => {
          const value = info.row.original.custom_properties[prop.property_name]

          if (prop.value_type === 'true_false') {
            return (
              <SoxToggle
                value={value === 'true'}
                onChange={async (newVal) => {
                  await onPropertyUpdate(
                    info.row.original.name,
                    prop.property_name,
                    newVal ? 'true' : 'false',
                  )
                }}
              />
            )
          }

          return <PropertyBadge value={value ?? null} definition={prop} />
        },
        enableSorting: true,
      },
    ),
  )

  const updatedAtColumn = columnHelper.accessor('updated_at', {
    header: 'Last Updated',
    cell: (info) => {
      const date = info.getValue()
      if (!date) return '-'
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
    enableSorting: true,
  })

  return [...staticColumns, ...propertyColumns, updatedAtColumn]
}

import { cn } from '@/lib/utils/cn'
import type { PropertyDefinition } from '@/types/property'

interface PropertyBadgeProps {
  value: string | string[] | null
  definition?: PropertyDefinition
}

export function PropertyBadge({ value, definition }: PropertyBadgeProps) {
  if (value === null || value === undefined) {
    return (
      <span className="inline-flex items-center rounded-md border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500">
        unset
      </span>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200 ring-inset dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800"
          >
            {v}
          </span>
        ))}
      </div>
    )
  }

  const isTrueFalse = definition?.value_type === 'true_false'

  if (isTrueFalse) {
    const isTrue = value === 'true'
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
          isTrue
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
            : 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
        )}
      >
        {isTrue ? 'true' : 'false'}
      </span>
    )
  }

  if (definition?.value_type === 'url') {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
      >
        {value}
      </a>
    )
  }

  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 ring-inset dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800">
      {value}
    </span>
  )
}

import { Lock, Globe, Building2 } from 'lucide-react'

export function VisibilityBadge({
  visibility,
}: {
  visibility: 'public' | 'private' | 'internal'
}) {
  const Icon =
    visibility === 'private'
      ? Lock
      : visibility === 'internal'
        ? Building2
        : Globe
  const colors =
    visibility === 'private'
      ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800'
      : visibility === 'internal'
        ? 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800'
        : 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colors}`}
    >
      <Icon className="h-3 w-3" />
      {visibility}
    </span>
  )
}

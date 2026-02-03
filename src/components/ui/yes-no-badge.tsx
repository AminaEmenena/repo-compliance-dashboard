import { Check, X, Minus } from 'lucide-react'

export function YesNo({ value }: { value: boolean | null }) {
  if (value === null) {
    return <Minus className="h-4 w-4 text-gray-300 dark:text-gray-600" />
  }
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 ring-inset dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
      <Check className="h-3 w-3" />
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200 ring-inset dark:bg-red-950 dark:text-red-300 dark:ring-red-800">
      <X className="h-3 w-3" />
      No
    </span>
  )
}

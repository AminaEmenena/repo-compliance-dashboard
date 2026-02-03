import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ShieldCheck, ShieldPlus } from 'lucide-react'

interface SoxToggleProps {
  value: boolean
  onChange: (newValue: boolean) => Promise<void>
}

export function SoxToggle({ value, onChange }: SoxToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      await onChange(!value)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      type="button"
      disabled={isUpdating}
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
        value
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800 dark:hover:bg-emerald-900'
          : 'bg-gray-50 text-gray-600 ring-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-300 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-blue-950 dark:hover:text-blue-300 dark:hover:ring-blue-800',
        isUpdating && 'opacity-50 cursor-wait',
      )}
    >
      {value ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5" />
          In Scope
        </>
      ) : (
        <>
          <ShieldPlus className="h-3.5 w-3.5" />
          Add to Scope
        </>
      )}
    </button>
  )
}

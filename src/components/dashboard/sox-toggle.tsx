import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

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
      role="switch"
      aria-checked={value}
      disabled={isUpdating}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600',
        isUpdating && 'opacity-50 cursor-wait',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          value ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

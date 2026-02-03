import { useState } from 'react'
import { ShieldAlert, Plus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface SoxSetupBannerProps {
  onCreateProperty: () => Promise<void>
}

export function SoxSetupBanner({ onCreateProperty }: SoxSetupBannerProps) {
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await onCreateProperty()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            SOX-Compliance-Scope property not found
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Create this custom property on your org to start tracking SOX compliance scope for repositories.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={isCreating}
        onClick={handleCreate}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        {isCreating ? (
          <Spinner />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Create Property
      </button>
    </div>
  )
}

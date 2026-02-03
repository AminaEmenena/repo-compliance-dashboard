import { useMemo } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useRepoStore } from '@/stores/repo-store'
import type { RepoWithProperties } from '@/types/repo'

export function useSelectedRepo(): RepoWithProperties | null {
  const selectedRepoName = useUIStore((s) => s.selectedRepoName)
  const repositories = useRepoStore((s) => s.repositories)

  return useMemo(() => {
    if (!selectedRepoName) return null
    return repositories.find((r) => r.name === selectedRepoName) ?? null
  }, [selectedRepoName, repositories])
}

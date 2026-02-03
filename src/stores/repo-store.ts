import { create } from 'zustand'
import { toast } from 'sonner'
import type { RepoWithProperties } from '@/types/repo'
import type { PropertyDefinition } from '@/types/property'
import { getOctokit } from '@/lib/github/client'
import { fetchAllRepos } from '@/lib/github/repos'
import {
  fetchPropertySchema,
  fetchPropertyValues,
  updatePropertyValues,
} from '@/lib/github/properties'
import { getErrorMessage } from '@/lib/utils/errors'

interface RepoState {
  repositories: RepoWithProperties[]
  propertySchema: PropertyDefinition[]
  isLoading: boolean
  error: string | null
  lastFetchedAt: string | null

  fetchAll: (token: string, orgName: string) => Promise<void>
  updateProperty: (
    token: string,
    orgName: string,
    repoName: string,
    propertyName: string,
    value: string | null,
  ) => Promise<void>
  reset: () => void
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repositories: [],
  propertySchema: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  fetchAll: async (token: string, orgName: string) => {
    set({ isLoading: true, error: null })
    try {
      const octokit = getOctokit(token)

      const [repos, schema, propValues] = await Promise.all([
        fetchAllRepos(octokit, orgName),
        fetchPropertySchema(octokit, orgName),
        fetchPropertyValues(octokit, orgName),
      ])

      const propsMap = new Map<string, Record<string, string | string[] | null>>()
      for (const pv of propValues) {
        const props: Record<string, string | string[] | null> = {}
        for (const p of pv.properties) {
          props[p.property_name] = p.value
        }
        propsMap.set(pv.repository_name, props)
      }

      const merged: RepoWithProperties[] = repos.map((repo) => ({
        ...repo,
        custom_properties: propsMap.get(repo.name) ?? {},
      }))

      set({
        repositories: merged,
        propertySchema: schema,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
      })
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      })
    }
  },

  updateProperty: async (
    token: string,
    orgName: string,
    repoName: string,
    propertyName: string,
    value: string | null,
  ) => {
    const { repositories } = get()
    const repoIndex = repositories.findIndex((r) => r.name === repoName)
    if (repoIndex === -1) return

    const originalValue =
      repositories[repoIndex].custom_properties[propertyName]

    // Optimistic update
    const updated = [...repositories]
    updated[repoIndex] = {
      ...updated[repoIndex],
      custom_properties: {
        ...updated[repoIndex].custom_properties,
        [propertyName]: value,
      },
    }
    set({ repositories: updated })

    try {
      const octokit = getOctokit(token)
      await updatePropertyValues(octokit, orgName, {
        repository_names: [repoName],
        properties: [{ property_name: propertyName, value }],
      })
      toast.success(`Updated ${propertyName} for ${repoName}`)
    } catch (error) {
      // Rollback
      const rollback = [...get().repositories]
      if (rollback[repoIndex]) {
        rollback[repoIndex] = {
          ...rollback[repoIndex],
          custom_properties: {
            ...rollback[repoIndex].custom_properties,
            [propertyName]: originalValue,
          },
        }
        set({ repositories: rollback })
      }
      toast.error(`Failed to update: ${getErrorMessage(error)}`)
    }
  },

  reset: () => {
    set({
      repositories: [],
      propertySchema: [],
      isLoading: false,
      error: null,
      lastFetchedAt: null,
    })
  },
}))

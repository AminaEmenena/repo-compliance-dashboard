import { create } from 'zustand'
import { toast } from 'sonner'
import type { RepoWithProperties } from '@/types/repo'
import type { PropertyDefinition } from '@/types/property'
import type { RepoAppInstallation } from '@/types/compliance'
import { getOctokit } from '@/lib/github/client'
import { fetchAllRepos } from '@/lib/github/repos'
import {
  fetchPropertySchema,
  fetchPropertyValues,
  updatePropertyValues,
  createOrgProperty,
} from '@/lib/github/properties'
import {
  fetchAllCompliance,
  fetchOrgInstallations,
} from '@/lib/github/compliance'
import { getErrorMessage } from '@/lib/utils/errors'
import { useAuthStore } from '@/stores/auth-store'

const CACHE_KEY = 'rcd_repo_cache'

interface CachedData {
  repositories: RepoWithProperties[]
  propertySchema: PropertyDefinition[]
  orgApps: RepoAppInstallation[]
  lastFetchedAt: string
  orgName: string
}

function saveCache(data: CachedData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function loadCache(orgName: string): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CachedData
    if (data.orgName !== orgName) return null
    return data
  } catch {
    return null
  }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY)
}

async function getAuthedOctokit() {
  const token = await useAuthStore.getState().getToken()
  return getOctokit(token)
}

interface RepoState {
  repositories: RepoWithProperties[]
  propertySchema: PropertyDefinition[]
  orgApps: RepoAppInstallation[]
  isLoading: boolean
  complianceProgress: string | null
  error: string | null
  lastFetchedAt: string | null

  fetchAll: (orgName: string) => Promise<void>
  loadFromCache: (orgName: string) => boolean
  createSoxProperty: (orgName: string) => Promise<void>
  updateProperty: (
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
  orgApps: [],
  isLoading: false,
  complianceProgress: null,
  error: null,
  lastFetchedAt: null,

  loadFromCache: (orgName: string) => {
    const cached = loadCache(orgName)
    if (!cached) return false
    set({
      repositories: cached.repositories,
      propertySchema: cached.propertySchema,
      orgApps: cached.orgApps,
      lastFetchedAt: cached.lastFetchedAt,
      isLoading: false,
      error: null,
    })
    return true
  },

  fetchAll: async (orgName: string) => {
    set({ isLoading: true, error: null, complianceProgress: null })
    try {
      const octokit = await getAuthedOctokit()

      // Phase 1: fetch repos, property schema/values, and org apps in parallel
      const [repos, schema, propValues, orgApps] = await Promise.all([
        fetchAllRepos(octokit, orgName),
        fetchPropertySchema(octokit, orgName),
        fetchPropertyValues(octokit, orgName),
        fetchOrgInstallations(octokit, orgName),
      ])

      const propsMap = new Map<string, Record<string, string | string[] | null>>()
      for (const pv of propValues) {
        const props: Record<string, string | string[] | null> = {}
        for (const p of pv.properties) {
          props[p.property_name] = p.value
        }
        propsMap.set(pv.repository_name, props)
      }

      // Show repos immediately while compliance loads
      const merged: RepoWithProperties[] = repos.map((repo) => ({
        ...repo,
        custom_properties: propsMap.get(repo.name) ?? {},
        compliance: null,
      }))

      set({
        repositories: merged,
        propertySchema: schema,
        orgApps,
        isLoading: false,
        complianceProgress: `Loading protection rules (0/${repos.length})...`,
        lastFetchedAt: new Date().toISOString(),
      })

      // Phase 2: fetch branch protection per repo (concurrent, background)
      const nonArchived = repos.filter((r) => !r.archived)
      const complianceMap = await fetchAllCompliance(
        octokit,
        orgName,
        nonArchived,
        (completed, total) => {
          set({
            complianceProgress: `Loading protection rules (${completed}/${total})...`,
          })
        },
      )

      // Merge compliance data into repos
      const withCompliance: RepoWithProperties[] = get().repositories.map(
        (repo) => {
          const compResult = complianceMap.get(repo.name)
          return {
            ...repo,
            compliance: compResult
              ? {
                  protection: compResult.protection,
                  protectionError: compResult.protectionError,
                  mergedProtection: compResult.mergedProtection,
                  rulesError: compResult.rulesError,
                  hasRulesets: compResult.hasRulesets,
                  apps: orgApps,
                }
              : repo.archived
                ? { protection: null, protectionError: 'Archived', mergedProtection: null, rulesError: null, hasRulesets: false, apps: [] }
                : null,
          }
        },
      )

      set({ repositories: withCompliance, complianceProgress: null })

      // Cache for next load
      saveCache({
        repositories: withCompliance,
        propertySchema: get().propertySchema,
        orgApps: get().orgApps,
        lastFetchedAt: get().lastFetchedAt ?? new Date().toISOString(),
        orgName,
      })
    } catch (error) {
      set({
        isLoading: false,
        complianceProgress: null,
        error: getErrorMessage(error),
      })
    }
  },

  createSoxProperty: async (orgName: string) => {
    try {
      const octokit = await getAuthedOctokit()
      await createOrgProperty(octokit, orgName, {
        property_name: 'SOX-Compliance-Scope',
        value_type: 'true_false',
        required: false,
        default_value: null,
        description: 'Whether this repository is in scope for SOX compliance',
      })
      toast.success('SOX-Compliance-Scope property created on org')
      await get().fetchAll(orgName)
    } catch (error) {
      toast.error(`Failed to create property: ${getErrorMessage(error)}`)
    }
  },

  updateProperty: async (
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
      const octokit = await getAuthedOctokit()
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
    clearCache()
    set({
      repositories: [],
      propertySchema: [],
      orgApps: [],
      isLoading: false,
      complianceProgress: null,
      error: null,
      lastFetchedAt: null,
    })
  },
}))

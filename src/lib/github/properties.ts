import type { Octokit } from '@octokit/rest'
import type { PropertyDefinition, PropertyValue, PropertyUpdate } from '@/types/property'
import { handleApiError } from './client'

export async function fetchPropertySchema(
  octokit: Octokit,
  org: string,
): Promise<PropertyDefinition[]> {
  try {
    const { data } = await octokit.request(
      'GET /orgs/{org}/properties/schema',
      { org },
    )
    return data as PropertyDefinition[]
  } catch (error) {
    handleApiError(error)
  }
}

export async function fetchPropertyValues(
  octokit: Octokit,
  org: string,
): Promise<PropertyValue[]> {
  try {
    const values = await octokit.paginate(
      'GET /orgs/{org}/properties/values',
      { org, per_page: 100 },
    )
    return values as PropertyValue[]
  } catch (error) {
    handleApiError(error)
  }
}

export async function updatePropertyValues(
  octokit: Octokit,
  org: string,
  update: PropertyUpdate,
): Promise<void> {
  try {
    const BATCH_SIZE = 30
    const repoNames = update.repository_names

    for (let i = 0; i < repoNames.length; i += BATCH_SIZE) {
      const batch = repoNames.slice(i, i + BATCH_SIZE)
      await octokit.request('PATCH /orgs/{org}/properties/values', {
        org,
        repository_names: batch,
        properties: update.properties,
      })
    }
  } catch (error) {
    handleApiError(error)
  }
}

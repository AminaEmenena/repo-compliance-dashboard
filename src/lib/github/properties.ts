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

export async function createOrgProperty(
  octokit: Octokit,
  org: string,
  property: {
    property_name: string
    value_type: 'string' | 'single_select' | 'multi_select' | 'true_false' | 'url'
    required?: boolean
    default_value?: string | null
    description?: string | null
    allowed_values?: string[] | null
  },
): Promise<void> {
  try {
    await octokit.request(
      'PUT /orgs/{org}/properties/schema/{custom_property_name}',
      {
        org,
        custom_property_name: property.property_name,
        value_type: property.value_type as 'string' | 'single_select' | 'multi_select' | 'true_false',
        required: property.required ?? false,
        default_value: property.default_value ?? null,
        description: property.description ?? null,
        allowed_values: property.allowed_values ?? null,
      },
    )
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

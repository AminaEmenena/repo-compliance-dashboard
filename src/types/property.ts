export interface PropertyDefinition {
  property_name: string
  value_type: 'string' | 'single_select' | 'multi_select' | 'true_false' | 'url'
  required: boolean
  default_value: string | string[] | null
  description: string | null
  allowed_values: string[] | null
  values_editable_by: 'org_actors' | 'org_and_repo_actors' | null
}

export interface PropertyValue {
  repository_id: number
  repository_name: string
  repository_full_name: string
  properties: Array<{
    property_name: string
    value: string | string[] | null
  }>
}

export interface PropertyUpdate {
  repository_names: string[]
  properties: Array<{
    property_name: string
    value: string | string[] | null
  }>
}

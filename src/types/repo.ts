export interface Repository {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  private: boolean
  visibility: 'public' | 'private' | 'internal'
  archived: boolean
  language: string | null
  default_branch: string
  updated_at: string
  topics: string[]
}

export interface RepoWithProperties extends Repository {
  custom_properties: Record<string, string | string[] | null>
}

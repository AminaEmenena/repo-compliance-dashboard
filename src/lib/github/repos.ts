import type { Octokit } from '@octokit/rest'
import type { Repository } from '@/types/repo'
import { handleApiError } from './client'

export async function fetchAllRepos(
  octokit: Octokit,
  org: string,
): Promise<Repository[]> {
  try {
    const repos = await octokit.paginate(octokit.repos.listForOrg, {
      org,
      type: 'all',
      sort: 'full_name',
      per_page: 100,
    })

    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description ?? null,
      private: repo.private,
      visibility: (repo.visibility ?? (repo.private ? 'private' : 'public')) as
        | 'public'
        | 'private'
        | 'internal',
      archived: repo.archived ?? false,
      language: repo.language ?? null,
      default_branch: repo.default_branch ?? 'main',
      updated_at: repo.updated_at ?? '',
      topics: repo.topics ?? [],
    }))
  } catch (error) {
    handleApiError(error)
  }
}

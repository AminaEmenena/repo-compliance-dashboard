import { useState } from 'react'
import { BookOpen, Key, Server, Terminal, FolderTree, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'authentication', label: 'Authentication', icon: Key },
  { id: 'api-reference', label: 'API Reference', icon: Server },
  { id: 'gh-cli', label: 'gh CLI Commands', icon: Terminal },
  { id: 'project-structure', label: 'Project Structure', icon: FolderTree },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-lg font-semibold text-gray-900 dark:text-gray-100 scroll-mt-4">
      {children}
    </h2>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {cell.startsWith('`') && cell.endsWith('`') ? (
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
                      {cell.slice(1, -1)}
                    </code>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
      {children}
    </pre>
  )
}

export function DocsView() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  const handleNavClick = (id: SectionId) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex gap-8">
      {/* Table of contents */}
      <nav className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-6 space-y-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Contents
          </p>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleNavClick(id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                activeSection === id
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-4xl flex-1 space-y-10">
        {/* Overview */}
        <section id="overview" className="space-y-4">
          <SectionHeading id="overview-heading">Overview</SectionHeading>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            The Repo Compliance Dashboard is a web application for auditing GitHub repository
            compliance across an organization. It monitors branch protection rules, rulesets,
            installed GitHub Apps, custom properties, and SOX compliance scope.
          </p>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {['React 19', 'TypeScript', 'Vite', 'TailwindCSS 4', 'Zustand', 'TanStack Table', 'Octokit', 'jose'].map(
                (tech) => (
                  <span
                    key={tech}
                    className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tech}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="space-y-4">
          <SectionHeading id="features-heading">Features</SectionHeading>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {[
              ['Branch protection auditing', 'Checks classic branch protection and GitHub repository rulesets per repo'],
              ['Merged rule view', 'Combines classic protection + org/repo rulesets into a single effective view with source attribution'],
              ['GitHub Apps inventory', 'Lists installed apps per repo; table view filters to apps with administration: write permission'],
              ['SOX compliance tracking', 'Uses GitHub custom properties to flag repos as in/out of SOX scope'],
              ['Custom properties', 'Reads and writes org-level custom repository properties'],
              ['Bypass actor visibility', 'Surfaces which users, teams, and apps can bypass branch protection'],
              ['Caching', 'Stores fetched data in localStorage to avoid redundant API calls on reload'],
              ['Dual auth', 'Supports Personal Access Token (PAT) or GitHub App authentication'],
              ['Audit log', 'Records dashboard actions (auth, property changes, data refresh) to a JSON file in the org\'s .github repo'],
              ['User identity', 'Identifies individual users via OAuth device flow or verified username when using a shared GitHub App'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">{title}</strong> &mdash; {desc}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Authentication */}
        <section id="authentication" className="space-y-6">
          <SectionHeading id="auth-heading">Authentication</SectionHeading>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Personal Access Token (PAT)
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Create a fine-grained or classic token with the following scopes:
            </p>
            <Table
              headers={['Scope', 'Purpose']}
              rows={[
                ['`repo`', 'Read branch protection, rulesets, repo metadata, read/write audit log file'],
                ['`admin:org`', 'Read org installations, custom properties, create/update properties, read audit log'],
                ['`read:org`', 'Read org metadata (display name)'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              GitHub App
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Register a GitHub App with these permissions:
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Repository permissions:</p>
            <Table
              headers={['Permission', 'Access', 'Purpose']}
              rows={[
                ['Administration', 'Read', 'Read branch protection rules and rulesets'],
                ['Contents', 'Read & Write', 'Read/write audit log file to repo'],
                ['Metadata', 'Read', 'List repositories'],
              ]}
            />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Organization permissions:</p>
            <Table
              headers={['Permission', 'Access', 'Purpose']}
              rows={[
                ['Members', 'Read', 'Read org metadata'],
                ['Custom properties', 'Read & Write', 'Read/write SOX compliance and other custom properties'],
              ]}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The app authenticates by generating a JWT (RS256, 9-minute expiry) from the App ID
              and private key, then exchanging it for a short-lived installation access token (~1 hour).
            </p>
          </div>
        </section>

        {/* API Reference */}
        <section id="api-reference" className="space-y-6">
          <SectionHeading id="api-heading">GitHub API Reference</SectionHeading>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Every GitHub API endpoint the dashboard calls, grouped by domain.
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Repositories</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/orgs/{org}/repos`', 'List all repositories in the org (paginated)', '`repos.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Branch Protection</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/repos/{owner}/{repo}/branches/{branch}/protection`', 'Fetch classic branch protection for default branch', '`compliance.ts`'],
                ['`GET`', '`/repos/{owner}/{repo}/rules/branches/{branch}`', 'Fetch branch rulesets (org + repo level)', '`compliance.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">GitHub App Installations</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/orgs/{org}/installations`', 'List all GitHub App installations on the org', '`compliance.ts`'],
                ['`GET`', '`/user/installations/{installation_id}/repositories`', 'List repos an app installation has access to', '`compliance.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Custom Properties</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/orgs/{org}/properties/schema`', 'Fetch property definitions', '`properties.ts`'],
                ['`GET`', '`/orgs/{org}/properties/values`', 'Fetch property values for all repos', '`properties.ts`'],
                ['`PUT`', '`/orgs/{org}/properties/schema/{name}`', 'Create a new custom property definition', '`properties.ts`'],
                ['`PATCH`', '`/orgs/{org}/properties/values`', 'Update property values (batched)', '`properties.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Audit Log</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/repos/{owner}/{repo}/contents/{path}`', 'Read audit log file from repo', '`audit.ts`'],
                ['`PUT`', '`/repos/{owner}/{repo}/contents/{path}`', 'Write/update audit log file', '`audit.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">GitHub App Authentication</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/app/installations`', 'Find the installation ID for the target org', '`app-auth.ts`'],
                ['`POST`', '`/app/installations/{id}/access_tokens`', 'Create a short-lived installation access token', '`app-auth.ts`'],
                ['`GET`', '`/app`', 'Fetch App metadata including client_id for OAuth', '`device-flow.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">User Identity (OAuth Device Flow)</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`POST`', '`github.com/login/device/code`', 'Request device + user verification codes', '`device-flow.ts`'],
                ['`POST`', '`github.com/login/oauth/access_token`', 'Exchange device code for user access token', '`device-flow.ts`'],
                ['`GET`', '`/user`', 'Fetch authenticated user login from OAuth token', '`device-flow.ts`'],
                ['`GET`', '`/users/{username}`', 'Verify a GitHub username exists (manual fallback)', '`device-flow.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Organization & User</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/orgs/{org}`', 'Validate auth token and fetch org display name', '`auth-store.ts`'],
                ['`GET`', '`/user`', 'Get authenticated user login for audit actor identity', '`auth-store.ts`'],
              ]}
            />
          </div>
        </section>

        {/* gh CLI Commands */}
        <section id="gh-cli" className="space-y-4">
          <SectionHeading id="cli-heading">Equivalent gh CLI Commands</SectionHeading>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            For manual testing or debugging, call the same endpoints with the GitHub CLI:
          </p>
          <CodeBlock>{`# List org repos
gh api /orgs/{org}/repos --paginate --jq '.[].name'

# Classic branch protection
gh api /repos/{owner}/{repo}/branches/{branch}/protection

# Branch rulesets
gh api /repos/{owner}/{repo}/rules/branches/{branch}

# Org app installations (includes permissions)
gh api /orgs/{org}/installations --jq '.installations[] | {slug: .app_slug, admin: .permissions.administration}'

# Repos accessible to a specific app installation
gh api /user/installations/{installation_id}/repositories --jq '.repositories[].name'

# Custom property schema
gh api /orgs/{org}/properties/schema

# Custom property values
gh api /orgs/{org}/properties/values --paginate

# Read audit log file from repo
gh api /repos/{owner}/{repo}/contents/.compliance-dashboard/audit-log.json --jq '.content' | base64 -d

# Org info
gh api /orgs/{org} --jq '{name: .name, login: .login}'`}</CodeBlock>
        </section>

        {/* Project Structure */}
        <section id="project-structure" className="space-y-4">
          <SectionHeading id="structure-heading">Project Structure</SectionHeading>
          <CodeBlock>{`src/
\u251c\u2500\u2500 components/
\u2502   \u251c\u2500\u2500 audit/           # Audit log view
\u2502   \u251c\u2500\u2500 dashboard/       # Table view: compliance-table, columns, stats, toolbar
\u2502   \u251c\u2500\u2500 detail/          # Detail view: per-repo compliance + apps sections
\u2502   \u251c\u2500\u2500 docs/            # In-app documentation page
\u2502   \u251c\u2500\u2500 layout/          # App shell, header, setup screen, user identity banner
\u2502   \u251c\u2500\u2500 sidebar/         # Repo list sidebar with search
\u2502   \u2514\u2500\u2500 ui/              # Shared components (badges, spinner)
\u251c\u2500\u2500 hooks/               # useMediaQuery, useSelectedRepo
\u251c\u2500\u2500 lib/
\u2502   \u251c\u2500\u2500 github/          # All GitHub API integration
\u2502   \u2502   \u251c\u2500\u2500 app-auth.ts  # JWT generation, installation token management
\u2502   \u2502   \u251c\u2500\u2500 audit.ts     # Audit log file read/write
\u2502   \u2502   \u251c\u2500\u2500 client.ts    # Octokit client factory
\u2502   \u2502   \u251c\u2500\u2500 compliance.ts# Branch protection, rulesets, org installations
\u2502   \u2502   \u251c\u2500\u2500 device-flow.ts# OAuth device flow for user identity
\u2502   \u2502   \u251c\u2500\u2500 properties.ts# Custom property CRUD
\u2502   \u2502   \u2514\u2500\u2500 repos.ts     # Repository listing
\u2502   \u2514\u2500\u2500 utils/           # Error handling, cn() helper
\u251c\u2500\u2500 stores/              # Zustand stores
\u2502   \u251c\u2500\u2500 audit-store.ts   # Audit log state, recording, fetching
\u2502   \u251c\u2500\u2500 auth-store.ts    # PAT + GitHub App auth state, user identity
\u2502   \u251c\u2500\u2500 repo-store.ts    # Repos, compliance data, caching
\u2502   \u2514\u2500\u2500 ui-store.ts      # View navigation, sidebar, filters
\u2514\u2500\u2500 types/               # TypeScript interfaces
    \u251c\u2500\u2500 audit.ts
    \u251c\u2500\u2500 auth.ts
    \u251c\u2500\u2500 compliance.ts
    \u251c\u2500\u2500 property.ts
    \u2514\u2500\u2500 repo.ts`}</CodeBlock>
        </section>
      </div>
    </div>
  )
}

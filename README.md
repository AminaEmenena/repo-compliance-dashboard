# Repo Compliance Dashboard

A web dashboard for auditing GitHub repository compliance across an organization. Monitors branch protection rules, rulesets, installed GitHub Apps, custom properties, and SOX compliance scope.

## Features

- **Branch protection auditing** — checks classic branch protection and GitHub repository rulesets per repo
- **Merged rule view** — combines classic protection + org/repo rulesets into a single effective view with source attribution
- **GitHub Apps inventory** — lists installed apps per repo; table view filters to apps with `administration: write` permission
- **SOX compliance tracking** — uses GitHub custom properties to flag repos as in/out of SOX scope
- **Custom properties** — reads and writes org-level custom repository properties
- **Bypass actor visibility** — surfaces which users, teams, and apps can bypass branch protection
- **Caching** — stores fetched data in localStorage to avoid redundant API calls on reload
- **Dual auth** — supports Personal Access Token (PAT) or GitHub App authentication
- **In-app docs** — built-in documentation page with API reference and `gh` CLI equivalents

## Tech Stack

- React 19, TypeScript, Vite
- TailwindCSS 4
- Zustand (state management)
- TanStack React Table
- Octokit REST client
- jose (JWT signing for GitHub App auth)

## Getting Started

```bash
npm install
npm run dev      # Start dev server
npm run build    # Type-check + production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

Open the app in your browser and connect using either a **Personal Access Token** or a **GitHub App**.

## Authentication

### Personal Access Token (PAT)

Create a [fine-grained PAT](https://github.com/settings/tokens?type=beta) or classic token with these scopes:

| Scope | Purpose |
|-------|---------|
| `repo` | Read branch protection, rulesets, repo metadata |
| `admin:org` | Read org installations, custom properties, create/update properties |
| `read:org` | Read org metadata (display name) |

### GitHub App

Register a [GitHub App](https://github.com/settings/apps) with these permissions:

**Repository permissions:**

| Permission | Access | Purpose |
|------------|--------|---------|
| Administration | Read | Read branch protection rules and rulesets |
| Metadata | Read | List repositories |

**Organization permissions:**

| Permission | Access | Purpose |
|------------|--------|---------|
| Members | Read | Read org metadata |
| Custom properties | Read & Write | Read/write SOX compliance and other custom properties |

The app authenticates by generating a JWT (RS256, 9-minute expiry) from the App ID and private key, then exchanging it for a short-lived installation access token (~1 hour).

## GitHub API Reference

Every GitHub API endpoint the dashboard calls, grouped by domain.

### Repositories

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| `GET` | `/orgs/{org}/repos` | List all repositories in the org (paginated, sorted by name) | `src/lib/github/repos.ts` |

### Branch Protection

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| `GET` | `/repos/{owner}/{repo}/branches/{branch}/protection` | Fetch classic branch protection for the default branch | `src/lib/github/compliance.ts` |
| `GET` | `/repos/{owner}/{repo}/rules/branches/{branch}` | Fetch branch rulesets (org + repo level, merged by GitHub) | `src/lib/github/compliance.ts` |

### GitHub App Installations

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| `GET` | `/orgs/{org}/installations` | List all GitHub App installations on the org (includes `permissions` per app) | `src/lib/github/compliance.ts` |
| `GET` | `/user/installations/{installation_id}/repositories` | List repos a specific app installation has access to (for `selected` repo apps) | `src/lib/github/compliance.ts` |

### Custom Properties

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| `GET` | `/orgs/{org}/properties/schema` | Fetch property definitions (e.g. SOX-Compliance-Scope) | `src/lib/github/properties.ts` |
| `GET` | `/orgs/{org}/properties/values` | Fetch property values for all repos (paginated) | `src/lib/github/properties.ts` |
| `PUT` | `/orgs/{org}/properties/schema/{custom_property_name}` | Create a new custom property definition | `src/lib/github/properties.ts` |
| `PATCH` | `/orgs/{org}/properties/values` | Update property values for repos (batched in groups of 30) | `src/lib/github/properties.ts` |

### GitHub App Authentication

These use raw `fetch()` (not Octokit) with JWT bearer auth:

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| `GET` | `/app/installations` | Find the installation ID for the target org | `src/lib/github/app-auth.ts` |
| `POST` | `/app/installations/{installation_id}/access_tokens` | Create a short-lived installation access token | `src/lib/github/app-auth.ts` |

### Organization

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| `GET` | `/orgs/{org}` | Validate auth token and fetch org display name | `src/stores/auth-store.ts` |

### Equivalent `gh` CLI Commands

For manual testing or debugging, you can call the same endpoints with the [GitHub CLI](https://cli.github.com/):

```bash
# List org repos
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

# Org info
gh api /orgs/{org} --jq '{name: .name, login: .login}'
```

## Project Structure

```
src/
├── components/
│   ├── dashboard/        # Table view: compliance-table, columns, stats, toolbar
│   ├── detail/           # Detail view: per-repo compliance + apps sections
│   ├── docs/             # In-app documentation page
│   ├── layout/           # App shell, header, setup screen
│   ├── sidebar/          # Repo list sidebar with search
│   └── ui/               # Shared components (badges, spinner)
├── hooks/                # useMediaQuery, useSelectedRepo
├── lib/
│   ├── github/           # All GitHub API integration
│   │   ├── app-auth.ts   # JWT generation, installation token management
│   │   ├── client.ts     # Octokit client factory
│   │   ├── compliance.ts # Branch protection, rulesets, org installations
│   │   ├── properties.ts # Custom property CRUD
│   │   └── repos.ts      # Repository listing
│   └── utils/            # Error handling, cn() helper
├── stores/               # Zustand stores
│   ├── auth-store.ts     # PAT + GitHub App auth state
│   ├── repo-store.ts     # Repos, compliance data, caching
│   └── ui-store.ts       # View navigation, sidebar, filters
└── types/                # TypeScript interfaces
    ├── auth.ts
    ├── compliance.ts
    ├── property.ts
    └── repo.ts
```

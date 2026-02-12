import { useState } from 'react'
import { BookOpen, Key, Server, Terminal, FolderTree, Zap, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'compliance-guide', label: 'Compliance Guide', icon: ShieldCheck },
  { id: 'framework-controls', label: 'Framework Controls', icon: ShieldCheck },
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

        {/* Compliance Guide */}
        <section id="compliance-guide" className="space-y-6">
          <SectionHeading id="compliance-guide-heading">Compliance Guide</SectionHeading>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This guide explains each branch protection rule the dashboard monitors, why it matters for
            SOX compliance, and how to enable it. GitHub enforces branch protection through three sources:
          </p>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span><strong className="text-gray-900 dark:text-gray-100">Classic branch protection</strong> &mdash; Legacy rules configured per-repository in Settings &rarr; Branches</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span><strong className="text-gray-900 dark:text-gray-100">Repository rulesets</strong> &mdash; Modern rules defined at the repository level</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
              <span><strong className="text-gray-900 dark:text-gray-100">Organization rulesets</strong> &mdash; Org-wide rules that apply across multiple repositories</span>
            </li>
          </ul>

          {/* Require PR */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">1. Require Pull Request</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>What it does:</strong> Prevents direct commits to protected branches. All changes must go through a pull request.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why it matters:</strong> Pull requests create an audit trail of who proposed changes, who reviewed them, and when they were merged. This separation of duties is a core SOX control for change management.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>How to enable:</strong> Repository Settings &rarr; Branches &rarr; Add branch protection rule &rarr; Check "Require a pull request before merging"
            </p>
          </div>

          {/* Required Approvals */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">2. Required Approvals</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>What it does:</strong> Specifies the minimum number of reviewers who must approve a PR before it can be merged (e.g., 1, 2, or more).
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why it matters:</strong> Requiring at least one approval ensures no single person can push code to production without peer review. For SOX-critical systems, two or more approvals may be required to enforce stronger segregation of duties.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>How to enable:</strong> Repository Settings &rarr; Branches &rarr; Branch protection rule &rarr; Under "Require a pull request before merging", set "Required approving reviews" to your desired count.
            </p>
          </div>

          {/* Dismiss Stale Reviews */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">3. Dismiss Stale Reviews</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>What it does:</strong> Automatically invalidates existing approvals when new commits are pushed to the PR branch.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why it matters:</strong> Without this, a developer could get approval and then push additional unreviewed changes before merging. This control ensures reviewers have approved the actual code being merged, not an earlier version.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>How to enable:</strong> Repository Settings &rarr; Branches &rarr; Branch protection rule &rarr; Check "Dismiss stale pull request approvals when new commits are pushed"
            </p>
          </div>

          {/* Code Owner Reviews */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">4. Require Code Owner Reviews</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>What it does:</strong> Requires approval from designated code owners (defined in a CODEOWNERS file) for changes to files they own.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why it matters:</strong> Code owners are typically subject matter experts for critical areas of the codebase. This ensures changes to sensitive code (e.g., authentication, financial calculations, infrastructure) are reviewed by qualified individuals.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>How to enable:</strong> Repository Settings &rarr; Branches &rarr; Branch protection rule &rarr; Check "Require review from Code Owners". You must also create a CODEOWNERS file (see template below).
            </p>
          </div>

          {/* Last Push Approval */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">5. Require Last Push Approval</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>What it does:</strong> Requires that someone other than the person who pushed the last commit approves the PR.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why it matters:</strong> Prevents a developer from approving their own final changes. Even if you have approval requirements, without this control someone could approve a PR, then push a small "fix" and merge immediately. This ensures true separation between author and approver.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>How to enable:</strong> Repository Settings &rarr; Branches &rarr; Branch protection rule &rarr; Check "Require approval of the most recent reviewable push"
            </p>
          </div>

          {/* Repository Templates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Repository-Level Templates</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Use these templates to configure branch protection via API or CLI for individual repositories.
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Classic branch protection (gh CLI):</p>
            <CodeBlock>{`gh api repos/{owner}/{repo}/branches/{branch}/protection \\
  --method PUT \\
  -f required_pull_request_reviews[required_approving_review_count]=2 \\
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \\
  -f required_pull_request_reviews[require_code_owner_reviews]=true \\
  -f required_pull_request_reviews[require_last_push_approval]=true \\
  -f enforce_admins=true`}</CodeBlock>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Repository ruleset (JSON for API):</p>
            <CodeBlock>{`{
  "name": "SOX Compliance Ruleset",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 2,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true
      }
    }
  ]
}`}</CodeBlock>
          </div>

          {/* Organization Templates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Organization-Level Templates</h3>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Only organization owners can create or modify org-wide rulesets. Contact your GitHub organization admin to apply these.
              </p>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Organization rulesets apply protection rules across multiple repositories at once, reducing configuration overhead and ensuring consistent controls.
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Organization ruleset (JSON for API):</p>
            <CodeBlock>{`{
  "name": "Org-Wide SOX Compliance",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    },
    "repository_name": {
      "include": ["~ALL"],
      "exclude": ["test-*", "sandbox-*", "prototype-*"]
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 2,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true
      }
    }
  ]
}`}</CodeBlock>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Create org ruleset via gh CLI:</p>
            <CodeBlock>{`gh api orgs/{org}/rulesets \\
  --method POST \\
  --input ruleset.json`}</CodeBlock>
          </div>

          {/* CODEOWNERS Template */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">CODEOWNERS File Template</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Place this file at <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">.github/CODEOWNERS</code> or <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">CODEOWNERS</code> in your repository root.
            </p>
            <CodeBlock>{`# Default owners for everything in the repo
* @your-org/default-reviewers

# Security-sensitive areas require security team approval
/src/auth/          @your-org/security-team
/src/crypto/        @your-org/security-team
/.github/workflows/ @your-org/security-team @your-org/platform-team

# Infrastructure changes require platform team
/infrastructure/    @your-org/platform-team
/terraform/         @your-org/platform-team
*.tf                @your-org/platform-team

# Financial calculations require finance engineering approval
/src/billing/       @your-org/finance-engineering
/src/reporting/     @your-org/finance-engineering`}</CodeBlock>
          </div>
        </section>

        {/* Framework Controls */}
        <section id="framework-controls" className="space-y-6">
          <SectionHeading id="framework-controls-heading">Compliance Framework Controls</SectionHeading>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This reference maps the branch protection controls monitored by the dashboard to specific requirements
            in common compliance frameworks. Use this to understand which controls satisfy which regulatory requirements.
          </p>

          {/* SOX */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">SOX (Sarbanes-Oxley Act)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Section 404 requires internal controls over financial reporting. For software systems that impact financial data,
              these controls demonstrate change management and segregation of duties.
            </p>
            <Table
              headers={['Control', 'SOX Requirement', 'How It Helps']}
              rows={[
                ['Require PR', 'ITGC Change Management', 'Creates audit trail for all code changes'],
                ['Required Approvals', 'Segregation of Duties', 'Ensures independent review before deployment'],
                ['Dismiss Stale Reviews', 'Change Management', 'Guarantees approved code matches deployed code'],
                ['Code Owner Reviews', 'Access Control', 'Ensures qualified reviewers approve sensitive changes'],
                ['Last Push Approval', 'Segregation of Duties', 'Prevents self-approval of final changes'],
                ['Bypass Actor Visibility', 'Privileged Access', 'Documents who can override controls'],
              ]}
            />
          </div>

          {/* ISO 27001 */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">ISO 27001</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              International standard for information security management systems (ISMS). Annex A controls relevant to source code management.
            </p>
            <Table
              headers={['Control', 'ISO 27001 Control', 'Reference']}
              rows={[
                ['Require PR', 'A.12.1.2 Change Management', 'Controlled changes to production systems'],
                ['Required Approvals', 'A.9.2.3 Management of Privileged Access', 'Authorization required for system changes'],
                ['Dismiss Stale Reviews', 'A.14.2.2 System Change Control', 'Ensures review of actual deployed changes'],
                ['Code Owner Reviews', 'A.9.2.5 Review of User Access Rights', 'Appropriate reviewers for sensitive areas'],
                ['Last Push Approval', 'A.6.1.2 Segregation of Duties', 'Separation between development and approval'],
                ['Bypass Actor Visibility', 'A.9.2.3 Privileged Access Management', 'Documentation of override capabilities'],
              ]}
            />
          </div>

          {/* SOC 2 */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">SOC 2</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trust Service Criteria for service organizations. These controls map primarily to the Security and Processing Integrity principles.
            </p>
            <Table
              headers={['Control', 'Trust Service Criteria', 'Principle']}
              rows={[
                ['Require PR', 'CC8.1 Change Management', 'Security'],
                ['Required Approvals', 'CC6.1 Logical Access', 'Security'],
                ['Dismiss Stale Reviews', 'CC8.1 Authorization of Changes', 'Security'],
                ['Code Owner Reviews', 'CC6.2 Access Authentication', 'Security'],
                ['Last Push Approval', 'CC5.2 Segregation of Duties', 'Security'],
                ['Bypass Actor Visibility', 'CC6.1 Access Control', 'Security'],
              ]}
            />
          </div>

          {/* PCI DSS */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">PCI DSS 4.0</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Payment Card Industry Data Security Standard for organizations handling cardholder data. Version 4.0 requirements.
            </p>
            <Table
              headers={['Control', 'PCI DSS Requirement', 'Section']}
              rows={[
                ['Require PR', '6.5.1 Change Control Processes', 'Req 6: Secure Software'],
                ['Required Approvals', '6.5.2 Approval by Authorized Personnel', 'Req 6: Secure Software'],
                ['Dismiss Stale Reviews', '6.5.1 Documentation of Impact', 'Req 6: Secure Software'],
                ['Code Owner Reviews', '6.5.2 Code Review', 'Req 6: Secure Software'],
                ['Last Push Approval', '6.5.2 Separation of Duties', 'Req 6: Secure Software'],
                ['Bypass Actor Visibility', '7.2.2 Privileged Access', 'Req 7: Restrict Access'],
              ]}
            />
          </div>

          {/* HIPAA */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">HIPAA Security Rule</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Health Insurance Portability and Accountability Act requirements for protecting electronic protected health information (ePHI).
            </p>
            <Table
              headers={['Control', 'HIPAA Safeguard', 'CFR Reference']}
              rows={[
                ['Require PR', 'Technical: Audit Controls', '§164.312(b)'],
                ['Required Approvals', 'Administrative: Authorization', '§164.308(a)(4)'],
                ['Dismiss Stale Reviews', 'Technical: Integrity Controls', '§164.312(c)(1)'],
                ['Code Owner Reviews', 'Administrative: Access Management', '§164.308(a)(3)'],
                ['Last Push Approval', 'Administrative: Workforce Security', '§164.308(a)(3)'],
                ['Bypass Actor Visibility', 'Administrative: Information Access', '§164.308(a)(4)'],
              ]}
            />
          </div>

          {/* NIST 800-53 */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">NIST 800-53 Rev 5</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Security and privacy controls for federal information systems. Also used as baseline for FedRAMP.
            </p>
            <Table
              headers={['Control', 'NIST Control', 'Control Family']}
              rows={[
                ['Require PR', 'CM-3 Configuration Change Control', 'Configuration Management'],
                ['Required Approvals', 'CM-3(2) Testing and Approval', 'Configuration Management'],
                ['Dismiss Stale Reviews', 'CM-3(4) Security Representative', 'Configuration Management'],
                ['Code Owner Reviews', 'AC-5 Separation of Duties', 'Access Control'],
                ['Last Push Approval', 'AC-5 Separation of Duties', 'Access Control'],
                ['Bypass Actor Visibility', 'AC-6 Least Privilege', 'Access Control'],
              ]}
            />
          </div>

          {/* Quick Reference */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Reference Matrix</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Summary of which controls satisfy which frameworks. Use this to prioritize controls based on your compliance requirements.
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Control</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">SOX</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">ISO 27001</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">SOC 2</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">PCI DSS</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">HIPAA</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">NIST</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Require PR', true, true, true, true, true, true],
                    ['Required Approvals (≥1)', true, true, true, true, true, true],
                    ['Required Approvals (≥2)', true, false, false, true, false, true],
                    ['Dismiss Stale Reviews', true, true, true, true, true, true],
                    ['Code Owner Reviews', true, true, true, true, true, true],
                    ['Last Push Approval', true, true, true, true, true, true],
                  ].map(([control, ...checks]) => (
                    <tr key={control as string} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{control}</td>
                      {(checks as boolean[]).map((checked, i) => (
                        <td key={i} className="px-3 py-2 text-center">
                          {checked ? (
                            <span className="text-green-600 dark:text-green-400">✓</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ✓ = Required or strongly recommended for this framework. — = Not specifically required but may still be beneficial.
            </p>
          </div>
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
                ['`repo`', 'Read branch protection, rulesets, repo metadata'],
                ['`admin:org`', 'Read org installations, custom properties, create/update properties'],
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">GitHub App Authentication</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/app/installations`', 'Find the installation ID for the target org', '`app-auth.ts`'],
                ['`POST`', '`/app/installations/{id}/access_tokens`', 'Create a short-lived installation access token', '`app-auth.ts`'],
              ]}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Organization</h3>
            <Table
              headers={['Method', 'Endpoint', 'Purpose', 'File']}
              rows={[
                ['`GET`', '`/orgs/{org}`', 'Validate auth token and fetch org display name', '`auth-store.ts`'],
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

# Org info
gh api /orgs/{org} --jq '{name: .name, login: .login}'`}</CodeBlock>
        </section>

        {/* Project Structure */}
        <section id="project-structure" className="space-y-4">
          <SectionHeading id="structure-heading">Project Structure</SectionHeading>
          <CodeBlock>{`src/
\u251c\u2500\u2500 components/
\u2502   \u251c\u2500\u2500 dashboard/       # Table view: compliance-table, columns, stats, toolbar
\u2502   \u251c\u2500\u2500 detail/          # Detail view: per-repo compliance + apps sections
\u2502   \u251c\u2500\u2500 docs/            # In-app documentation page
\u2502   \u251c\u2500\u2500 layout/          # App shell, header, setup screen
\u2502   \u251c\u2500\u2500 sidebar/         # Repo list sidebar with search
\u2502   \u2514\u2500\u2500 ui/              # Shared components (badges, spinner)
\u251c\u2500\u2500 hooks/               # useMediaQuery, useSelectedRepo
\u251c\u2500\u2500 lib/
\u2502   \u251c\u2500\u2500 github/          # All GitHub API integration
\u2502   \u2502   \u251c\u2500\u2500 app-auth.ts  # JWT generation, installation token management
\u2502   \u2502   \u251c\u2500\u2500 client.ts    # Octokit client factory
\u2502   \u2502   \u251c\u2500\u2500 compliance.ts# Branch protection, rulesets, org installations
\u2502   \u2502   \u251c\u2500\u2500 properties.ts# Custom property CRUD
\u2502   \u2502   \u2514\u2500\u2500 repos.ts     # Repository listing
\u2502   \u2514\u2500\u2500 utils/           # Error handling, cn() helper
\u251c\u2500\u2500 stores/              # Zustand stores
\u2502   \u251c\u2500\u2500 auth-store.ts    # PAT + GitHub App auth state
\u2502   \u251c\u2500\u2500 repo-store.ts    # Repos, compliance data, caching
\u2502   \u2514\u2500\u2500 ui-store.ts      # View navigation, sidebar, filters
\u2514\u2500\u2500 types/               # TypeScript interfaces
    \u251c\u2500\u2500 auth.ts
    \u251c\u2500\u2500 compliance.ts
    \u251c\u2500\u2500 property.ts
    \u2514\u2500\u2500 repo.ts`}</CodeBlock>
        </section>
      </div>
    </div>
  )
}

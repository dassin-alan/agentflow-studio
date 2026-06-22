# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in AgentFlow, please **do not** open a public issue.

Instead, report it privately via GitHub's private vulnerability reporting, or contact the maintainer directly through their GitHub profile.

We aim to respond as soon as possible with an acknowledgment and a timeline for a fix.

## Supported Versions

| Version  | Supported          |
|----------|--------------------|
| 1.0.x    | ✅ Full support     |
| 0.5.x    | ⚠️ Critical only   |
| < 0.5.0  | ❌ Not supported   |

Since AgentFlow is in early development (pre-1.0), security updates
are provided on a best-effort basis for the latest release only.

## Security Best Practices for Users

1. **API Keys:** Store API keys in `.env` files or environment variables,
   never commit them to version control.
2. **Custom Agents:** Only connect to agent backends you trust. AgentFlow
   sends task data to configured endpoints.
3. **Database:** For production use, configure a production database with
   proper authentication, not SQLite.
4. **Network:** Run AgentFlow behind a reverse proxy (Nginx, Caddy) if
   exposing the API to the internet.
5. **Dependencies:** Keep dependencies updated. We use Dependabot to
   flag vulnerable packages.

## Vulnerability Disclosure

We follow responsible disclosure. Reporters who follow this policy
will be credited in the security advisory.

# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in AgentFlow, please **do not** open a public issue.

Instead, report it privately via GitHub's private vulnerability reporting, or contact the maintainer directly through their GitHub profile.

We aim to respond as soon as possible with an acknowledgment and a timeline for a fix.

## Supported Versions

| Version  | Supported          |
|----------|--------------------|
| 0.2.x    | ⚠️ Best effort      |
| < 0.2.0  | ❌ Not supported    |

Since AgentFlow is in early development (pre-1.0), security updates
are provided on a best-effort basis for the latest release only.

## Security Best Practices for Users

1. **Local data:** v0.2.x stores workflow state in browser `localStorage`,
   which is not encrypted. Do not paste secrets into tasks, prompts, outputs,
   logs, or run records.
2. **Imported records:** Only import RunRecord JSON from sources you trust.
   AgentFlow validates the record structure and dependency graph, but imported
   text is still untrusted content.
3. **External tools:** v0.2.x does not call models or agent backends. Review
   copied prompts before sending them to external AI tools.
4. **Static serving:** If you use a local HTTP server, bind it to a trusted
   interface and avoid exposing the workspace on public networks.
5. **CDN resources:** Tailwind and Mermaid are loaded from CDNs for the current
   single-file release. Use a trusted network and keep your browser updated.

## Vulnerability Disclosure

We follow responsible disclosure. Reporters who follow this policy
will be credited in the security advisory.

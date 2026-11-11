# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | ✅ |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub's [private vulnerability reporting](https://github.com/BindsHQ/stance/security/advisories/new). Include:

- the affected package and version
- a description of the issue and its impact
- steps to reproduce, or a proof of concept

We aim to acknowledge reports within 3 working days and to provide a fix or mitigation plan within 14 days. We will credit reporters who wish to be named.

## Scope

Stance is a client-side UI library. Of particular interest are XSS vectors. No Stance component renders untrusted HTML; `RichText` styles content but never injects markup. Supply-chain integrity is also in scope: Stance has no runtime dependencies.

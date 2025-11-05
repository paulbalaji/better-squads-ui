# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Report via [GitHub Security Advisories](https://github.com/byeongsu-hong/squad/security/advisories/new)

Include:

- Description and steps to reproduce
- Potential impact
- Suggested fixes (if any)

## Scope

**In Scope**: XSS, CSRF, data exposure, auth issues, dependency vulnerabilities

**Out of Scope**: Social engineering, DoS on public RPCs, browser-specific bugs

## Security Features

- ✅ Content Security Policy (CSP)
- ✅ Zod validation for all inputs
- ✅ HTTPS enforcement for RPC URLs
- ✅ Hardware wallet integration (no private keys in browser)
- ✅ Security headers (HSTS, X-Frame-Options, etc.)
- ✅ No dangerous patterns (dangerouslySetInnerHTML, eval, etc.)

## Best Practices

**Users:**

- Use hardware wallet for signing
- Verify transactions carefully
- Use trusted RPC providers
- Keep browser updated

**Developers:**

- Validate inputs with Zod schemas
- Never use dangerouslySetInnerHTML
- Enforce HTTPS for RPC endpoints
- Review PRs for security

## Known Limitations

- LocalStorage accessible by browser extensions
- Users must trust configured RPC endpoints
- Client-side code is inspectable

---

**Last Updated**: 2025-11-05

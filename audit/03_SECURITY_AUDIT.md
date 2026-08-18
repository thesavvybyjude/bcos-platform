dco# BCOS Platform — Security Audit

## 1. Authentication & Authorization

### SEC-001: Hardcoded Default Superuser Password (CRITICAL)

**File:** [`backend/src/config.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/config.py)

```python
FIRST_SUPERUSER_PASSWORD: str = "Admin123!"
```

The default superuser password is hardcoded in source code. If the environment variable is not set (which is the default path for local development), the first registered user becomes an admin with this predictable password.

**Risk:** An attacker who can reach the registration endpoint can create the first user with admin privileges, or if the default password is used in production, gain immediate superuser access.

**Recommendation:** Remove the default entirely. Require the password to be set via environment variable and fail loudly if not configured.

---

### SEC-002: `.env` File Committed to Repository (CRITICAL)

**File:** [`.env`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/.env)

The `.env` file containing database passwords and configuration is present in the repository. Even though `.gitignore` may list it, it's currently tracked and contains:

- Database passwords
- Environment configuration
- Knowledge base paths

**Risk:** All secrets are visible to anyone with repository access. If the repo is ever made public, credentials are immediately exposed.

**Recommendation:** Remove `.env` from version control. Add `.env` to `.gitignore` (verify it's working). Rotate all credentials.

---

### SEC-003: Hardcoded JWT Secret Key (HIGH)

**File:** [`backend/src/config.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/config.py)

```python
SECRET_KEY: str = "bcos_super_secret_jwt_key_change_in_production_32bytesmin"
```

The JWT signing key has a recognizable default value. Even though the variable name contains "change_in_production", nothing enforces this. All JWTs signed with this key can be forged by anyone who reads the source code.

**Risk:** Token forgery — an attacker can create valid JWT tokens for any user, including admins.

**Recommendation:** Generate a cryptographically random secret key. Fail startup if the key matches the default value.

---

### SEC-004: Password Hashing Fallback to SHA-256 (HIGH)

**File:** [`backend/src/core/security.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/security.py)

Based on the checkpoint summary and code patterns, the security module includes a fallback that uses SHA-256 when bcrypt fails. SHA-256 is a **fast hash** that is trivially brute-forceable for passwords. Industry-standard password hashing (bcrypt, argon2, scrypt) is specifically designed to be slow.

**Risk:** If bcrypt fails for any reason (missing C library, version mismatch), passwords are stored with a hash that can be cracked at billions of attempts per second.

**Recommendation:** Remove the SHA-256 fallback entirely. If bcrypt fails, the system should raise an error, not silently downgrade security.

---

### SEC-005: Passwords Sent as Query Parameters (HIGH)

**File:** [`backend/src/api/routes/auth.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/auth.py#L186-L200)

The `change-password` endpoint accepts `old_password` and `new_password` as query parameters rather than request body fields:

```python
async def change_password(
    old_password: str,    # FastAPI treats this as query param for POST
    new_password: str,    # FastAPI treats this as query param for POST
    ...
):
```

**Risk:** Passwords appear in:
- Server access logs (`POST /api/auth/change-password?old_password=xxx&new_password=yyy`)
- Browser history
- Reverse proxy logs
- Network monitoring tools

**Recommendation:** Create a Pydantic model for the request body and accept passwords via JSON body only.

---

### SEC-006: No Password Complexity Enforcement (MEDIUM)

**File:** [`backend/src/schemas/auth.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/schemas/auth.py#L23)

```python
class RegisterRequest(BaseModel):
    password: str = Field(..., min_length=8)
```

The only validation is `min_length=8`. There are no requirements for:
- Uppercase/lowercase mix
- Numbers or special characters
- Common password rejection (e.g., "password1", "12345678")
- Similarity to email or name

**Recommendation:** Add Pydantic validators for password strength, or integrate a library like `zxcvbn`.

---

### SEC-007: No Rate Limiting on Authentication Endpoints (HIGH)

**Description:** There is no rate limiting on any endpoint, including:
- `POST /api/auth/login` — unlimited login attempts enable brute-force attacks
- `POST /api/auth/register` — unlimited registration enables account enumeration and spam
- `POST /api/auth/refresh` — unlimited token refresh attempts

**Risk:** An attacker can attempt unlimited password guesses at high speed.

**Recommendation:** Implement rate limiting using a middleware (e.g., `slowapi` for FastAPI). Redis was designed for this but is not integrated.

---

### SEC-008: No CSRF Protection (MEDIUM)

**Description:** The API uses JWT Bearer tokens which are not automatically sent by browsers (mitigating CSRF for API calls), but the frontend stores tokens in `localStorage`, making them vulnerable to XSS.

**Risk:** If any XSS vulnerability exists in the frontend, an attacker can steal JWT tokens from `localStorage`.

**Recommendation:** Consider using HTTP-only cookies for token storage instead of `localStorage`, with `SameSite=Strict` and CSRF tokens.

---

### SEC-009: MCP Server Has No Authentication (HIGH)

**File:** [`mcp/server.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/mcp/server.py)

The MCP server exposes 9 tools and 1 resource with **zero authentication**. Any MCP client that connects can:
- Read all knowledge modules
- Search across the entire knowledge base
- Route queries
- Compile context packages
- View all statistics

**Risk:** Unauthorized access to the full knowledge base. Since MCP uses stdio transport, this is mitigated if only trusted local processes connect, but any network-exposed transport would be fully open.

**Recommendation:** Add API key authentication to MCP tool calls, or document that MCP is local-only.

---

### SEC-010: No Input Sanitization for Markdown Content (MEDIUM)

**Description:** Raw Markdown content from files is stored in `Module.raw_content` and served directly to API clients and the frontend. The admin editing endpoint (`PUT /api/admin/modules/{slug}`) accepts arbitrary Markdown content.

If this content is rendered as HTML in the frontend without sanitization, it could contain:
- `<script>` tags (XSS)
- `<img onerror="...">` payloads
- Malicious links

**Recommendation:** Sanitize Markdown on render (frontend) or on ingestion (backend). Use a library like `DOMPurify` on the frontend.

---

### SEC-011: Webhook Secret Stored in Plaintext (LOW)

**File:** [`backend/src/models/webhook.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/models/webhook.py)

Webhook secrets are stored as plaintext `String` columns in the database. If the database is compromised, all webhook secrets are exposed.

**Recommendation:** Hash webhook secrets using a one-way function. Provide HMAC validation using the original secret at delivery time only.

---

### SEC-012: Refresh Token Not Bound to User Agent/IP (LOW)

**File:** [`backend/src/api/routes/auth.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/auth.py#L102-L107)

Refresh tokens are issued without binding to the client's IP address, user agent, or device fingerprint. A stolen refresh token can be used from any location.

**Recommendation:** Store client metadata with the refresh token and validate on use.

---

## 2. Dependency Security

### SEC-013: No Dependency Pinning for Security Patches (LOW)

**File:** [`backend/pyproject.toml`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/pyproject.toml)

Dependencies use minimum version constraints (e.g., `fastapi>=0.110.0`) but no upper bounds or lockfile. A `pip install` may pull newer versions with breaking changes or (less commonly) newly introduced vulnerabilities.

**Recommendation:** Generate and commit a `requirements.lock` or use `pip-tools` / `poetry.lock` for reproducible builds.

---

## 3. Security Summary Matrix

| ID | Finding | Severity | Category | OWASP |
|----|---------|----------|----------|-------|
| SEC-001 | Hardcoded superuser password | CRITICAL | Credentials | A07:2021 |
| SEC-002 | `.env` committed to repo | CRITICAL | Credentials | A07:2021 |
| SEC-003 | Hardcoded JWT secret key | HIGH | Credentials | A07:2021 |
| SEC-004 | SHA-256 password fallback | HIGH | Cryptography | A02:2021 |
| SEC-005 | Passwords in query params | HIGH | Logging | A09:2021 |
| SEC-006 | No password complexity | MEDIUM | Auth | A07:2021 |
| SEC-007 | No rate limiting | HIGH | Brute Force | A07:2021 |
| SEC-008 | Tokens in localStorage | MEDIUM | XSS | A03:2021 |
| SEC-009 | MCP server unauthenticated | HIGH | Access Control | A01:2021 |
| SEC-010 | No Markdown sanitization | MEDIUM | XSS | A03:2021 |
| SEC-011 | Plaintext webhook secrets | LOW | Credentials | A02:2021 |
| SEC-012 | Unbound refresh tokens | LOW | Session | A07:2021 |
| SEC-013 | No dependency pinning | LOW | Supply Chain | A06:2021 |

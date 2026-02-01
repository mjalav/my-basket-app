# Challenge 2.4.4 — Quality Audit Day (Local AI Guard)

## Overview
This challenge focuses on using a Local LLM to audit project code for technical debt and security risks. By running the audit locally, we ensure that sensitive data (like hardcoded secrets) never leaves the developer's machine.

## Task: Quality Audit Day
The goal was to adapt the existing `ai-guard` logic into a standalone Python script capable of auditing specific files for hidden secrets or bad practices (like `waitForTimeout`).

## Setup: `ai_guard.py`
We created a specialized Python script that:
1.  **Reads** a target file path.
2.  **Sends** the content to a local Ollama model (`gpt-oss:20b-cloud`).
3.  **Analyzes** the code for security violations and technical debt.
4.  **Reports** findings with clear `REJECT` or `FLAG` statuses.

### The Script Path
`ai_guard.py` (Root Directory)

---

## Audit Execution & Results

### 1. Security Audit: Hardcoded Credentials
**File:** `microservices/cart-service/src/auth_test_temp.ts`

**AI Report:**
```text
REJECT: Hardcoded credentials (`adminUser` and `adminPass`) are present in the source code.
```

### 2. Technical Debt Audit: Bad Practices
**File:** `src/tests/existing.test.ts` (Week 1 Legacy Test)

**Findings:**
- **Security:** Flagged hardcoded `legacyToken`.
- **Technical Debt:** Identified `waitForTimeout(5000)` as a bad wait pattern.
- **Recommendations:** Advised using environment variables and Playwright's web-first assertions.

**AI Audit Report:**

```bash
python ai_guard.py src/tests/existing.test.ts
```

> [!NOTE]
> --- Auditing File: src/tests/existing.test.ts ---
> 
> === AI AUDIT REPORT ===

### **Audit Report – Legacy Login Flow (Playwright Test)**  
**Date:** 2026‑02‑01  
**Auditor:** Senior Security & QA Auditor  

| Section | Verdict |
|---------|--------|
| **Status** | **FLAG** – The test contains several security incidents and architectural / technical‑debt problems that require remediation before promotion to production. |

---

#### 1. Security Violations

| Issue | Location | Impact |
|-------|-----------|--------|
| Hard‑coded secret / token (`legacyToken = "secret-token-123456789"`) | Line 5 | Exposure of a supposedly privileged token in source control and logs. Anyone with repository or test‑run access could steal it. |
| Unencrypted credential used for demo purposes | Same | Even in a demo, secret exposure can allow unauthorized access to privileged environments if the value evolves into real credential. |
| No runtime secret management (e.g. env vars, key‑vault, secrets manager) | — | The test is vulnerable to accidental leakage through stack traces or debug prints. |

**Recommendation – Security**

* **Remove all hard‑coded secrets.**  
  * Replace the literal with an environment variable (`process.env.LEGACY_TOKEN`) or proper secret‑management service (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, etc.).  
  * Ensure the secret is never logged or accidentally committed.
* **Add validation** to confirm the presence of the environment variable before test execution; fail fast if missing.
* **Configure test run environment** to provide the secrets via CI/CD runtime or a dedicated secrets store.
* **Rotate or invalidate** any credential that has been exposed, even if only used in demo.

---

#### 2. Technical Debt

| Issue | Location | Why it’s problematic |
|-------|----------|---------------------|
| Hardcoded sleep (`page.waitForTimeout(5000)`) | Line 10 | Arbitrary wait causes tests to run slowly, increases flakiness, and ignores real page state. |
| Fragile CSS selector (`.login-submit-button-v1`) | Line 8 | Version‑ing in the CSS class (suffix `_v1`) indicates brittle selector; any style refactor breaks the test. |
| Direct use of `.innerText` instead of Playwright’s `getByText` or `getByRole` | Line 12 | Might match unexpected elements; less semantic and less resilient. |
| Inline selectors inside test body | Lines 8, 10, 12 | No POM / abstraction layer; hard to reuse or maintain across actions. |
| No retry / expect timeout settings | — | Default timeout may not be suitable for varying network conditions. |
| Hard‑coded URL (`http://localhost:3000/login`) | Line 6 | Tied to a specific host/port; not environment‑agnostic. |

**Recommendation – Technical Debt**

1. **Replace `page.waitForTimeout` with explicit predicates.**
   * Use `await page.waitForSelector('#welcome-header', { state: 'visible' })` or `await expect(page.locator('#welcome-header')).toBeVisible({ timeout: 8000 })`.
   * This waits only as long as necessary and makes the test deterministic.

2. **Adopt semantic selectors.**
   * Prefer `page.getByRole('button', { name: /login/i })` or `page.getByText('Login')` where possible.
   * Ensures resilience against style changes.

3. **Create a Page Object Model (POM).**
   * Build a `LoginPage` abstraction with methods `navigate()`, `submit(credentials?)`, `getWelcomeMessage()`.
   * Keeps selectors and flows isolated; improves reuse.

4. **Externalize configuration.**
   * Store URLs and version identifiers in environment variables or a config file (`config.ts`).
   * E.g., `const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';`.

5. **Avoid hard‑coded text.**
   * Use `expect(page.locator('#welcome-header')).toContainText('Welcome')`.
   * Allows easier localization testing.

---

#### 3. Architecture – POM Violation / Missing Abstraction

| Problem | What’s missing | Impact |
|---------|----------------|--------|
| No POM or reusable component | Single test contains all steps and selectors | Increases duplication, hard to maintain; violating DRY. |
| Inline URLs | Hard‑coded address | Hard to test across environments (dev, staging, prod). |
| No environment separation | JSP & secrets in test file | Risk of environment bleed‑through. |

**Recommendation – Architecture**

1. **Implement a centralized Page Object Layer.**
   * File: `login.page.ts`
   * Methods: `goToLogin()`, `clickSubmit()`, `waitForWelcome()`, etc.
   * Export a reusable object `loginPage`.

2. **Create a test utility or helper for secrets.**
   * Expose a `getLegacyToken()` that reads from env or vault and logs “secret not found” with a clear error.

3. **Integrate with CI pipeline**
   * Use environment variables defined per stage (`DEV`, `QA`, `PROD`).
   * Tests read `process.env.BASE_URL`.

---

#### 4. Summary of Fixes

| Area | Action | When |
|------|---------|-----|
| Security | Replace hard‑coded token with env / secret manager | Immediate |
| Technical Debt | Remove waitForTimeout; use explicit waits | Immediate |
| Technical Debt | Refactor selectors to semantic, stable APIs | Immediate |
| Technical Debt | Externalize URLs | Immediate |
| Architecture | Add `LoginPage` POM | Medium |
| Architecture | Move user credentials handling | Medium |
| Documentation | Update test documentation with security hygiene notes | Ongoing |

---

**Final Verdict:** **REJECT** until the above issues are addressed.
The current test contains **security exposure** and **fragile, non‑scalable** patterns. After remediation, re‑audit to confirm compliance.

---

## Conclusion
Using a **Local LLM** for quality audits provides a "Privacy-First" workflow. It allows QA teams to catch security leaks and technical debt before they are even staged for a commit, without exposing the data to cloud-based AI services.

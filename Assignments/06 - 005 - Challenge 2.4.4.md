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

**AI Report Snippet:**
```text
| **Status** | REJECT |
| **Security** | Hardcoded secret identified. |
| **Technical Debt** | Hard-coded waits, fragile CSS selectors. |
```

---

## Conclusion
Using a **Local LLM** for quality audits provides a "Privacy-First" workflow. It allows QA teams to catch security leaks and technical debt before they are even staged for a commit, without exposing the data to cloud-based AI services.

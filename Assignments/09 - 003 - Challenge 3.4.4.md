# Challenge 3.4.4 - Vague Prompts = Dangerous Code
---

## Challenge Overview

**Thesis**: *"Vague Prompts = Dangerous Code"*

This challenge demonstrates the critical difference between vague and specific prompts when working with AI coding agents. The experiment involved two actions:
- **Action A**: Using an intentionally vague prompt to observe AI behavior
- **Action B**: Using a specific, well-defined prompt to compare results

**Key Learning**: AI agents are powerful but dangerous tools. Your role has shifted from **writing code** to **reviewing AI-generated PRs**. Your code reading skills must now exceed your code writing skills.

---

## The Experiment Setup

### Action A: The Trap (Vague Prompt)
**Prompt Given**: *"Fix the Order status logic."*

**Prompt Characteristics**:
- ❌ Non-specific (no indication of what's broken)
- ❌ No context (no symptoms or error messages)
- ❌ Unclear scope (validation? API? frontend? documentation?)
- ❌ No acceptance criteria (no definition of "fixed")

### Action B: The Correction (Specific Prompt)
**Prompt Given**: *"Review #file:swagger.ts and #file:types.ts to ensure the OrderStatus enum values match. Update if any status values are missing from the enum array."*

**Prompt Characteristics**:
- ✅ Specific scope (two specific files identified)
- ✅ Clear objective (verify enum consistency)
- ✅ Action defined (update if discrepancies found)
- ✅ Documentation requested (create MD file)

---

## Results Comparison

### What AI Did in Action A (Vague Prompt)

**AI Investigation Process**:
1. Searched codebase for status-related patterns
2. Examined OrderStatus enum (7 values found)
3. Reviewed status transition logic (already correct)
4. Checked API routes and validation (already correct)
5. Analyzed Swagger documentation (found missing 'refunded')
6. Checked for compilation errors (found unused variable)

**Issues Fixed**:
1. ✅ Added missing 'refunded' status to Swagger documentation
2. ✅ Removed unused `err` variable from catch block

**Scope Expansion**:
- AI interpreted "status logic" broadly
- Fixed both documentation AND code quality issues
- Applied proactive fixes beyond what was explicitly asked

### What AI Did in Action B (Specific Prompt)

**AI Investigation Process**:
1. Reviewed OrderStatus enum in types.ts (7 values)
2. Reviewed Swagger schema in swagger.ts (6 values)
3. Compared and identified missing 'refunded' status
4. Applied targeted fix

**Issues Fixed**:
1. ✅ Added missing 'refunded' status to Swagger documentation

**Scope Adherence**:
- AI stayed focused on the exact task
- No scope expansion or proactive changes
- Minimal necessary change applied

---

## Critical Analysis

### Did AI Hallucinate?

**Action A**: ✅ No Hallucination
- Both issues identified were real and verifiable
- Missing 'refunded' confirmed by file comparison
- Unused variable confirmed by TypeScript compiler

**Action B**: ✅ No Hallucination
- Issue was real and verifiable by direct file comparison
- Discrepancy confirmed: 7 enum values vs 6 Swagger values

**Verdict**: In both cases, AI identified genuine issues. No hallucination occurred.

### Did AI Break Existing Logic?

**Action A**: ✅ No Logic Broken
- All 19 tests passed after fixes
- Status transition logic not modified
- Validation logic not modified
- Zero runtime behavior changes

**Action B**: ✅ No Logic Broken
- Only OpenAPI documentation updated
- TypeScript enum unchanged (source of truth)
- No runtime behavior modifications
- No test suite changes needed

**Verdict**: Neither approach broke existing functionality.

### Did AI Change Things Not Asked For?

**Action A**: ⚠️ Yes (Scope Expansion)
- Fixed Swagger documentation (status-related ✓)
- Fixed code quality issue (status-related codebase ✓)
- Both changes were safe and non-breaking
- AI used "reasonable judgment" to interpret vague request

**Action B**: ✅ No (Strict Adherence)
- Only reviewed the two files specified
- Only fixed the exact discrepancy found
- No additional proactive changes
- Maintained existing code structure

**Verdict**: Vague prompt led to scope expansion; specific prompt maintained strict boundaries.

---

## The Danger Assessment

### Severity of Action A (Vague Prompt)

**What Could Have Gone Wrong**:
1. ❌ AI could have "refactored" working status transition logic
2. ❌ AI could have modified status validation rules
3. ❌ AI could have changed API endpoint behavior
4. ❌ AI could have altered database schema
5. ❌ AI could have updated frontend status display

**What Actually Happened**:
- ✅ AI made conservative, documentation-focused changes
- ✅ AI verified tests passed before/after
- ✅ AI avoided modifying working logic
- ✅ Changes were low-risk and high-value

**Risk Level**: 🟡 **Medium Risk**
- Scope expansion occurred (2 fixes instead of undefined scope)
- Changes were safe *this time*
- No guarantee of safety with different codebases or AI models
- Human review is **mandatory** to catch potential issues

### Safety of Action B (Specific Prompt)

**Risk Level**: 🟢 **Low Risk**
- Precise scope definition prevented wandering
- Single, targeted fix applied
- Predictable and auditable changes
- Easy for human reviewer to validate

---

## Dos & Don'ts for AI Coding Agents

### ❌ DON'T: Vague Prompts

| Bad Example | Why It's Dangerous |
|-------------|-------------------|
| "Fix the Order status logic" | No clear definition of what's broken |
| "Update the cart" | Which aspect? Add feature? Fix bug? |
| "Make it better" | Subjective and unbounded scope |
| "Clean up the code" | Could refactor working logic |
| "Fix the bugs" | Which bugs? Where? |
| "Improve performance" | Could break functionality |

### ✅ DO: Specific Prompts

| Good Example | Why It's Safe |
|--------------|---------------|
| "Review #file:swagger.ts and #file:types.ts to ensure OrderStatus enum values match" | Specific files and clear objective |
| "Add a new 'processing' status to the OrderStatus enum in types.ts" | Exact file and action |
| "Update the validateCartItem function in cart-service/service.ts to check for negative quantities" | Precise function and condition |
| "Fix the TypeScript error on line 42 of order-service/routes.ts" | Exact location and issue |
| "Add unit test for the refund status transition in OrderService.isValidStatusTransition()" | Specific method and test case |

---

## Key Principles for Human-in-the-Loop Review

### 1. **You Are Now a PR Reviewer, Not a Code Writer**
Your primary skill must shift from writing code to:
- ✅ Reading and understanding code changes
- ✅ Identifying potential side effects
- ✅ Verifying test coverage
- ✅ Checking for security implications
- ✅ Validating business logic preservation

### 2. **Always Review the Diff**
Before accepting AI changes:
- ✅ Review every line changed
- ✅ Understand *why* each change was made
- ✅ Verify no additional files were modified
- ✅ Check for unintended scope expansion

### 3. **Verify Test Coverage**
- ✅ Run existing tests before accepting changes
- ✅ Ensure all tests pass after AI modifications
- ✅ Check if new tests should be added
- ✅ Validate edge cases are covered

### 4. **Check for Hallucinations**
AI can invent problems that don't exist:
- ✅ Verify issues identified are real
- ✅ Compare AI's findings with actual code
- ✅ Don't trust AI analysis blindly
- ✅ Use compilation/linting tools to confirm errors

### 5. **Demand Specificity in Your Prompts**
When working with AI agents:
- ✅ Reference specific files (#file:path)
- ✅ Define exact scope and boundaries
- ✅ Specify what should NOT be changed
- ✅ Request documentation of changes
- ✅ Ask for test verification

---

## Lessons Learned

### What Worked ✅

1. **Specific Prompts Win**
   - Action B's specific prompt led to precise, safe changes
   - Clear boundaries prevented scope creep
   - Easy to review and validate

2. **AI Was Conservative (This Time)**
   - Action A could have been catastrophic but wasn't
   - AI verified tests and avoided breaking changes
   - We got lucky with a well-behaved AI response

3. **Documentation Helps**
   - Both actions produced detailed analysis documents
   - Transparency into AI decision-making
   - Reviewers can understand the "why" behind changes

### What's Concerning ⚠️

1. **Vague Prompts Are Russian Roulette**
   - Action A expanded scope (2 fixes from vague request)
   - No guarantee next vague prompt will be safe
   - Success this time ≠ success next time

2. **AI Can Sound Confident When Wrong**
   - AI provides thorough reasoning regardless of correctness
   - Detailed explanations can mask bad decisions
   - Human verification is non-negotiable

3. **Scope Creep Is Real**
   - Even "helpful" fixes can introduce risk
   - Every change needs review
   - More changes = more surface area for bugs

---

## Final Recommendations

### For Prompt Engineering

1. **Always be specific** about files, functions, and objectives
2. **Define boundaries** explicitly (what NOT to change)
3. **Request verification** (tests, compilation checks)
4. **Ask for documentation** of all changes
5. **Use file references** (#file:path) when possible

### For Code Review

1. **Treat AI as a junior developer** - review everything
2. **Verify claims** - don't trust AI analysis blindly
3. **Run tests** before and after changes
4. **Check for scope creep** - did AI change more than asked?
5. **Understand every line** - if you don't understand, don't merge

### For Team Process

1. **Require human approval** for all AI-generated code
2. **Maintain test coverage** as safety net
3. **Document AI usage** in commit messages
4. **Share learnings** about what prompts work/fail
5. **Establish guardrails** for AI agent usage

---

## Conclusion

**Thesis Validated**: ✅ *"Vague Prompts = Dangerous Code"*

This experiment demonstrated that:
- 🔴 **Vague prompts lead to unpredictable scope expansion**
- 🟢 **Specific prompts lead to safe, targeted changes**
- ⚠️ **Human review is non-negotiable regardless of prompt quality**

The "Human-in-the-Loop" is not optional. AI coding agents are powerful tools, but they amplify both good and bad prompts. Your responsibility is to:
1. Write better prompts (specific, bounded, clear)
2. Review all changes critically (verify, test, understand)
3. Never merge without understanding every line

**Agent Mode Is Powerful. Agent Mode Is Dangerous. You Are the Guardrail.**

---

## Submission Summary

**Challenge Completed**: ✅

**Documents Generated**:
- Action A: [09 - 003 - Challenge 3.4.4 Action A.md](09%20-%20003%20-%20Challenge%203.4.4%20Action%20A.md)
- Action B: [09 - 003 - Challenge 3.4.4 Action B.md](09%20-%20003%20-%20Challenge%203.4.4%20Action%20B.md)
- Summary: This document

**Key Insight**:
> **Don't say "Fix it"** - The vague prompt "Fix the Order status logic" resulted in scope expansion (2 fixes instead of 1). 
> 
> **Say "Update file X to handle condition Y"** - The specific prompt "Review #file:swagger.ts and #file:types.ts to ensure OrderStatus enum values match" resulted in a precise, safe, and auditable change.
> 
> *Vague prompts are Russian roulette. Specific prompts are surgical strikes. Your code reading skills must now exceed your code writing skills.*

# Challenge 2.3.4 — "Gherkin-Only" Local LLM Config


## Task Overview
We are adapting the "Template" challenge from Day 8 to focus on **Local LLM Configuration**.

**Objective:** Create a specialized configuration for your local AI that forces it to behave like a BDD (Behavior Driven Development) expert.

**Note:** The trigger phrase `Test this` does not work with any combination of the prompt I created. Therefore, I execute the Gherkin generation by selecting the option **personal-copilot-documentation** directly.

---

## Personal Copilot Configuration (Documentation Prompt Prefix)
```json
"personal-copilot.promptPrefix.documentation": "You are a Senior QA Automation Engineer with expertise in BDD (Behavior Driven Development) and test automation.  
RULES: 
1. Analyze the provided code from a \"Risk and Quality\" perspective. Highlight potential failure points or edge cases in your tests. 
2. Generate test scenarios **always in Gherkin syntax** (Given/When/Then). Output must be actionable as test cases. 
3. Do not provide commentary, explanations, or additional text—focus solely on producing clear, complete, and correct Gherkin test cases. 
4. Ensure each scenario covers edge cases, typical flows, and risk points.  
INSTRUCTION: 
- Take the currently highlighted code and apply these rules. 
- Output only the Gherkin test scenarios."
```
**Trigger Phrase (not functional):** `Test this`

---

## Resulting Gherkin Output
```gherkin
Feature: Clear Cart

  Scenario: Clear cart for user with existing items
    Given a user with ID "user123" has a cart containing 3 items with total amount $150 and total items 3
    When the user clears the cart
    Then the cart should be empty with 0 items, total amount 0, and total items 0
    And the cart's updatedAt should be updated to the current time

  Scenario: Clear cart for user with an empty cart
    Given a user with ID "userEmpty" has an empty cart
    When the user clears the cart
    Then the cart should remain empty with 0 items, total amount 0, and total items 0
    And the cart's updatedAt should be updated to the current time

  Scenario: Clear cart for new user (no existing cart)
    Given a user with ID "newUser" has no cart in the system
    When the user clears the cart
    Then a new empty cart should be created with 0 items, total amount 0, and total items 0
    And the cart's updatedAt should be set to the current time

  Scenario: Clear cart multiple times
    Given a user with ID "repeatUser" has a cart containing 2 items
    When the user clears the cart
    And the user clears the cart again
    Then the cart should be empty with 0 items, total amount 0, and total items 0
    And the cart's updatedAt should reflect the time of the second clear operation

  Scenario: Clear cart with negative totals (data corruption)
    Given a user with ID "corruptUser" has a cart with negative totalAmount -50 and negative totalItems -1
    When the user clears the cart
    Then the cart should have totalAmount 0 and totalItems 0
    And the cart's items list should be empty

  Scenario: Clear cart with a large number of items
    Given a user with ID "largeUser" has a cart containing 10,000 items and total amount $500,000
    When the user clears the cart
    Then the cart should be empty with 0 items, total amount 0, and total items 0
    And the cart's updatedAt should be updated

  Scenario: Clear cart concurrently
    Given two concurrent clear cart requests for user "concurrentUser" with a cart containing 5 items
    When both requests are processed concurrently
    Then the cart should be empty with 0 items, total amount 0, and total items 0
    And the cart's updatedAt should be the timestamp of the last request

  Scenario: Clear cart for user with zero total amount but non‑zero items
    Given a user with ID "zeroTotalUser" has a cart with 4 items and total amount 0
    When the user clears the cart
    Then the cart should have 0 items, total amount 0, and total items 0

  Scenario: Clear cart for user with zero items but non‑zero total amount
    Given a user with ID "zeroItemsUser" has a cart with 0 items but total amount 100
    When the user clears the cart
    Then the cart should have 0 items, total amount 0, and total items 0
```

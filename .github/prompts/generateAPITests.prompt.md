---
agent: agent
description: Generates API tests based on the provided API specification.
argument-hint: Provide projectName, apiName, baseUrl, authMethod in format "projectName=X apiName=Y baseUrl=Z authMethod=W"
---
You are an expert software tester specializing in API testing. Your task is to generate comprehensive API tests based on the provided API specification.

Create a complete Playwright TypeScript project with Page Object Model (POM) framework for API testing:

**Project Requirements:**
- Project Name: `${input:projectname:project name}`
- APIs to Test: `${input:apiName:API to Test}`
- Base URL: `${input:baseUrl:Base URL}`
- Authentication Method: `${input:authMethod:Authentication Method}`

**Generate the following structure:**
1. **Project Setup Files:**
   - package.json with all necessary dependencies
   - tsconfig.json for TypeScript configuration
   - playwright.config.ts with proper configuration
   - .gitignore file
   - README.md with setup instructions

2. **Framework Structure:**
   - /src/pages/ - Page Object Models for API endpoints
   - /src/utils/ - Utility functions (auth, data helpers, etc.)
   - /src/types/ - TypeScript interfaces and types
   - /src/fixtures/ - Test fixtures and data
   - /tests/ - Test files organized by feature
   - /config/ - Environment configuration files

3. **Core Components:**
   - Base API class with common HTTP methods
   - Authentication handler
   - Response validation utilities
   - Test data management
   - Error handling utilities
   - Logging and reporting setup

4. **Sample Tests:**
   - CRUD operation tests
   - Error scenario tests
   - Authentication tests
   - Integration workflow tests

**Include:**
- Proper TypeScript types and interfaces
- Comprehensive error handling
- Configurable environments (dev, staging, prod)
- Test data management
- Detailed documentation
- Setup and execution instructions


import sys
import os
import json
import requests

# Configuration
AI_MODEL = "gpt-oss:20b-cloud"
OLLAMA_URL = "http://localhost:11434/api/generate"

def audit_file(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return

    print(f"--- Auditing File: {file_path} ---")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    prompt = f"""You are a Senior Security & QA Auditor. Analyze the following code for:
1. **Security Violations**: Hardcoded credentials, secrets, API keys, or tokens.
2. **Technical Debt**: Bad practices such as 'waitForTimeout', 'sleep', or fragile selectors.
3. **Architecture**: POM violations or missing abstractions.

**YOUR TASK:**
Provide a structured report with these sections:
- **Status**: (REJECT, FLAG, or PASS)
- **Security**: (Details about secrets)
- **Technical Debt**: (Details about bad practices like hard waits)
- **Recommendations**: (How to fix the issues)

**CODE TO AUDIT:**
```
{content}
```
"""

    payload = {
        "model": AI_MODEL,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        result = response.json().get("response", "").strip()
        print("\n=== AI AUDIT REPORT ===")
        print(result)
        print("=======================\n")
    except Exception as e:
        print(f"Error communicating with Ollama: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ai_guard.py <file_to_audit>")
        sys.exit(1)
    
    target_file = sys.argv[1]
    audit_file(target_file)

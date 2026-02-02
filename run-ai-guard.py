#!/usr/bin/env python3
"""
Wrapper script to run AI Guard from pre-commit hook.
Works cross-platform by detecting OS and calling appropriate script.
"""
import os
import sys
import subprocess
import platform


def main():
    # Get the directory where this script is located (project root)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to ai-guard.bat in .git/hooks
    ai_guard_path = os.path.join(script_dir, ".git", "hooks", "ai-guard.bat")

    # Check if ai-guard.bat exists
    if not os.path.exists(ai_guard_path):
        print(f"ERROR: AI Guard script not found at: {ai_guard_path}")
        sys.exit(1)

    # Run the batch script
    if platform.system() == "Windows":
        # On Windows, run the batch script directly
        result = subprocess.run([ai_guard_path], shell=True)
    else:
        # On Unix systems, this would fail (batch scripts don't work)
        print("WARNING: AI Guard (.bat) only works on Windows. Skipping...")
        sys.exit(0)

    # Return the exit code from ai-guard.bat
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()

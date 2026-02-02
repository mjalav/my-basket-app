@echo off
REM Wrapper script for pre-commit to run AI Guard
REM This script is in the project root and calls the actual ai-guard.bat in .git/hooks

"%~dp0.git\hooks\ai-guard.bat"
exit /b %ERRORLEVEL%

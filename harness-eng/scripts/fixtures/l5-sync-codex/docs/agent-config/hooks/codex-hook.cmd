@echo off
REM Codex Windows hook launcher (harness-eng). Resolves git root then runs adapter or a direct script.
REM Usage:
REM   codex-hook.cmd commit-gate superpowers-commit-gate.js
REM   codex-hook.cmd mcp-guard mcp-mysql-guard.js
REM   codex-hook.cmd --direct codex-stop-checklist.js
setlocal EnableExtensions
for /f "usebackq delims=" %%i in (`git rev-parse --show-toplevel 2^>nul`) do set "ROOT=%%i"
if not defined ROOT exit /b 0
if /I "%~1"=="--direct" (
  if "%~2"=="" exit /b 0
  node "%ROOT%\.codex\hooks\%~2"
  exit /b 0
)
node "%ROOT%\.codex\hooks\codex-adapter.js" %*
exit /b 0

# Fix: npm.ps1 Cannot Be Loaded Error

## Quick Fix Options

### Option 1: Use npm.cmd instead (Easiest)
Instead of using `npm`, use `npm.cmd`:
```powershell
npm.cmd --version
npm.cmd install
npm.cmd start
```

### Option 2: Fix PowerShell Execution Policy
Open PowerShell **as Administrator** and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then type `Y` when prompted.

### Option 3: Bypass for Current Session Only
In your PowerShell terminal, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Option 4: Use Command Prompt Instead
Open **Command Prompt** (cmd.exe) instead of PowerShell - npm works there without issues.

## Verify Fix
After applying a fix, test:
```powershell
npm --version
```

## Why This Happens
PowerShell blocks `.ps1` scripts by default for security. The `npm.ps1` file is a PowerShell script that npm uses, but it's blocked by execution policy.

## Recommended Solution
**Use `npm.cmd`** - it's the Windows command file version that doesn't require PowerShell script execution.

Example:
```powershell
# Instead of: npm start
npm.cmd start

# Instead of: npm install
npm.cmd install
```

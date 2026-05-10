Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Starting Decentralized Justice backend..." -ForegroundColor Cyan
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload

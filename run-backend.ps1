# Run backend with venv2
Set-Location "$PSScriptRoot\backend"
& ".\venv2\Scripts\Activate.ps1"
Set-Location ".\venv2\source"
uvicorn main:app --reload --host 0.0.0.0 --port 8000

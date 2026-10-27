@echo off
cd /d "%~dp0"
powershell -NoProfile -WindowStyle Hidden -Command "try { $r = Invoke-RestMethod 'http://127.0.0.1:8767/api/current' -TimeoutSec 2; Start-Process 'http://127.0.0.1:8767' } catch { Start-Process python -ArgumentList 'herramientas/servidor.py' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden }"

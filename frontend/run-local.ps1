param(
  [int]$Port = 4173
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server $Port
  exit
}

if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $Port
  exit
}

Write-Error "No encontre Python. Instala Python o abre los HTML directamente."

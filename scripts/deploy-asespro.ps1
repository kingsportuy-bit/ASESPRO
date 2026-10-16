param(
  [string]$CommitMessage = "",
  [switch]$NoCommit,
  [switch]$NoPush,
  [switch]$SkipLocalBuild,
  [switch]$TailLogs
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$FrontendPath = Join-Path $ProjectRoot "frontend"
$VpsHost = "root@31.97.28.4"
$VpsProjectPath = "/opt/asespro"
$WebImageName = "asespro-web:latest"
$ServicesImageName = "asespro-servicios:latest"
$StackName = "asespro"
$SshPath = if (Test-Path "C:\Windows\System32\OpenSSH\ssh.exe") { "C:\Windows\System32\OpenSSH\ssh.exe" } else { "ssh" }

function Assert-DnsPointsToVps {
  param([string]$HostName)

  $answer = Invoke-RestMethod -Uri "https://dns.google/resolve?name=$HostName&type=A" -TimeoutSec 10
  $answerRecords = if ($answer.PSObject.Properties.Name -contains "Answer") { @($answer.Answer) } else { @() }
  $addresses = @($answerRecords | Where-Object { $_.type -eq 1 } | ForEach-Object { $_.data })
  if ($answer.Status -ne 0 -or $addresses -notcontains "31.97.28.4") {
    $found = if ($addresses.Count) { $addresses -join ", " } else { "sin registro A" }
    throw "DNS de $HostName todavía no apunta al VPS 31.97.28.4 (respuesta: $found). Se detuvo antes del commit, push y deploy."
  }
}

function Invoke-Step {
  param(
    [string]$Label,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Action
}

Invoke-Step "Checking repository" {
  Push-Location $ProjectRoot
  try {
    $branch = git rev-parse --abbrev-ref HEAD
    if ($branch -ne "main") {
      throw "Deploy must run from main. Current branch: $branch"
    }

    git diff --check
  } finally {
    Pop-Location
  }
}

Invoke-Step "Checking DNS before release" {
  foreach ($hostName in @(
    "asespro.kodebix.com",
    "inmobiliaria.asespro.kodebix.com",
    "panel.inmobiliaria.asespro.kodebix.com"
  )) {
    Assert-DnsPointsToVps -HostName $hostName
    Write-Host "$hostName points to the VPS."
  }
}

if (-not $SkipLocalBuild) {
  Invoke-Step "Running local production build" {
    Push-Location $FrontendPath
    try {
      npm run build
    } finally {
      Pop-Location
    }
  }
}

if (-not $NoCommit) {
  Invoke-Step "Updating Git" {
    Push-Location $ProjectRoot
    try {
      git add -- frontend mock-servicios deploy.stack.yml scripts/deploy-asespro.ps1 Docs/servicios/CONTRATO_MOCK.md Docs/servicios/ASSETS_WEB.md Docs/GUIA_ACTUALIZAR_VPS.md
      git reset -- frontend/tsconfig.tsbuildinfo | Out-Null
      git diff --cached --quiet
      if ($LASTEXITCODE -ne 0) {
        $message = $CommitMessage
        if ([string]::IsNullOrWhiteSpace($message)) {
          $message = "deploy: separate ASESPRO sites and temporary panel"
        }

        git commit -m $message
      } else {
        Write-Host "No approved site changes are staged for release."
      }
    } finally {
      Pop-Location
    }
  }
}

if (-not $NoPush) {
  Invoke-Step "Pushing to GitHub" {
    Push-Location $ProjectRoot
    try {
      git push
    } finally {
      Pop-Location
    }
  }
}

$remoteScript = @"
set -euo pipefail
cd $VpsProjectPath
git pull --ff-only
cd $VpsProjectPath/frontend
docker build -t $WebImageName .
cd $VpsProjectPath
docker build -t $ServicesImageName -f mock-servicios/Dockerfile mock-servicios
docker stack deploy -c deploy.stack.yml $StackName
docker service update --force asespro_asespro-web
docker service update --force asespro_asespro-panel
docker service update --force asespro_asespro-servicios
docker service ps asespro_asespro-web
docker service ps asespro_asespro-panel
docker service ps asespro_asespro-servicios
"@

if ($TailLogs) {
  $remoteScript += @"

docker service logs --tail 100 asespro_asespro-web
docker service logs --tail 100 asespro_asespro-panel
docker service logs --tail 100 asespro_asespro-servicios
"@
}

Invoke-Step "Deploying on VPS" {
  $remoteScript | & $SshPath -F NUL $VpsHost "bash -s"
  if ($LASTEXITCODE -ne 0) {
    throw "VPS deployment failed with exit code $LASTEXITCODE. Smoke tests were not run."
  }
}

Invoke-Step "Smoke test" {
  function Invoke-SmokeRequest {
    param([string]$Uri)

    $lastError = $null
    for ($attempt = 1; $attempt -le 5; $attempt++) {
      try {
        return Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 20
      } catch {
        $lastError = $_
        Start-Sleep -Seconds 3
      }
    }

    throw $lastError
  }

  $services = Invoke-SmokeRequest -Uri "https://asespro.kodebix.com/"
  $web = Invoke-SmokeRequest -Uri "https://inmobiliaria.asespro.kodebix.com/"
  $webListings = Invoke-SmokeRequest -Uri "https://inmobiliaria.asespro.kodebix.com/alquiler"
  $panel = Invoke-SmokeRequest -Uri "https://panel.inmobiliaria.asespro.kodebix.com/admin"

  Write-Host "Services status: $($services.StatusCode)"
  Write-Host "Inmobiliaria status: $($web.StatusCode)"
  Write-Host "Inmobiliaria listings status: $($webListings.StatusCode)"
  Write-Host "Temporary panel status: $($panel.StatusCode)"
}

Write-Host ""
Write-Host "Deploy finished." -ForegroundColor Green

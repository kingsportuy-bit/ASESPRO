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
$ImageName = "asespro-web:latest"
$StackName = "asespro"
$ServiceName = "asespro_asespro-web"

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
      $changes = git status --porcelain
      if ($changes) {
        $message = $CommitMessage
        if ([string]::IsNullOrWhiteSpace($message)) {
          $message = "deploy: update production"
        }

        git add -A
        git commit -m $message
      } else {
        Write-Host "No local changes to commit."
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
docker build -t $ImageName .
cd $VpsProjectPath
docker stack deploy -c deploy.stack.yml $StackName
docker service update --force $ServiceName
docker service ps $ServiceName
"@

if ($TailLogs) {
  $remoteScript += @"

docker service logs --tail 100 $ServiceName
"@
}

Invoke-Step "Deploying on VPS" {
  $remoteScript | ssh $VpsHost "bash -s"
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

  $web = Invoke-SmokeRequest -Uri "https://asespro.codexa.uy/"
  $panel = Invoke-SmokeRequest -Uri "https://panelasespro.codexa.uy/admin"

  Write-Host "Web status: $($web.StatusCode)"
  Write-Host "Panel status: $($panel.StatusCode)"
}

Write-Host ""
Write-Host "Deploy finished." -ForegroundColor Green

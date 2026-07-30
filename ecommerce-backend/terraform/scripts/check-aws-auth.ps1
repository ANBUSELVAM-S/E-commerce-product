param(
  [string]$Profile = ""
)

$profileName = if ($Profile) { $Profile } elseif ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { "" }
$env:AWS_PROFILE = $profileName

function Get-AwsIdentity {
  param([string]$Name)

  $args = @("sts", "get-caller-identity", "--output", "json")
  if ($Name) {
    $args += @("--profile", $Name)
  }

  $output = & aws @args 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $output) {
    return $null
  }

  return ($output | Out-String).Trim()
}

Write-Host "Checking AWS credentials..."
try {
  $identity = Get-AwsIdentity -Name $profileName
  if (-not $identity) {
    if ($profileName) {
      Write-Host "Refreshing AWS SSO session for profile '$profileName'..."
      & aws sso login --profile $profileName 2>$null
      if ($LASTEXITCODE -eq 0) {
        $identity = Get-AwsIdentity -Name $profileName
      }
    }
  }

  if (-not $identity) {
    throw "AWS credentials are not available or have expired."
  }

  Write-Host "AWS credentials are valid."
  Write-Host $identity
}
catch {
  Write-Error $_.Exception.Message
  Write-Host "Refresh your AWS credentials and try again."
  Write-Host "Examples:"
  Write-Host "  aws sso login --profile Anbuselvam"
  Write-Host "  aws configure --profile Anbuselvam"
  exit 1
}

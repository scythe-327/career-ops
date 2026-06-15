param(
  [Parameter(Mandatory=$true)]
  [string]$ApiKey,
  [Parameter(Mandatory=$true)]
  [string]$BodyFile,
  [Parameter(Mandatory=$true)]
  [string]$OutFile,
  [string]$ApiEndpoint = "https://45bwzj1sgc-dsn.algolia.net/1/indexes/WaaSPublicCompanyJob_created_at_desc_production/query",
  [string]$AppId = "45BWZJ1SGC"
)

try {
  $headers = @{
    "X-Algolia-Application-Id" = $AppId
    "X-Algolia-API-Key" = $ApiKey
  }
  $bodyJson = Get-Content -Path $BodyFile -Raw -Encoding utf8
  $body = $bodyJson | ConvertFrom-Json
  $bodyStr = $body | ConvertTo-Json -Compress
  Invoke-WebRequest -Uri $ApiEndpoint -Method Post -Headers $headers -ContentType "application/json" -Body $bodyStr -OutFile $OutFile -UseBasicParsing
} catch {
  Set-Content -Path $OutFile -Value "{`"psError`":`"$($_.Exception.Message.Replace('"','\\"').Replace("`r",'').Replace("`n",' '))`"}" -Encoding utf8 -NoNewline
}

param(
  [string]$Url = "http://127.0.0.1:4174/features/"
)

try {
  $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 $Url
} catch {
  $statusCode = $null
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
    $statusCode = [int]$_.Exception.Response.StatusCode
  }

  if ($statusCode) {
    Write-Error "STATUS_FAIL $statusCode"
  } else {
    Write-Error "FETCH_FAIL $Url"
  }
  exit 1
}

if ($response.StatusCode -ne 200) {
  Write-Error "STATUS_FAIL $($response.StatusCode)"
  exit 1
}

$html = $response.Content
$requiredMarkers = @(
  'class="story-hero"',
  'data-scene="scan"',
  'data-scene="ootd"',
  'data-scene="stylist"',
  'data-scene="planner"',
  'data-scene="style-dna"',
  'class="feature-atlas"',
  'class="pricing-panel"',
  'gsap.min.js',
  'ScrollTrigger.min.js'
)

$missing = foreach ($marker in $requiredMarkers) {
  if ($html -notmatch [regex]::Escape($marker)) { $marker }
}

if ($missing.Count -gt 0) {
  Write-Error ("MISSING_MARKERS`n - " + ($missing -join "`n - "))
  exit 1
}

$sceneCount = ([regex]::Matches($html, 'data-scene="')).Count
if ($sceneCount -ne 5) {
  Write-Error "SCENE_COUNT_FAIL expected=5 actual=$sceneCount"
  exit 1
}

Write-Output "PASS features story structure markers found"

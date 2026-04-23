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
  'ScrollTrigger.min.js',
  'gsap.registerPlugin(ScrollTrigger)',
  'document.querySelectorAll(''[data-scene]'')',
  'prefers-reduced-motion',
  'class="reveal"'
)

$requiredMarkers += @(
  'class="scene-inner"',
  'class="scene-shot"',
  'class="scene-media-daylook"',
  'act-ii-outfit-of-day-screen.jpg',
  'class="atlas-grid"',
  '@media(max-width:1024px)',
  '@media(max-width:640px)'
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

$expectedSceneOrder = @('scan', 'ootd', 'stylist', 'planner', 'style-dna')
$actualSceneOrder = @([regex]::Matches($html, 'data-scene="([^"]+)"') | ForEach-Object { $_.Groups[1].Value })
if (($actualSceneOrder -join ',') -ne ($expectedSceneOrder -join ',')) {
  Write-Error "SCENE_ORDER_FAIL expected=$($expectedSceneOrder -join ',') actual=$($actualSceneOrder -join ',')"
  exit 1
}

$planViewCount = ([regex]::Matches($html, 'data-plan-view(?=[\s=>])')).Count
if ($planViewCount -ne 1) {
  Write-Error "PLAN_VIEW_COUNT_FAIL expected=1 actual=$planViewCount"
  exit 1
}

$atlasCardCount = ([regex]::Matches($html, 'class="atlas-card"')).Count
if ($atlasCardCount -lt 5) {
  Write-Error "ATLAS_CARD_COUNT_FAIL expected>=5 actual=$atlasCardCount"
  exit 1
}

if ($html -notmatch 'Save 37% yearly') {
  Write-Error "MISSING_MARKER Save 37% yearly"
  exit 1
}

$requiredAtlasItems = @(
  'Travel Capsule',
  'Wardrobe Gaps',
  'Mood Outfit',
  'Ghost Mannequin',
  'Wardrobe Insights &amp; Analytics'
)

foreach ($item in $requiredAtlasItems) {
  if ($html -notmatch [regex]::Escape($item)) {
    Write-Error "ATLAS_ITEM_MISSING $item"
    exit 1
  }
}

$requiredPricingItems = @(
  '20 renders per month',
  'data-billing-toggle="year"',
  'data-billing-toggle="month"'
)

foreach ($item in $requiredPricingItems) {
  if ($html -notmatch [regex]::Escape($item)) {
    Write-Error "PRICING_ITEM_MISSING $item"
    exit 1
  }
}

Write-Output "PASS features story structure markers found"

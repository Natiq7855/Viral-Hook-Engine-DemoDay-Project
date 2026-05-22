$apiKey = 'rnd_SaHyqvikrbQlQaMkamqZPFoWpKC6'
$ownerId = 'tea-d884n7m7r5hc73f97r5g'
$repo = 'https://github.com/Natiq7855/Viral-Hook-Engine-DemoDay-Project.git'

# Construct payload with required serviceDetails for a web_service
$body = @{ 
  type = 'web_service'
  name = 'viral-hook-engine'
  ownerId = $ownerId
  repo = $repo
  branch = 'main'
  autoDeploy = 'yes'
  serviceDetails = @{
    runtime = 'node'
    envSpecificDetails = @{
      buildCommand = 'npm run build'
      startCommand = 'npm run start'
    }
    plan = 'starter'
    region = 'oregon'
    numInstances = 1
    healthCheckPath = '/'
    openPorts = @(@{ port = 3000; protocol = 'TCP' })
    buildPlan = 'starter'
  }
  envVars = @(
    @{ key = 'NODE_ENV'; value = 'production' }
  )
}

$bodyJson = $body | ConvertTo-Json -Depth 10

try {
  $resp = Invoke-RestMethod -Uri 'https://api.render.com/v1/services' -Method Post -Headers @{ Authorization = "Bearer $apiKey"; Accept = 'application/json' } -Body $bodyJson -ContentType 'application/json'
  $resp | ConvertTo-Json -Depth 10
} catch {
  Write-Error "Render API error: $_"
}

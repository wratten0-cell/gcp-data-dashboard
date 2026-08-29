# PowerShell Deployment Script for Google Cloud Run
param (
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = "us-central1",
    [string]$ServiceName = "gcp-data-dashboard",
    [string]$RepoName = "gcp-dashboard-repo"
)

if (-not $ProjectId) {
    $ProjectId = (gcloud config get-value project 2>$null)
}

if (-not $ProjectId) {
    Write-Error "GCP Project ID not specified. Please set GCP_PROJECT_ID or pass -ProjectId parameter."
    exit 1
}

$ImageTag = "$Region-docker.pkg.dev/$ProjectId/$RepoName/$ServiceName`:latest"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Deploying GCP Data Dashboard to Google Cloud Run" -ForegroundColor Cyan
Write-Host " Project: $ProjectId | Region: $Region" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Enable APIs
Write-Host "--> Enabling GCP APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com bigquery.googleapis.com aiplatform.googleapis.com --project=$ProjectId

# 2. Artifact Registry
Write-Host "--> Verifying Artifact Registry..." -ForegroundColor Yellow
gcloud artifacts repositories describe $RepoName --location=$Region --project=$ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
    gcloud artifacts repositories create $RepoName --repository-format=docker --location=$Region --description="Docker repository for GCP Dashboard" --project=$ProjectId
}

# 3. Build & Submit
Write-Host "--> Building container via Google Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag $ImageTag --project=$ProjectId .

# 4. Deploy to Cloud Run
Write-Host "--> Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName --image=$ImageTag --platform=managed --region=$Region --allow-unauthenticated --set-env-vars="GCP_PROJECT_ID=$ProjectId,ENVIRONMENT=production,DEMO_MODE=false" --project=$ProjectId

# 5. Show URL
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Deployment Complete! Service URL:" -ForegroundColor Green
gcloud run services describe $ServiceName --region=$Region --project=$ProjectId --format='value(status.url)'
Write-Host "==========================================================" -ForegroundColor Green

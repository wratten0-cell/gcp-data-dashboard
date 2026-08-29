#!/usr/bin/env bash
# ==============================================================================
# GCP Data Dashboard & AI/ML Platform - Cloud Run Deployment Script
# ==============================================================================

set -e

# Configurable Variables
PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project)}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="gcp-data-dashboard"
REPO_NAME="gcp-dashboard-repo"
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest"

echo "=========================================================="
echo " Deploying GCP Data Dashboard to Google Cloud Run"
echo " Project: $PROJECT_ID | Region: $REGION"
echo "=========================================================="

# 1. Enable Required GCP APIs
echo "--> Enabling GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    bigquery.googleapis.com \
    aiplatform.googleapis.com \
    --project="$PROJECT_ID"

# 2. Ensure Artifact Registry exists
echo "--> Verifying Artifact Registry repository..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for GCP Dashboard" \
        --project="$PROJECT_ID"
fi

# 3. Build & Submit Container to Cloud Build
echo "--> Building container via Google Cloud Build..."
gcloud builds submit --tag "$IMAGE_TAG" --project="$PROJECT_ID" .

# 4. Deploy Container to Cloud Run
echo "--> Deploying to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE_TAG" \
    --platform=managed \
    --region="$REGION" \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,ENVIRONMENT=production,DEMO_MODE=false" \
    --project="$PROJECT_ID"

# 5. Grant BigQuery & Vertex AI IAM Permissions to Service Account
SERVICE_ACCOUNT=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(spec.template.spec.serviceAccountName)')

if [ -n "$SERVICE_ACCOUNT" ]; then
    echo "--> Granting IAM roles to service account: $SERVICE_ACCOUNT"
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/bigquery.admin" --quiet

    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/aiplatform.user" --quiet
fi

echo "=========================================================="
echo " Deployment Complete!"
gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)'
echo "=========================================================="

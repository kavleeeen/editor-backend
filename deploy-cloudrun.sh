#!/usr/bin/env bash
set -euo pipefail

# Minimal Cloud Run deploy helper
# Requirements: gcloud CLI installed and authenticated

PROJECT_ID=${PROJECT_ID:-"$(gcloud config get-value project 2>/dev/null || true)"}
REGION=${REGION:-asia-south1}
SERVICE_NAME=${SERVICE_NAME:-editor-backend}
# Secret Manager secret name that stores MongoDB URI
MONGODB_URI_SECRET_NAME=${MONGODB_URI_SECRET_NAME:-MONGODB_URI}
IMAGE=gcr.io/${PROJECT_ID}/${SERVICE_NAME}:$(date +%Y%m%d-%H%M%S)

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Error: PROJECT_ID is not set and not configured in gcloud."
  echo "Set it via: export PROJECT_ID=your-project-id"
  exit 1
fi

echo "Building image: ${IMAGE}"
gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}"

echo "Deploying to Cloud Run: ${SERVICE_NAME} (${REGION})"
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --max-instances 3 \
  --set-env-vars NODE_ENV=production \
  --set-secrets MONGODB_URI=${MONGODB_URI_SECRET_NAME}:latest

echo "Done. Service URL:"
gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)'



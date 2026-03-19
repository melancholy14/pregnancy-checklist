# gcp-deployment.md

## Overview

Next.js Fullstack App → Cloud Run 배포

------------------------------------------------------------------------

## Required GCP Services

Cloud Run\
Cloud Storage\
Artifact Registry\
Cloud Logging\
Secret Manager

------------------------------------------------------------------------

## Deployment Flow

1.  Docker build
2.  Artifact Registry push
3.  Cloud Run deploy

------------------------------------------------------------------------

## Dockerfile Example

FROM node:20-alpine

WORKDIR /app

COPY package.json ./ RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD \["node", "server.js"\]

------------------------------------------------------------------------

## Cloud Run Deploy

gcloud run deploy pregnancy-prep --image gcr.io/PROJECT_ID/app
--platform managed --region asia-northeast3 --allow-unauthenticated

------------------------------------------------------------------------

## Storage Setup

Bucket 생성

pregnancy-prep-data

폴더 구조

checklist/ timeline/ babyfair/ videos/

------------------------------------------------------------------------

## Environment Variables

GCS_BUCKET_NAME YOUTUBE_API_KEY

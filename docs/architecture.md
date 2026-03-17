# architecture.md

## System Architecture

User ↓ Cloud Run (Next.js App) ↓ Google Cloud Storage (JSON Data)

------------------------------------------------------------------------

## Components

### Client

-   Next.js React UI
-   LocalStorage 기반 개인 상태

### Server

Next.js API Routes

역할

-   JSON 데이터 fetch
-   베이비페어 데이터 제공
-   콘텐츠 데이터 제공

------------------------------------------------------------------------

## Data Flow

1.  사용자가 due date 입력
2.  브라우저에서 주차 계산
3.  서버에서 checklist / timeline fetch
4.  개인 상태는 LocalStorage 저장

------------------------------------------------------------------------

## Canonical Data

저장 위치

GCS Bucket

예

gs://pregnancy-prep-data/

구조

checklist/v1/checklist_items.json timeline/v1/timeline_items.json
babyfair/2026/events.json videos/v1/videos.json

------------------------------------------------------------------------

## Cache Strategy

Checklist → 24h\
Timeline → 24h\
Babyfair → 6h

Next.js fetch revalidate 사용

# babyfair_data_pipeline.md

베이비페어 데이터 수집 파이프라인

## 목표

한국 주요 베이비페어 일정을 자동 수집하고 JSON으로 정규화

## 데이터 소스

-   코엑스 전시 일정
-   킨텍스 전시 일정
-   SETEC 전시 일정
-   베페 / 코베 / 맘스홀릭 등 공식 사이트

## 수집 단계

1.  스케줄러 실행 (Cloud Run Job)
2.  대상 사이트 HTML fetch
3.  행사 정보 파싱
4.  JSON 정규화
5.  Cloud Storage 저장

## JSON 구조

{ "id": "coex_babyfair_2026_04", "name": "코엑스 베이비페어", "venue":
"COEX", "city": "seoul", "startDate": "2026-04-16", "endDate":
"2026-04-19", "sourceUrl": "..." }

## 검수 프로세스

자동 수집 후 관리자 검수

검수 항목 - 날짜 - 행사명 - 장소

## 저장 위치

gs://pregnancy-prep-data/babyfair/2026/events.json

## 업데이트 주기

주 1회

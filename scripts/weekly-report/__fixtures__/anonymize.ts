#!/usr/bin/env tsx
/**
 * Fixture anonymizer for the weekly report Wave 2 regression matrix.
 *
 * 1회용 스크립트로 설계됐지만 향후 fixture 갱신 시 재사용을 위해 커밋한다.
 *
 * 입력: `~/Documents/pregnancy-checklist/60-analytics/weekly/_raw/2026-W{NN}.json`
 *       (운영자 vault에 launchd 가 적재한 실 GA4 결과)
 * 출력: `scripts/weekly-report/__fixtures__/W{NN}-anonymized.json`
 *
 * 익명화 정책 (spec.md §3.1 M2 PII 마스킹 + §6 fixture 룰):
 *   - propertyId: 실제 GA4 property id → "000000000"
 *   - landingPage query string: `?` 이후 전부 제거 (검색어/내부 입력값 누출 차단)
 *   - landingPage path 100자 truncate + "…"
 *   - externalDomain: 도메인 자체는 공개 정보지만 fixture diff 가독성을 위해 보존
 *   - cohortJoinWeek: 그대로 (ISO 주차 라벨 PII 아님)
 *
 * 사용:
 *   npx tsx scripts/weekly-report/__fixtures__/anonymize.ts 2026-W22 2026-W23 2026-W24
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ChannelGroupAcquisition,
  Ga4Result,
  LandingPageEntry,
} from "../types.js";

const VAULT_RAW_DIR = path.join(
  os.homedir(),
  "Documents",
  "pregnancy-checklist",
  "60-analytics",
  "weekly",
  "_raw",
);
const FIXTURE_DIR = path.dirname(fileURLToPath(import.meta.url));

const ANONYMIZED_PROPERTY_ID = "000000000";
const LANDING_PAGE_MAX_LENGTH = 100;

function anonymizeLandingPage(value: string): string {
  // query string 제거 — PII 누출 차단.
  const withoutQuery = value.split("?")[0] ?? "";
  if (withoutQuery.length <= LANDING_PAGE_MAX_LENGTH) return withoutQuery;
  return `${withoutQuery.slice(0, LANDING_PAGE_MAX_LENGTH)}…`;
}

function anonymizeChannelGroup(input: ChannelGroupAcquisition): ChannelGroupAcquisition {
  return {
    rows: input.rows.map((r) => ({
      channelGroup: r.channelGroup,
      sessions: r.sessions,
    })),
  };
}

function anonymizeLandingPageEntry(input: LandingPageEntry): LandingPageEntry {
  return {
    rows: input.rows.map((r) => ({
      landingPage: anonymizeLandingPage(r.landingPage),
      sessions: r.sessions,
    })),
  };
}

function anonymize(raw: Ga4Result): Ga4Result {
  // Pre-Wave 2 raw 파일은 channelGroup/landingPage 필드가 없을 수 있으므로 빈 슬롯으로 채운다.
  const rawWithLegacy = raw as Partial<Ga4Result> & Ga4Result;
  const channelGroup = rawWithLegacy.channelGroup ?? { rows: [] };
  const landingPage = rawWithLegacy.landingPage ?? { rows: [] };
  return {
    ...raw,
    propertyId: ANONYMIZED_PROPERTY_ID,
    channelGroup: anonymizeChannelGroup(channelGroup),
    landingPage: anonymizeLandingPageEntry(landingPage),
  };
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    process.stderr.write(
      `Usage: tsx scripts/weekly-report/__fixtures__/anonymize.ts 2026-W22 [2026-W23 ...]\n`,
    );
    process.exit(1);
  }

  for (const isoWeek of args) {
    const sourcePath = path.join(VAULT_RAW_DIR, `${isoWeek}.json`);
    if (!fs.existsSync(sourcePath)) {
      process.stderr.write(`⚠️ raw not found: ${sourcePath} — skipped\n`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as Ga4Result;
    const anonymized = anonymize(raw);
    const targetPath = path.join(
      FIXTURE_DIR,
      `${isoWeek.replace("2026-", "")}-anonymized.json`,
    );
    fs.writeFileSync(targetPath, `${JSON.stringify(anonymized, null, 2)}\n`, "utf8");
    process.stdout.write(`✓ ${targetPath}\n`);
  }
}

main();

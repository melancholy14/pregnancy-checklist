"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@/lib/analytics";

export type ScrollSignalsPageType = "article" | "checklist" | "home" | "timeline";

interface UseScrollSignalsOptions {
  slug?: string;
}

const READ_COMPLETE_SCROLL_PCT = 75;
const READ_COMPLETE_DWELL_SEC = 60;
const INACTION_SCROLL_PCT = 50;
const INACTION_DWELL_SEC = 30;
const POLL_INTERVAL_MS = 2000;

function getScrollPct(): number {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / docHeight) * 100));
}

export function useScrollSignals(
  pageType: ScrollSignalsPageType,
  options: UseScrollSignalsOptions = {},
): void {
  const { slug } = options;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mountTime = Date.now();
    let maxScrollPct = 0;
    let clicked = false;
    let readCompleteSent = false;
    let inactionSent = false;

    const handleScroll = () => {
      const pct = getScrollPct();
      if (pct > maxScrollPct) maxScrollPct = pct;
    };

    const handleClick = () => {
      clicked = true;
    };

    const tryFireReadComplete = () => {
      if (readCompleteSent) return;
      if (pageType !== "article") return;
      if (document.visibilityState !== "visible") return;
      const dwellSec = Math.floor((Date.now() - mountTime) / 1000);
      if (dwellSec < READ_COMPLETE_DWELL_SEC) return;
      if (maxScrollPct < READ_COMPLETE_SCROLL_PCT) return;
      readCompleteSent = true;
      sendGAEvent("article_read_complete", {
        slug: slug ?? null,
        read_time_sec: dwellSec,
        scroll_depth_pct: maxScrollPct >= 100 ? 100 : READ_COMPLETE_SCROLL_PCT,
      });
    };

    // 결정 3: scroll_without_action 트리거에 "AND article_read_complete 미발사" 조건 추가.
    // 세션 종료 신호(visibility hidden / pagehide)에서만 평가해 양성 신호 우선 원칙을 유지한다.
    const tryFireInaction = () => {
      if (inactionSent) return;
      if (readCompleteSent) return;
      if (clicked) return;
      const dwellSec = Math.floor((Date.now() - mountTime) / 1000);
      if (dwellSec < INACTION_DWELL_SEC) return;
      if (maxScrollPct < INACTION_SCROLL_PCT) return;
      inactionSent = true;
      sendGAEvent("scroll_without_action", {
        page_type: pageType,
        dwell_sec: dwellSec,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        tryFireInaction();
      }
    };

    const interval = window.setInterval(tryFireReadComplete, POLL_INTERVAL_MS);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", tryFireInaction);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", tryFireInaction);
    };
  }, [pageType, slug]);
}

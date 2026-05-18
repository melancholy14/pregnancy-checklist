"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, X } from "lucide-react";
import { sendGAEvent } from "@/lib/analytics";

const ONBOARDING_COMPLETED_KEY = "onboarding-completed";
const BANNER_DISMISSED_KEY = "onboarding-banner-dismissed";

type SourcePage = "articles" | "checklist" | "timeline" | "weight" | "info";

interface BannerStorageSnapshot {
  onboardingDone: boolean;
  dismissed: boolean;
}

const SERVER_SNAPSHOT: BannerStorageSnapshot = {
  onboardingDone: true,
  dismissed: true,
};

let cachedSnapshot: BannerStorageSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) listener();
}

function subscribeStorage(cb: () => void): () => void {
  listeners.add(cb);
  const handler = () => cb();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handler);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handler);
    }
  };
}

function getStorageSnapshot(): BannerStorageSnapshot {
  if (typeof window === "undefined") return cachedSnapshot;
  let onboardingDone: boolean;
  let dismissed: boolean;
  try {
    onboardingDone = localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== null;
    dismissed = localStorage.getItem(BANNER_DISMISSED_KEY) !== null;
  } catch {
    return cachedSnapshot;
  }
  if (
    cachedSnapshot.onboardingDone === onboardingDone &&
    cachedSnapshot.dismissed === dismissed
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = { onboardingDone, dismissed };
  return cachedSnapshot;
}

function getServerSnapshot(): BannerStorageSnapshot {
  return SERVER_SNAPSHOT;
}

function detectSourcePage(pathname: string): SourcePage | null {
  if (pathname.startsWith("/articles")) return "articles";
  if (pathname.startsWith("/checklist")) return "checklist";
  if (pathname.startsWith("/timeline")) return "timeline";
  if (pathname.startsWith("/weight")) return "weight";
  if (pathname.startsWith("/info")) return "info";
  return null;
}

export function OnboardingBannerProvider() {
  const pathname = usePathname();
  const storage = useSyncExternalStore(
    subscribeStorage,
    getStorageSnapshot,
    getServerSnapshot
  );
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    notifyListeners();
  }, [pathname]);

  const sourcePage = useMemo(() => detectSourcePage(pathname), [pathname]);
  const visible =
    !storage.onboardingDone && !storage.dismissed && sourcePage !== null;

  useEffect(() => {
    if (!visible || !sourcePage) return;
    sendGAEvent("onboarding_banner_view", {
      page_path: pathname,
      current_pregnancy_week: null,
    });
  }, [visible, pathname, sourcePage]);

  if (!visible || !sourcePage) return null;

  const handleClick = () => {
    sendGAEvent("onboarding_banner_click", {
      page_path: pathname,
      source_page: sourcePage,
    });
  };

  const handleDismiss = () => {
    sendGAEvent("onboarding_banner_dismiss", {
      page_path: pathname,
      source_page: sourcePage,
    });
    setLeaving(true);
    window.setTimeout(() => {
      try {
        localStorage.setItem(BANNER_DISMISSED_KEY, "true");
      } catch {
        // localStorage 접근 불가 시 무시
      }
      notifyListeners();
    }, 250);
  };

  return (
    <div
      className={`px-4 pt-4 transition-opacity duration-200 motion-reduce:transition-none ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative rounded-xl border border-pastel-yellow/40 bg-pastel-yellow/20 hover:bg-pastel-yellow/30 transition-colors">
        <Link
          href="/"
          onClick={handleClick}
          className="no-underline p-3 pr-12 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-pastel-yellow flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-accent-olive" aria-hidden />
          </div>
          <p
            className="flex-1 text-sm text-accent-olive"
            style={{ wordBreak: "keep-all" }}
          >
            예정일을 입력하면 주차별로 정렬된 체크리스트를 볼 수 있어요
          </p>
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="배너 닫기"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

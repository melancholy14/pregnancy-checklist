"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === "pending") setVisible(true);
  }, []);

  if (!visible) return null;

  const handle = (choice: "accepted" | "rejected") => {
    setConsent(choice);
    setVisible(false);
    if (choice === "accepted") window.location.reload();
  };

  return (
    <div role="dialog" aria-label="쿠키 사용 안내" className="fixed bottom-[4.5rem] left-0 right-0 z-50 px-4 pb-2 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-2xl mx-auto rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-black/5 p-4">
        <p className="text-sm text-foreground leading-relaxed">
          더 나은 서비스 경험을 위해 쿠키를 사용합니다.{" "}
          <Link href="/privacy" className="text-accent-purple underline underline-offset-2">
            개인정보처리방침
          </Link>
        </p>
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => handle("rejected")}
            className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-xl hover:bg-muted transition-colors"
          >
            거부
          </button>
          <button
            onClick={() => handle("accepted")}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-purple rounded-xl hover:bg-accent-purple-hover transition-colors"
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
}

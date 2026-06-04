"use client";

import Script from "next/script";
import { useConsentAccepted } from "@/lib/use-consent";

export function ConsentGatedScripts() {
  if (!useConsentAccepted()) return null;

  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!adsenseId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

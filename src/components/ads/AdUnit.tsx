"use client";

import { useConsentAccepted } from "@/lib/use-consent";

export function AdUnit({ slot, format = "auto" }: { slot: string; format?: string }) {
  if (!useConsentAccepted() || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

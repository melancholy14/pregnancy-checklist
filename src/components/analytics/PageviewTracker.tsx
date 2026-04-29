"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sendGAEvent } from "@/lib/analytics";

export function PageviewTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      sendGAEvent("page_view", { page_path: pathname });
      return;
    }
    sendGAEvent("page_view", { page_path: pathname });
  }, [pathname]);

  return null;
}

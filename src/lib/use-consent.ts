"use client";

import { useSyncExternalStore } from "react";
import { getConsent } from "./consent";

const noop = () => () => {};

export function useConsentAccepted() {
  return useSyncExternalStore(
    noop,
    () => getConsent() === "accepted",
    () => false
  );
}

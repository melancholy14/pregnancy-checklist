"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pathToTab, sendGAEvent, setUserProperties } from "@/lib/analytics";
import { useDueDateStore } from "@/store/useDueDateStore";

export function PageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    useDueDateStore.getState().refreshWeekIfNeeded();
    const { dueDate, currentPregnancyWeek, cohortJoinWeek } =
      useDueDateStore.getState();

    setUserProperties({
      due_date_set: dueDate !== null,
      current_pregnancy_week: currentPregnancyWeek ?? undefined,
      cohort_join_week: cohortJoinWeek ?? undefined,
    });

    sendGAEvent("page_view", { page_path: pathname });

    const tab = pathToTab(pathname);
    if (tab) sendGAEvent("axis_enter", { tab });
  }, [pathname]);

  return null;
}

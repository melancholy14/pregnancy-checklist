"use client";

import { calcPregnancyWeek } from "@/lib/week-calculator";
import { BRAND_PHASE, CREATOR_DUE_DATE } from "@/lib/constants";

export function CreatorWeekBadge() {
  const dueDate = new Date(CREATOR_DUE_DATE);

  if (BRAND_PHASE === "pregnancy") {
    const week = calcPregnancyWeek(dueDate);
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        <span aria-hidden="true">🤰</span> 현재 <span className="font-semibold text-foreground">임신 {week}주차</span>
      </p>
    );
  }

  if (BRAND_PHASE === "postpartum") {
    const today = new Date();
    const diffDays = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / 86400000),
    );
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        <span aria-hidden="true">👶</span> 현재 <span className="font-semibold text-foreground">출산 D+{diffDays}일</span>
      </p>
    );
  }

  // parenting phase
  const today = new Date();
  const diffMonths =
    (today.getFullYear() - dueDate.getFullYear()) * 12 +
    (today.getMonth() - dueDate.getMonth());
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      <span aria-hidden="true">👶</span> 현재 <span className="font-semibold text-foreground">육아 {Math.max(1, diffMonths)}개월차</span>
    </p>
  );
}

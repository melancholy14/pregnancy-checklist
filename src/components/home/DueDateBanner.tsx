"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useDueDateStore } from "@/store/useDueDateStore";
import { Card, CardContent } from "@/components/ui/card";

export function DueDateBanner() {
  const { dueDate } = useDueDateStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || dueDate) return null;

  return (
    <Link href="/" className="no-underline block mb-4">
      <Card className="rounded-xl border border-[#FFF4D4]/50 bg-[#FFF4D4]/20 hover:bg-[#FFF4D4]/30 transition-colors">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFF4D4] flex items-center justify-center shrink-0">
            <Calendar size={18} color="#8B7520" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#8B7520]">
              예정일을 입력하면 나에게 맞는 정보를 볼 수 있어요
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

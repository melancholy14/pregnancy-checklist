"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardCardProps {
  icon: string;
  title: string;
  href: string;
  color: string;
  children: React.ReactNode;
  cta?: string;
}

export function DashboardCard({
  icon,
  title,
  href,
  color,
  children,
  cta = "자세히 보기",
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="no-underline block"
    >
      <Card className="rounded-2xl border border-black/4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 h-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="space-y-1 mb-3 min-h-[40px]">{children}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{cta}</span>
            <ChevronRight size={12} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

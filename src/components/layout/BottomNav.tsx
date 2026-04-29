"use client";

import { Home, ListChecks, Users, Video, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { path: "/", icon: Home, label: "홈", match: "exact" as const },
    { path: "/checklist", icon: ListChecks, label: "체크리스트", match: "prefix" as const },
    { path: "/baby-fair", icon: Users, label: "베이비페어", match: "exact" as const },
    { path: "/videos", icon: Video, label: "영상", match: "exact" as const },
    { path: "/articles", icon: FileText, label: "정보", match: "prefix" as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/4 px-2 py-2 bottom-nav-safe z-50">
      <div className="max-w-2xl mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.match === "prefix"
              ? pathname === item.path || pathname.startsWith(`${item.path}/`)
              : pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-pastel-pink/40 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-foreground" : "text-muted-foreground"} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

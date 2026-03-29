"use client";

import { Home, ListChecks, Calendar, Users, Scale, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/checklist", icon: ListChecks, label: "체크리스트" },
    { path: "/timeline", icon: Calendar, label: "타임라인" },
    { path: "/baby-fair", icon: Users, label: "베이비페어" },
    { path: "/weight", icon: Scale, label: "체중" },
    { path: "/videos", icon: Video, label: "영상" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-2 py-2 z-50" style={{ boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)" }}>
      <div className="max-w-screen-xl mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                isActive
                  ? "bg-[#FFD6E0] text-[#4A4A4A]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

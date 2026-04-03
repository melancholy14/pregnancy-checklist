"use client";

import { Home, Calendar, Users, Scale, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/timeline", icon: Calendar, label: "타임라인" },
    { path: "/baby-fair", icon: Users, label: "베이비페어" },
    { path: "/weight", icon: Scale, label: "체중" },
    { path: "/videos", icon: Video, label: "영상" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/4 px-2 py-2 z-50">
      <div className="max-w-7xl mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-[#FFD4DE]/40 text-[#3D4447]"
                  : "text-[#9CA0A4] hover:text-[#3D4447]"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { useSearchStore } from "@/store/useSearchStore";

export function StickyHeader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const openSearch = useSearchStore((s) => s.open);

  useEffect(() => {
    if (pathname === "/") return;
    const handleScroll = () => {
      const current = window.scrollY;
      setVisible(current < lastScrollY.current || current < 44);
      setScrolled(current > 0);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // 홈 페이지에서는 숨김 (히어로 영역이 있으므로)
  if (pathname === "/") return null;

  return (
    <header
      className={`sticky top-0 z-40 h-11 bg-white/90 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "border-b border-black/6" : ""
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-2xl mx-auto h-full flex items-center gap-2 px-4">
        <Image
          src="/home.png"
          alt=""
          width={20}
          height={20}
          className="rounded-sm"
        />
        <span className="text-sm font-medium">출산 준비 체크리스트</span>
        <button
          type="button"
          onClick={openSearch}
          className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="검색"
        >
          <Search size={18} />
        </button>
      </div>
    </header>
  );
}

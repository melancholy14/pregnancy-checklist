"use client";

import dynamic from "next/dynamic";
import { useSearchStore } from "@/store/useSearchStore";
import type { ArticleMeta } from "@/types/article";

// 검색 모달은 첫 클릭 전까지 hydrate 안 함 — fuse.js(~17KB) + timeline JSON(~17KB) +
// 모달 코드를 초기 번들에서 분리. 모달 가벼운 코드도 isOpen일 때만 마운트.
const SearchModal = dynamic(
  () => import("./SearchModal").then((m) => ({ default: m.SearchModal })),
  { ssr: false },
);

export function SearchModalGate({ articles }: { articles: ArticleMeta[] }) {
  const isOpen = useSearchStore((s) => s.isOpen);
  if (!isOpen) return null;
  return <SearchModal articles={articles} />;
}

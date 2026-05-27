import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "이동 중 - 정보 & 가이드",
  description: "영상 페이지는 폐기되고 /articles로 이전됐어요.",
  alternates: { canonical: `${BASE_URL}/articles` },
  robots: { index: false, follow: false },
  other: { refresh: "0;url=/articles" },
};

export default function VideosRedirectPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-center">
      <meta httpEquiv="refresh" content="0;url=/articles" />
      <p className="text-sm text-muted-foreground">
        영상 페이지는 폐기됐어요. <Link href="/articles" className="underline">/articles</Link>로 이동합니다.
      </p>
    </main>
  );
}

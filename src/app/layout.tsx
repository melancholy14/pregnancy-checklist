import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Poppins } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { ConsentGatedScripts } from "@/components/consent/ConsentGatedScripts";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";
import { SearchModal } from "@/components/search/SearchModal";
import { getAllArticles } from "@/lib/articles";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "출산 준비 체크리스트 - 초산 개발자가 직접 만든 임신 주차별 가이드",
  description: "답답해서 직접 만들었습니다. 임신 주차별 체크리스트, 입원가방, 베이비페어, 체중관리까지.",
  openGraph: {
    title: "출산 준비 체크리스트 - 초산 개발자가 직접 만든 임신 주차별 가이드",
    description: "답답해서 직접 만들었습니다. 임신 주차별 체크리스트, 입원가방, 베이비페어, 체중관리까지.",
    url: BASE_URL,
    siteName: "출산 준비 체크리스트",
    locale: "ko_KR",
    type: "website",
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const articles = getAllArticles();

  return (
    <html lang="ko" className={poppins.className}>
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID} />
        )}
      </head>
      <body>
        <StickyHeader />
        <div className="min-h-screen max-w-2xl mx-auto">
          {children}
          <Footer />
          <BottomNav />
        </div>
        <Toaster position="top-center" richColors theme="light" />
        <ConsentGatedScripts />
        <CookieConsentBanner />
        <PageviewTracker />
        <SearchModal articles={articles} />
      </body>
    </html>
  );
}

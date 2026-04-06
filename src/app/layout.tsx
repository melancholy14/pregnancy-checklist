import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";
import { Poppins } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "출산 준비 체크리스트 - 임신 주차별 준비 가이드",
  description: "임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요.",
  openGraph: {
    title: "출산 준비 체크리스트 - 임신 주차별 준비 가이드",
    description: "임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요.",
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
  return (
    <html lang="ko">
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID} />
        )}
      </head>
    <html lang="ko" className={poppins.className}>
      <body>
        <StickyHeader />
        <div className="min-h-screen max-w-2xl mx-auto">
          {children}
          <Footer />
          <BottomNav />
        </div>
        <Toaster position="top-center" richColors />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}

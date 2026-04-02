import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "출산 준비 체크리스트",
  description: "임산부를 위한 출산 준비 체크리스트, 주차별 타임라인, 베이비페어 일정 제공",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen">
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

import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { ConsentGatedScripts } from "@/components/consent/ConsentGatedScripts";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";
import { OnboardingBannerProvider } from "@/components/providers/OnboardingBannerProvider";
import { MigrationFlushClient } from "@/components/providers/MigrationFlushClient";
import { SearchModalGate } from "@/components/search/SearchModalGate";
import { getAllArticles } from "@/lib/articles";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";
import "./globals.css";

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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "출산 준비 체크리스트",
  url: BASE_URL,
  alternateName: "뿌까뽀까 출산 준비",
};

// TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요 — review.md §4 항목 1 옵션 A 컨텍스트
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "뿌까뽀까",
  url: `${BASE_URL}/about`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const articles = getAllArticles();

  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID} />
        )}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            {/* lazyOnload로 미루는 gtag.js와 page_view ping 핸드셰이크 사전 워밍 */}
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{if(localStorage.getItem('cookie-consent')==='accepted'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}}catch(e){}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}',{send_page_view:false});`,
              }}
            />
          </>
        )}
      </head>
      <body>
        <StickyHeader />
        <div className="min-h-screen max-w-2xl mx-auto">
          <OnboardingBannerProvider />
          {children}
          <Footer />
          <BottomNav />
        </div>
        <Toaster position="top-center" richColors theme="light" visibleToasts={3} />
        <MigrationFlushClient />
        <ConsentGatedScripts />
        <CookieConsentBanner />
        <PageviewTracker />
        <SearchModalGate articles={articles} />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}

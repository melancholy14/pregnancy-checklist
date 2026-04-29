import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";
import { CreatorWeekBadge } from "@/app/about/CreatorWeekBadge";

export const metadata: Metadata = {
  title: "만든 사람 뿌까뽀까 - 출산 준비 체크리스트",
  description:
    "초산 임산부이자 IT 개발자 뿌까뽀까가 직접 만든 출산 준비 체크리스트. 임신 주차별로 겪은 경험과 공신력 있는 자료를 바탕으로 콘텐츠를 작성합니다.",
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
  openGraph: {
    title: "만든 사람 뿌까뽀까 - 출산 준비 체크리스트",
    description:
      "초산 임산부이자 IT 개발자 뿌까뽀까가 직접 만든 출산 준비 체크리스트. 임신 주차별로 겪은 경험과 공신력 있는 자료를 바탕으로 콘텐츠를 작성합니다.",
    url: `${BASE_URL}/about`,
  },
};

function AboutJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${BASE_URL}/about#creator`,
        name: "뿌까뽀까",
        url: `${BASE_URL}/about`,
        description:
          "초산 임산부이자 IT 개발자. 임신 준비 과정에서 정보가 흩어져 있는 문제를 직접 해결하기 위해 출산 준비 체크리스트를 개발·운영합니다.",
        knowsAbout: [
          "임신 준비",
          "출산 준비",
          "임산부 건강",
          "웹 개발",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "출산 준비 체크리스트",
        description:
          "임신 주차별 체크리스트, 체중관리, 베이비페어 일정, 정보글까지 한곳에서 관리하는 출산 준비 도구",
        publisher: { "@id": `${BASE_URL}/about#creator` },
        inLanguage: "ko-KR",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <AboutJsonLd />
      <div className="pt-8 max-w-lg mx-auto">
        <h1 className="text-center text-xl font-bold mb-2">만든 사람</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">
          뿌까뽀까
        </p>

        {/* 소개 */}
        <section
          className="rounded-xl bg-pastel-yellow/10 border border-pastel-yellow/30 p-5 mb-6"
          aria-label="소개"
        >
          <h2 className="text-base font-semibold mb-3">안녕하세요, 뿌까뽀까입니다</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            IT 업계에서 일하는 개발자이자 초산 임산부예요.
            첫 아이를 준비하면서 검색해보니 광고 블로그, 맘카페, 병원
            안내지&hellip; 다 흩어져 있고, 뭘 언제 해야 하는지 한눈에 보이는 게
            없었습니다.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            답답해서 직접 만들기로 했어요.
            주차별로 정리하고, 제가 실제로 쓰면서 계속 고치고 있습니다.
          </p>
          <CreatorWeekBadge />
        </section>

        {/* 콘텐츠 작성 원칙 */}
        <section className="mb-6" aria-label="콘텐츠 작성 원칙">
          <h2 className="text-base font-semibold mb-3">콘텐츠 작성 원칙</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2 leading-relaxed">
              <span className="shrink-0" aria-hidden="true">1.</span>
              <span>
                <strong className="text-foreground">직접 경험한 것만 씁니다.</strong>{" "}
                임신 주차를 지나며 실제로 겪은 검사, 증상, 준비 과정을 기록합니다.
                아직 경험하지 못한 주제는 출산 후에 작성할 예정입니다.
              </span>
            </li>
            <li className="flex gap-2 leading-relaxed">
              <span className="shrink-0" aria-hidden="true">2.</span>
              <span>
                <strong className="text-foreground">공신력 있는 자료를 근거로 합니다.</strong>{" "}
                질병관리청, 대한산부인과학회, 건강보험심사평가원 등
                공공기관·학회 자료를 참고하고, 글 하단에 출처를 밝힙니다.
              </span>
            </li>
            <li className="flex gap-2 leading-relaxed">
              <span className="shrink-0" aria-hidden="true">3.</span>
              <span>
                <strong className="text-foreground">의학 정보에는 반드시 면책 안내를 붙입니다.</strong>{" "}
                모든 정보글 상단에 &ldquo;담당 의료진과 상담하세요&rdquo; 안내를
                표시하며, 개인 경험이 의학적 조언을 대체하지 않음을 명시합니다.
              </span>
            </li>
          </ul>
        </section>

        {/* 앞으로의 계획 */}
        <section className="mb-6" aria-label="앞으로의 계획">
          <h2 className="text-base font-semibold mb-3">앞으로의 계획</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            출산하면 산후조리, 신생아 케어, 예방접종 트래커까지 확장 예정입니다.
            제가 직접 겪는 과정을 그때그때 기록하면서 콘텐츠를 늘려갈 계획이에요.
          </p>
        </section>

        {/* 데이터 안내 */}
        <section className="mb-6" aria-label="데이터 저장 안내">
          <h2 className="text-base font-semibold mb-3">데이터 저장 안내</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            본 서비스는 별도의 회원가입이나 로그인 없이 이용 가능합니다. 체크
            상태, 체중 기록 등 모든 사용자 데이터는 사용 중인 브라우저의 로컬
            저장소(LocalStorage)에만 저장되며, 외부 서버로 전송되지 않습니다.
          </p>
        </section>

        {/* 의료 면책 */}
        <section className="mb-6" aria-label="의료 면책 안내">
          <h2 className="text-base font-semibold mb-3">의료 면책 안내</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            본 서비스는 의료적 조언을 제공하지 않습니다. 체크리스트와 타임라인의
            내용은 일반적인 출산 준비 정보를 정리한 것이며, 개인의 건강 상태에
            따라 다를 수 있습니다. 정확한 의료 정보는 담당 의료진과 상담하시기
            바랍니다.
          </p>
        </section>

        {/* 의견 보내기 */}
        <section aria-label="의견 보내기">
          <h2 className="text-base font-semibold mb-3">의견 보내기</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            혼자 만들다 보니 놓치는 것도 많아요. 불편한 점이나 추가되면 좋겠는
            기능이 있다면 알려주세요.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label="의견 보내기 페이지로 이동"
          >
            의견 보내기
          </Link>
        </section>
      </div>
    </div>
  );
}

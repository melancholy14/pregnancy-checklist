import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";
import { CreatorWeekBadge } from "@/app/about/CreatorWeekBadge";

export const metadata: Metadata = {
  title: "만든 사람 - 출산 준비 체크리스트",
  description:
    "초산 임신 중인 개발자가 답답해서 직접 만든 출산 준비 체크리스트. 왜 만들었는지, 어떻게 쓰고 있는지 이야기합니다.",
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
  openGraph: {
    title: "만든 사람 - 출산 준비 체크리스트",
    description:
      "초산 임신 중인 개발자가 답답해서 직접 만든 출산 준비 체크리스트. 왜 만들었는지, 어떻게 쓰고 있는지 이야기합니다.",
    url: `${BASE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 max-w-lg mx-auto">
        <h1 className="text-center text-xl font-bold mb-8">만든 사람</h1>

        {/* 왜 만들었나 */}
        <section
          className="rounded-xl bg-[#FFF4D4]/10 border border-[#FFF4D4]/30 p-5 mb-6"
          aria-label="왜 만들었나"
        >
          <h2 className="text-base font-semibold mb-3">왜 만들었나</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            첫 아이를 준비하면서 검색해보니 광고 블로그, 맘카페, 병원
            안내지&hellip; 다 흩어져 있고, 뭘 언제 해야 하는지 한눈에 보이는 게
            없었습니다.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            개발자라 직접 만들기로 했어요. 주차별로 정리하고, 실제로 쓰면서 계속
            고치고 있습니다.
          </p>
        </section>

        {/* 현재 상태 */}
        <section className="mb-6" aria-label="현재 상태">
          <h2 className="text-base font-semibold mb-3">현재 상태</h2>
          <CreatorWeekBadge />
        </section>

        {/* 앞으로의 계획 */}
        <section className="mb-6" aria-label="앞으로의 계획">
          <h2 className="text-base font-semibold mb-3">앞으로의 계획</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            출산하면 산후조리, 신생아 케어, 예방접종 트래커까지 확장 예정입니다.
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

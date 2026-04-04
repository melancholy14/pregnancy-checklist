import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "출산 가방 필수 준비물 총정리 - 출산 준비 체크리스트",
  description:
    "출산 가방에 꼭 넣어야 할 준비물을 산모용, 아기용, 서류로 나눠 정리했습니다. 실제 필요한 것만 담은 미니멀 가이드.",
  alternates: {
    canonical: `${BASE_URL}/guides/hospital-bag`,
  },
  openGraph: {
    title: "출산 가방 필수 준비물 총정리",
    description:
      "출산 가방에 꼭 넣어야 할 준비물을 산모용, 아기용, 서류로 나눠 정리했습니다.",
    url: `${BASE_URL}/guides/hospital-bag`,
  },
};

export default function HospitalBagGuidePage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <article className="max-w-2xl mx-auto pt-8 prose prose-sm">
        <h1 className="text-center text-xl mb-2">
          출산 가방 필수 준비물 총정리
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          실제로 필요한 것만 담은 미니멀 가이드
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed">
          출산 가방은 보통 <strong>임신 32~33주</strong>부터 준비하기 시작하고,{" "}
          <strong>36주까지 완료</strong>하는 것을 권장합니다. 인터넷에 돌아다니는
          리스트는 수십 가지지만, 실제로 병원에서 쓰는 물품은 생각보다 적습니다.
          여기서는 &ldquo;꼭 필요한 것&rdquo;과 &ldquo;있으면 좋은 것&rdquo;을
          구분해서 정리했습니다.
        </p>

        <h2 className="text-base mt-8 mb-3">산모용 필수 준비물</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          병원 입원 기간은 자연분만 2~3일, 제왕절개 4~5일 정도입니다. 이 기간
          동안 편하게 지낼 수 있는 물품 위주로 챙기세요.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>
            <strong>산모용 잠옷 2~3벌</strong> — 수유가 편한 앞트임 디자인이
            좋습니다. 병원에서 제공하는 환자복이 불편할 수 있으니 미리
            준비하세요.
          </li>
          <li>
            <strong>산모 속옷 5~6장</strong> — 출산 후 오로가 나오므로 일회용
            속옷이 편리합니다.
          </li>
          <li>
            <strong>수유 브라 2~3개</strong> — 출산 직후부터 모유수유를 시작하므로
            반드시 필요합니다.
          </li>
          <li>
            <strong>산모 패드</strong> — 병원에서 제공하기도 하지만, 넉넉하게
            준비하는 것이 안심됩니다.
          </li>
          <li>
            <strong>슬리퍼</strong> — 병실과 복도를 오갈 때 필요합니다. 미끄럽지
            않은 것으로 준비하세요.
          </li>
          <li>
            <strong>세면도구</strong> — 칫솔, 치약, 세안제, 보습 로션 등 기본
            세면용품을 챙기세요.
          </li>
        </ul>

        <h2 className="text-base mt-8 mb-3">있으면 좋은 산모 용품</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>
            <strong>유두 보호 크림</strong> — 수유 초기 유두 갈라짐 방지에 큰
            도움이 됩니다.
          </li>
          <li>
            <strong>개인 물컵/빨대컵</strong> — 진통 중이나 수술 후 누워서 물
            마시기 편합니다.
          </li>
          <li>
            <strong>간식 및 에너지바</strong> — 진통이 길어질 경우를 대비해
            가벼운 간식을 준비하세요.
          </li>
          <li>
            <strong>헤어밴드/머리끈</strong> — 긴 머리라면 세수나 수유 시
            유용합니다.
          </li>
          <li>
            <strong>립밤</strong> — 병원 건조한 환경에서 입술이 트기 쉽습니다.
          </li>
        </ul>

        <h2 className="text-base mt-8 mb-3">아기용 준비물</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          병원에서 대부분의 아기 용품을 제공하지만, 퇴원 시 꼭 필요한 것들이
          있습니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>
            <strong>퇴원복 (아기용)</strong> — 계절에 맞는 배냇저고리 또는
            우주복을 준비하세요.
          </li>
          <li>
            <strong>속싸개</strong> — 신생아는 감싸주면 안정감을 느낍니다. 퇴원
            시에도 필요합니다.
          </li>
          <li>
            <strong>카시트</strong> — 퇴원 시 자가용을 이용한다면 카시트는
            법적으로 필수입니다. 미리 차량에 설치해두세요.
          </li>
        </ul>

        <h2 className="text-base mt-8 mb-3">서류 및 필수품</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          서류는 깜빡하기 쉬우니 가방에 미리 넣어두세요.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>
            <strong>신분증</strong> — 입원 수속에 반드시 필요합니다.
          </li>
          <li>
            <strong>건강보험증/보험 카드</strong> — 실비 청구를 위해 필요합니다.
          </li>
          <li>
            <strong>산모수첩</strong> — 산전 검사 기록이 담겨 있어 분만 시
            참고됩니다.
          </li>
          <li>
            <strong>휴대폰 충전기 + 긴 케이블</strong> — 병실 콘센트 위치가
            침대에서 먼 경우가 많습니다.
          </li>
        </ul>

        <h2 className="text-base mt-8 mb-3">준비 시기별 체크포인트</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>
            <strong>32~33주</strong> — 산모 잠옷, 속옷, 수유 브라, 산모 패드 등
            의류 위주로 시작
          </li>
          <li>
            <strong>34주</strong> — 세면도구, 보습제, 개인용품 추가
          </li>
          <li>
            <strong>35주</strong> — 서류, 충전기, 퇴원복(산모+아기) 넣기
          </li>
          <li>
            <strong>36주</strong> — 최종 점검. 간식, 에너지바 등 유통기한 있는
            것은 마지막에 추가
          </li>
        </ul>

        <div className="mt-8 p-4 rounded-2xl bg-[#FFD4DE]/10 border border-[#FFD4DE]/30">
          <p className="text-sm text-muted-foreground leading-relaxed m-0">
            <strong>팁:</strong> 병원마다 제공하는 물품이 다릅니다. 분만 병원에
            사전에 문의해서 제공 물품 목록을 확인하면 불필요한 짐을 줄일 수
            있습니다. 분만실 가방 규정(크기 제한 등)도 함께 확인하세요.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/timeline"
            className="text-sm text-[#6B5A80] underline hover:text-[#6B5A80]/80"
          >
            → 주차별 타임라인에서 전체 준비 일정 확인하기
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-muted/30 border border-black/4">
          <p className="text-xs text-muted-foreground leading-relaxed m-0">
            본 가이드는 일반적인 출산 준비 정보를 정리한 것이며, 개인의 건강
            상태에 따라 다를 수 있습니다. 정확한 의료 정보는 담당 의료진과
            상담하시기 바랍니다.
          </p>
        </div>
      </article>
    </div>
  );
}

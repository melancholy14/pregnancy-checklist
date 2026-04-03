import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개 - 출산 준비 체크리스트",
  description: "출산 준비 체크리스트 서비스의 소개와 연락처입니다.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-2xl mx-auto pt-8 prose prose-sm">
        <h1 className="text-center text-xl mb-8">서비스 소개</h1>

        <h2 className="text-base mt-6 mb-3">출산 준비 체크리스트란?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          &quot;출산 준비 체크리스트&quot;는 임산부와 예비 부모를 위한 출산 준비 도우미
          서비스입니다. 임신 주차에 맞춰 병원 준비, 출산 가방, 신생아 준비물, 행정 서류
          등 꼭 필요한 항목들을 체크리스트로 정리해 드립니다.
        </p>

        <h2 className="text-base mt-6 mb-3">주요 기능</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>
            <strong>주차별 타임라인 & 체크리스트</strong> — 임신 4주부터 40주까지,
            주차별로 준비해야 할 항목을 한눈에 확인하고 체크할 수 있습니다.
          </li>
          <li>
            <strong>베이비페어 일정</strong> — 전국 베이비페어 일정, 장소, 공식
            홈페이지 링크를 모아 제공합니다.
          </li>
          <li>
            <strong>체중 기록</strong> — 임신 중 체중 변화를 기록하고 그래프로
            확인할 수 있습니다.
          </li>
          <li>
            <strong>영상 큐레이션</strong> — 임산부 운동, 출산 준비, 신생아 케어 등
            유용한 영상을 모아 제공합니다.
          </li>
        </ul>

        <h2 className="text-base mt-6 mb-3">데이터 저장 안내</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 별도의 회원가입이나 로그인 없이 이용 가능합니다. 체크 상태, 체중
          기록 등 모든 사용자 데이터는 사용 중인 브라우저의 로컬 저장소(LocalStorage)에만
          저장되며, 외부 서버로 전송되지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">의료 면책 안내</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 의료적 조언을 제공하지 않습니다. 체크리스트와 타임라인의 내용은
          일반적인 출산 준비 정보를 정리한 것이며, 개인의 건강 상태에 따라 다를 수
          있습니다. 정확한 의료 정보는 담당 의료진과 상담하시기 바랍니다.
        </p>

        <h2 className="text-base mt-6 mb-3">연락처</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          서비스 이용 중 문의사항이나 개선 의견이 있으시면 아래 이메일로 연락해 주세요.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>이메일: melancholy8914@gmail.com</li>
        </ul>
      </div>
    </div>
  );
}

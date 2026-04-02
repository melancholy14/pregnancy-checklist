import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 출산 준비 체크리스트",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-2xl mx-auto pt-8 prose prose-sm">
        <h1 className="text-center text-xl mb-8">개인정보처리방침</h1>

        <p className="text-muted-foreground text-sm mb-6">시행일: 2026년 4월 1일</p>

        <h2 className="text-base mt-6 mb-3">1. 수집하는 정보</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 별도의 회원가입 없이 이용 가능하며, 서버에 개인정보를 저장하지 않습니다.
          사용자가 입력하는 출산 예정일, 체크리스트 상태, 체중 기록 등은 사용자 브라우저의
          LocalStorage에만 저장되며, 서비스 운영자는 이 데이터에 접근할 수 없습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">2. Google Analytics 4 (GA4)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 서비스 개선 및 사용 패턴 분석을 위해 Google Analytics 4를 사용합니다.
          GA4는 쿠키를 사용하여 익명화된 사용 데이터(페이지 방문, 클릭 이벤트 등)를 수집합니다.
          수집된 데이터에는 개인을 식별할 수 있는 정보가 포함되지 않습니다.
          Google의 개인정보 처리에 대한 자세한 내용은{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B5A80] underline"
          >
            Google 개인정보처리방침
          </a>
          을 참조하세요.
        </p>

        <h2 className="text-base mt-6 mb-3">3. Google AdSense</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 광고 게재를 위해 Google AdSense를 사용할 수 있습니다.
          AdSense는 쿠키를 사용하여 관심 기반 광고를 제공합니다.
          사용자는 Google 광고 설정에서 맞춤 광고를 비활성화할 수 있습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">4. LocalStorage 사용</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 사용자 편의를 위해 브라우저의 LocalStorage를 사용합니다.
          저장되는 항목: 출산 예정일, 체크리스트 체크 상태 및 커스텀 항목,
          타임라인 커스텀 항목, 체중 기록. 이 데이터는 사용자 브라우저에만 저장되며,
          브라우저 데이터를 삭제하면 함께 삭제됩니다.
          다른 기기나 브라우저와 동기화되지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">5. 데이터 삭제</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          브라우저의 사이트 데이터를 삭제하면 모든 LocalStorage 데이터가 삭제됩니다.
          GA4/AdSense 관련 쿠키는 브라우저 쿠키 설정에서 관리할 수 있습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">6. 문의</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          개인정보 처리에 관한 문의사항은 서비스 운영자에게 연락해 주시기 바랍니다.
        </p>
      </div>
    </div>
  );
}

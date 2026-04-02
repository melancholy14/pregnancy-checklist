import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 이용약관 - 출산 준비 체크리스트",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-2xl mx-auto pt-8 prose prose-sm">
        <h1 className="text-center text-xl mb-8">서비스 이용약관</h1>

        <p className="text-muted-foreground text-sm mb-6">시행일: 2026년 4월 1일</p>

        <h2 className="text-base mt-6 mb-3">1. 서비스 목적</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스(&quot;출산 준비 체크리스트&quot;)는 임산부의 출산 준비를 돕기 위한
          정보 제공 도구입니다. 체크리스트, 타임라인, 베이비페어 일정, 체중 기록,
          영상 큐레이션 기능을 무료로 제공합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">2. 의료 면책</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스에서 제공하는 모든 정보(체크리스트 항목, 타임라인, 권장 체중 범위 등)는
          일반적인 참고 정보이며, 의학적 진단이나 치료를 대체하지 않습니다.
          건강 관련 결정은 반드시 담당 의사와 상담 후 진행하시기 바랍니다.
          서비스 운영자는 본 서비스의 정보를 기반으로 한 결정에 대해 책임을 지지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">3. 데이터 저장 및 소실</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          사용자 데이터(예정일, 체크 상태, 체중 기록 등)는 사용자 브라우저의
          LocalStorage에만 저장됩니다. 서비스 운영자는 이 데이터에 대한 백업을 제공하지 않으며,
          브라우저 데이터 삭제, 기기 변경, 시크릿 모드 사용 등으로 인한 데이터 소실에 대해
          책임을 지지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">4. 베이비페어 정보</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          베이비페어 일정, 장소, 입장료 등의 정보는 공식 소스를 기반으로 수집되지만,
          변경될 수 있습니다. 정확한 정보는 각 행사의 공식 홈페이지를 통해 확인하시기 바랍니다.
        </p>

        <h2 className="text-base mt-6 mb-3">5. 외부 링크 및 콘텐츠</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 YouTube 영상, 베이비페어 공식 사이트 등 외부 링크를 포함할 수 있습니다.
          외부 사이트의 콘텐츠, 개인정보 처리, 서비스 품질에 대해 책임을 지지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">6. 서비스 변경 및 중단</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          서비스 운영자는 사전 고지 없이 서비스의 전부 또는 일부를 변경, 중단할 수 있습니다.
          서비스 중단으로 인한 데이터 소실에 대해 책임을 지지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">7. 약관 변경</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 약관은 서비스 개선에 따라 변경될 수 있으며, 변경 시 서비스 내 공지합니다.
        </p>
      </div>
    </div>
  );
}

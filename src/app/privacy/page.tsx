import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 출산 준비 체크리스트",
  description: "출산 준비 체크리스트 서비스의 개인정보처리방침입니다.",
  alternates: {
    canonical: `${BASE_URL}/privacy`,
  },
  openGraph: {
    title: "개인정보처리방침 - 출산 준비 체크리스트",
    description: "출산 준비 체크리스트 서비스의 개인정보처리방침입니다.",
    url: `${BASE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 prose prose-sm">
        <h1 className="text-center text-xl mb-8">개인정보처리방침</h1>

        <p className="text-muted-foreground text-sm mb-6">시행일: 2026년 4월 1일</p>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          &quot;출산 준비 체크리스트&quot;(이하 &quot;본 서비스&quot;)는 이용자의 개인정보를
          중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
          본 개인정보처리방침은 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로
          이용되고 있으며, 어떠한 보호 조치가 취해지고 있는지 알려드립니다.
        </p>

        <h2 className="text-base mt-6 mb-3">1. 개인정보처리자 및 개인정보 보호책임자</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스의 개인정보 처리에 관한 업무를 총괄하는 책임자는 다음과 같습니다.
          본 서비스는 개인이 운영하는 서비스로, 운영자가 개인정보 보호책임자를 겸임합니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>서비스명: 출산 준비 체크리스트</li>
          <li>운영자(개인정보 보호책임자): 개인 운영</li>
          <li>이메일: melancholy8914@gmail.com</li>
        </ul>

        <h2 className="text-base mt-6 mb-3">2. 수집하는 개인정보 항목 및 수집 방법</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 별도의 회원가입 없이 이용 가능하며, 서버에 개인정보를 저장하지 않습니다.
          사용자가 입력하는 출산 예정일, 체크리스트 상태, 체중 기록 등은 사용자 브라우저의
          LocalStorage에만 저장되며, 서비스 운영자는 이 데이터에 접근할 수 없습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          다만, 서비스 이용 과정에서 다음과 같은 정보가 자동으로 생성되어 수집될 수 있습니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>접속 기기 정보(기기 유형, 운영체제, 브라우저 종류)</li>
          <li>접속 로그(접속 일시, 페이지 방문 기록, 클릭 이벤트)</li>
          <li>IP 주소(Google Analytics 4에서는 기본적으로 IP 익명화가 적용되어 전체 IP 주소가 저장되지 않음)</li>
        </ul>

        <h2 className="text-base mt-6 mb-3">3. 개인정보의 처리 목적</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          수집된 정보는 다음의 목적으로만 처리되며, 자동 수집 정보의 처리 근거는
          서비스 제공 및 개선을 위한 정당한 이익에 해당합니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>서비스 이용 통계 분석 및 서비스 개선(Google Analytics 4)</li>
          <li>광고 게재(Google AdSense)</li>
          <li>사용자 편의 기능 제공(LocalStorage를 통한 데이터 보관)</li>
        </ul>

        <h2 className="text-base mt-6 mb-3">4. 개인정보의 보유 및 이용 기간</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          LocalStorage 데이터: 사용자가 브라우저 데이터를 삭제하거나 서비스 이용을
          중단할 때까지 보관됩니다. 서비스 운영자는 해당 데이터에 접근하거나 보관하지 않습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          Google Analytics 데이터: Google의 데이터 보관 정책에 따르며, 기본 보관 기간은
          14개월입니다. 자세한 사항은{" "}
          <a
            href="https://support.google.com/analytics/answer/7667196"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B5A80] underline"
          >
            Google Analytics 데이터 보관 정책
          </a>
          을 참조하세요.
        </p>

        <h2 className="text-base mt-6 mb-3">5. 제3자 제공 및 위탁</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 이용자의 개인정보를 제3자에게 직접 제공하지 않습니다.
          다만, 다음의 서비스를 통해 데이터 처리가 위탁됩니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>Google Analytics 4 (Google LLC): 서비스 이용 통계 분석 — 익명화된 접속 및 이용 데이터</li>
          <li>Google AdSense (Google LLC): 맞춤형 광고 게재 — 쿠키 기반 관심사 데이터</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          위 서비스를 통해 수집된 데이터는 해외(미국 등)로 이전될 수 있습니다.
          Google은 EU-미국 데이터 프라이버시 프레임워크 및 표준계약조항(SCC)을 통해
          적절한 보호 조치를 적용하고 있습니다.
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

        <h2 className="text-base mt-6 mb-3">6. 쿠키 및 LocalStorage 사용</h2>
        <h3 className="text-sm font-semibold mt-4 mb-2">6-1. 쿠키(Cookie)</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 Google Analytics 4 및 Google AdSense 운영을 위해 쿠키를 사용합니다.
          쿠키는 이용자의 브라우저에 저장되는 작은 텍스트 파일로, 이용자는 브라우저 설정을
          통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만, 쿠키를 거부할 경우
          맞춤형 광고가 제공되지 않을 수 있습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          주요 쿠키 유형:
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-1">
          <li>_ga, _ga_* (Google Analytics): 이용자 식별용, 보관기간 최대 2년</li>
          <li>__gads, __gpi (Google AdSense): 광고 게재 및 맞춤 광고용, 보관기간 최대 13개월</li>
        </ul>
        <h3 className="text-sm font-semibold mt-4 mb-2">6-2. LocalStorage</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 사용자 편의를 위해 브라우저의 LocalStorage를 사용합니다.
          저장되는 항목: 출산 예정일, 체크리스트 체크 상태 및 커스텀 항목,
          타임라인 커스텀 항목, 체중 기록. 이 데이터는 사용자 브라우저에만 저장되며,
          브라우저 데이터를 삭제하면 함께 삭제됩니다.
          다른 기기나 브라우저와 동기화되지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">7. 정보주체의 권리 및 행사 방법</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          이용자는 다음과 같은 권리를 행사할 수 있습니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>LocalStorage 데이터의 열람, 수정, 삭제: 브라우저 설정 또는 개발자 도구를 통해 직접 가능</li>
          <li>개인정보 처리정지 요구: 운영자 이메일(melancholy8914@gmail.com)로 요청 가능. 다만, 서비스 제공에 필수적인 쿠키의 경우 처리정지가 제한될 수 있습니다.</li>
          <li>쿠키 수집 거부: 브라우저 설정에서 쿠키 저장을 비활성화</li>
          <li>Google 맞춤 광고 비활성화:{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B5A80] underline"
            >
              Google 광고 설정
            </a>
            에서 설정 변경 가능
          </li>
          <li>Google Analytics 수집 거부:{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B5A80] underline"
            >
              Google Analytics 차단 브라우저 부가기능
            </a>
            설치
          </li>
        </ul>

        <h2 className="text-base mt-6 mb-3">8. 개인정보의 안전성 확보 조치</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 서버에 개인정보를 저장하지 않으므로, 서버 측 보안 조치 대상이 되는
          개인정보가 없습니다. 웹사이트는 HTTPS를 통해 암호화된 통신을 제공하며,
          LocalStorage에 저장된 데이터는 동일 출처 정책(Same-Origin Policy)에 의해 보호됩니다.
        </p>

        <h2 className="text-base mt-6 mb-3">9. 아동의 개인정보 보호</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 만 14세 미만 아동의 개인정보를 수집하지 않으며, 만 14세 미만 아동을
          대상으로 하지 않습니다. 만 14세 미만 아동이 서비스를 이용하는 경우,
          법정대리인의 동의가 필요합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">10. 개인정보처리방침의 변경</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있습니다.
          변경 시 시행일 최소 7일 전에 서비스 내 공지사항을 통해 안내합니다.
          중대한 변경 사항의 경우 시행일 최소 30일 전에 공지합니다.
          이전 버전의 개인정보처리방침은 본 페이지 하단에서 확인하실 수 있습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">11. 권익침해 구제 방법</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          개인정보 침해에 대한 신고나 상담은 아래 기관에 문의하실 수 있습니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>개인정보침해 신고센터 (한국인터넷진흥원): 118, privacy.kisa.or.kr</li>
          <li>개인정보 분쟁조정위원회: 1833-6972, kopico.go.kr</li>
          <li>대검찰청 사이버수사과: 1301, spo.go.kr</li>
          <li>경찰청 사이버수사국: 182, ecrm.police.go.kr</li>
        </ul>

        <h2 className="text-base mt-6 mb-3">12. 문의</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          개인정보 처리에 관한 문의사항은 아래 연락처로 문의해 주시기 바랍니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>이메일: melancholy8914@gmail.com</li>
        </ul>
      </div>
    </div>
  );
}

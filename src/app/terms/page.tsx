import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "서비스 이용약관 - 출산 준비 체크리스트",
  description: "출산 준비 체크리스트 서비스의 이용약관입니다.",
  alternates: {
    canonical: `${BASE_URL}/terms`,
  },
  openGraph: {
    title: "서비스 이용약관 - 출산 준비 체크리스트",
    description: "출산 준비 체크리스트 서비스의 이용약관입니다.",
    url: `${BASE_URL}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-2xl mx-auto pt-8 prose prose-sm">
        <h1 className="text-center text-xl mb-8">서비스 이용약관</h1>

        <p className="text-muted-foreground text-sm mb-6">시행일: 2026년 4월 1일</p>

        <h2 className="text-base mt-6 mb-3">제1조 (목적)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 약관은 &quot;출산 준비 체크리스트&quot;(이하 &quot;본 서비스&quot;)의 이용에 관한
          조건 및 절차, 운영자와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제2조 (정의)</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>&quot;본 서비스&quot;란 임산부의 출산 준비를 돕기 위해 제공되는 웹 기반 정보 제공 도구로, 체크리스트, 타임라인, 베이비페어 일정, 체중 기록, 영상 큐레이션 기능을 포함합니다.</li>
          <li>&quot;운영자&quot;란 본 서비스를 운영하는 개인을 의미합니다.</li>
          <li>&quot;이용자&quot;란 본 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 자를 의미합니다.</li>
        </ul>

        <h2 className="text-base mt-6 mb-3">제3조 (약관의 효력 및 변경)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 운영자는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위에서 본 약관을
          변경할 수 있으며, 변경된 약관은 시행일 최소 7일 전에 서비스 내 공지합니다.
          이용자에게 불리한 변경의 경우 최소 30일 전에 공지합니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ③ 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
          변경된 약관 시행일 이후에도 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 봅니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제4조 (이용계약의 성립)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 이용계약은 이용자가 본 서비스에 접속하여 본 약관에 동의하고 서비스를 이용함으로써 성립됩니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 본 서비스는 회원가입 절차가 없으므로, 서비스 이용 시 본 약관에 동의한 것으로 간주합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제5조 (서비스의 제공)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 본 서비스는 무료로 제공되며, 별도의 회원가입 없이 이용 가능합니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 서비스 제공 범위: 출산 준비 체크리스트, 주차별 타임라인, 베이비페어 일정 정보,
          체중 기록 관리, 영상 큐레이션
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ③ 본 서비스는 연중무휴 24시간 제공을 원칙으로 합니다.
          다만, 시스템 점검, 기술적 장애 등의 사유로 일시적으로 이용이 제한될 수 있습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제6조 (이용자의 의무)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          이용자는 다음 각 호의 행위를 하여서는 안 됩니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>서비스를 이용하여 타인에게 피해를 주는 행위</li>
          <li>서비스의 콘텐츠를 무단으로 복제, 배포, 상업적으로 이용하는 행위</li>
          <li>자동화된 수단(크롤링, 스크래핑 등)을 이용하여 서비스에 접근하는 행위</li>
          <li>기타 관련 법령에 위배되는 행위</li>
        </ul>

        <h2 className="text-base mt-6 mb-3">제7조 (의료 면책)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 본 서비스에서 제공하는 모든 정보(체크리스트 항목, 타임라인, 권장 체중 범위 등)는
          공개된 의학 자료를 참고하여 작성된 일반적인 참고 정보이며,
          의학적 진단이나 치료를 대체하지 않습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 건강 관련 결정은 반드시 담당 의사 또는 의료 전문가와 상담 후 진행하시기 바랍니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ③ 운영자는 본 서비스의 정보를 기반으로 한 이용자의 판단이나 행위에 대해
          어떠한 의료적·법적 책임도 지지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제8조 (데이터 저장 및 소실)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 이용자 데이터(예정일, 체크 상태, 체중 기록 등)는 이용자 브라우저의
          LocalStorage에만 저장됩니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 운영자는 이용자 데이터에 대한 백업을 제공하지 않으며,
          브라우저 데이터 삭제, 기기 변경, 시크릿(비공개) 모드 사용, 브라우저 업데이트 등으로
          인한 데이터 소실에 대해 책임을 지지 않습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ③ 이용자는 중요한 데이터를 별도로 기록해 둘 것을 권장합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제9조 (베이비페어 및 외부 정보)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 베이비페어 일정, 장소, 입장료 등의 정보는 공식 소스를 기반으로 수집되지만,
          실시간으로 변경될 수 있습니다. 정확한 정보는 각 행사의 공식 홈페이지를 통해
          반드시 확인하시기 바랍니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 본 서비스는 YouTube 영상, 베이비페어 공식 사이트 등 외부 링크를 포함할 수 있습니다.
          외부 사이트의 콘텐츠, 개인정보 처리, 서비스 가용성에 대해 운영자는 책임을 지지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제10조 (지식재산권)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 본 서비스의 디자인, 로고, 텍스트, 코드, 이미지 등 서비스에 포함된 일체의 콘텐츠에 대한
          지식재산권은 운영자에게 있습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 이용자는 운영자의 사전 서면 동의 없이 서비스의 콘텐츠를 복제, 배포, 전송,
          출판, 영리 목적으로 이용하거나 제3자에게 이용하게 할 수 없습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제11조 (보증의 부인)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 &quot;있는 그대로(AS IS)&quot; 제공되며, 운영자는 서비스에서 제공하는
          정보의 정확성, 완전성, 최신성, 신뢰성 또는 특정 목적에의 적합성에 대해
          명시적이든 묵시적이든 어떠한 보증도 하지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제12조 (손해배상의 제한)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 운영자는 무료로 제공하는 본 서비스와 관련하여 이용자에게 발생한 직접적, 간접적,
          부수적, 특별, 결과적 손해에 대해서도 책임을 지지 않습니다.
          다만, 운영자의 고의 또는 중대한 과실로 인한 손해는 그러하지 아니합니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 운영자는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인하여
          서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제13조 (광고 게재)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 운영자는 서비스 운영을 위해 서비스 화면에 광고를 게재할 수 있습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 광고와 관련한 거래는 이용자와 광고주 간의 문제이며, 운영자는 이에 대해
          책임을 지지 않습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제14조 (서비스 변경 및 중단)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 운영자는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 서비스를 변경하거나 중단하는 경우, 가능한 한 사전에 서비스 내 공지를 통해 안내합니다.
          다만, 운영자가 통제할 수 없는 사유로 인한 경우 사후에 공지할 수 있습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제15조 (이용 자격)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 서비스는 만 14세 이상의 이용자를 대상으로 합니다.
          만 14세 미만의 아동이 서비스를 이용하는 경우 법정대리인의 동의가 필요합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제16조 (개인정보 보호)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          이용자의 개인정보 보호에 관한 사항은 별도의{" "}
          <a
            href="/privacy"
            className="text-[#6B5A80] underline"
          >
            개인정보처리방침
          </a>
          에서 정합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제17조 (준거법 및 관할법원)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ① 본 약관의 해석 및 적용에는 대한민국 법령을 적용합니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ② 서비스 이용과 관련하여 운영자와 이용자 간에 분쟁이 발생한 경우,
          양 당사자는 원만한 해결을 위해 성실히 협의합니다.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          ③ 협의가 이루어지지 않는 경우, 관련 법령에 따른 관할법원에 소를 제기할 수 있습니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제18조 (분리가능성)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 약관의 일부 조항이 법령에 의해 무효 또는 집행 불가능한 것으로 판명되더라도,
          나머지 조항의 유효성에는 영향을 미치지 않으며 계속 유효합니다.
        </p>

        <h2 className="text-base mt-6 mb-3">제19조 (문의)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          본 약관 및 서비스 이용에 관한 문의사항은 아래 연락처로 문의해 주시기 바랍니다.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>이메일: melancholy8914@gmail.com</li>
        </ul>
      </div>
    </div>
  );
}

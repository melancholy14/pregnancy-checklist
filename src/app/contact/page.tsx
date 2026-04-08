import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "연락처 - 출산 준비 체크리스트",
  description: "혼자 만들다 보니 놓치는 것도 많아요. 의견을 들려주세요.",
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
  openGraph: {
    title: "연락처 - 출산 준비 체크리스트",
    description: "혼자 만들다 보니 놓치는 것도 많아요. 의견을 들려주세요.",
    url: `${BASE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 prose prose-sm">
        <h1 className="text-center text-xl mb-8">연락처</h1>

        <h2 className="text-base mt-6 mb-3">피드백</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          더 나은 서비스를 위해 여러분의 소중한 의견을 기다립니다.
        </p>
        {process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL && (
          <a
            href={process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 px-4 py-2 text-sm bg-[#6B5A80] text-white rounded-lg hover:bg-[#6B5A80]/80 transition-colors"
          >
            의견을 들려주세요
          </a>
        )}

        <h2 className="text-base mt-6 mb-3">이메일 문의</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          서비스 이용 중 문의사항이 있으시면 아래 이메일로 연락해 주세요.
        </p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2">
          <li>이메일: melancholy8914@gmail.com</li>
        </ul>
      </div>
    </div>
  );
}

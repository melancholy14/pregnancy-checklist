import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "의견 보내기 - 출산 준비 체크리스트",
  description:
    "혼자 만들다 보니 놓치는 것도 많아요. 불편한 점이나 추가되면 좋겠는 기능이 있다면 알려주세요.",
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
  openGraph: {
    title: "의견 보내기 - 출산 준비 체크리스트",
    description:
      "혼자 만들다 보니 놓치는 것도 많아요. 불편한 점이나 추가되면 좋겠는 기능이 있다면 알려주세요.",
    url: `${BASE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 max-w-lg mx-auto">
        <h1 className="text-center text-xl font-bold mb-8">의견 보내기</h1>

        {/* 피드백 섹션 */}
        <section className="mb-8" aria-label="의견 보내기">
          <p className="text-sm text-muted-foreground leading-relaxed">
            혼자 만들다 보니 놓치는 것도 많아요.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            &quot;이것도 넣어주세요&quot;, &quot;이건 좀 아닌데요&quot; 다
            환영합니다.
          </p>
          {process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL && (
            <a
              href={process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center mt-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              aria-label="의견 보내기 폼으로 이동"
            >
              의견 보내기
            </a>
          )}
        </section>

        {/* 이메일 섹션 */}
        <section aria-label="이메일 연락">
          <h2 className="text-base font-semibold mb-3">이메일</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            직접 연락 주셔도 돼요.
          </p>
          <a
            href="mailto:melancholy8914@gmail.com"
            className="inline-block mt-2 text-sm text-primary hover:underline"
            aria-label="이메일 보내기"
          >
            melancholy8914@gmail.com
          </a>
        </section>
      </div>
    </div>
  );
}

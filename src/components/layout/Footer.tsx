import Link from "next/link";

export function Footer() {
  return (
    <footer className="pb-28 pt-8 px-4 text-center text-xs text-muted-foreground space-y-2">
      <p>본 서비스는 의료적 조언을 제공하지 않습니다.</p>
      <p>제공되는 정보는 참고용이며, 정확한 진료는 담당 의사와 상담하세요.</p>
      <div className="flex justify-center gap-3 mt-2">
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
          개인정보처리방침
        </Link>
        <span>|</span>
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
          서비스 이용약관
        </Link>
        <span>|</span>
        <Link href="/about" className="underline underline-offset-2 hover:text-foreground transition-colors">
          서비스 소개
        </Link>
        <span>|</span>
        <Link href="/contact" className="underline underline-offset-2 hover:text-foreground transition-colors">
          연락처
        </Link>
      </div>
    </footer>
  );
}

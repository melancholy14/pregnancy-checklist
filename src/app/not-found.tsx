import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl mb-6">🤷‍♀️</div>
        <h1 className="mb-3">페이지를 찾을 수 없어요</h1>
        <p className="text-muted-foreground mb-8">
          요청하신 페이지가 존재하지 않습니다
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#FFD4DE] rounded-xl hover:bg-[#f5cada] transition-colors duration-200 text-[#3D4447] font-medium"
        >
          <Home size={18} />
          <span>홈으로 돌아가기</span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BabyfairCard } from "./BabyfairCard";

interface Fair {
  id: string;
  name: string;
  dates: string;
  location: string;
  city: string;
  color: string;
}

const fairs: Fair[] = [
  {
    id: "1",
    name: "서울 베이비페어",
    dates: "2026년 4월 10-12일",
    location: "코엑스 Hall A",
    city: "서울",
    color: "#FFD6E0",
  },
  {
    id: "2",
    name: "부산 임산부 & 육아용품 박람회",
    dates: "2026년 4월 18-20일",
    location: "벡스코 제1전시장",
    city: "부산",
    color: "#E8D5F5",
  },
  {
    id: "3",
    name: "대구 베이비 & 키즈페어",
    dates: "2026년 5월 2-4일",
    location: "엑스코 동관",
    city: "대구",
    color: "#D5F0E8",
  },
  {
    id: "4",
    name: "인천 맘&베이비 박람회",
    dates: "2026년 5월 15-17일",
    location: "송도컨벤시아",
    city: "인천",
    color: "#FFE8D0",
  },
  {
    id: "5",
    name: "경기 베이비페어",
    dates: "2026년 5월 24-26일",
    location: "킨텍스 제2전시장",
    city: "경기",
    color: "#FFF8D0",
  },
  {
    id: "6",
    name: "광주 임산부 용품전",
    dates: "2026년 6월 6-8일",
    location: "김대중컨벤션센터",
    city: "광주",
    color: "#FFD6E0",
  },
  {
    id: "7",
    name: "강남 프리미엄 베이비페어",
    dates: "2026년 6월 13-15일",
    location: "강남 코엑스 Hall D",
    city: "서울",
    color: "#E8D5F5",
  },
  {
    id: "8",
    name: "대전 베이비&맘 페스티벌",
    dates: "2026년 6월 20-22일",
    location: "대전컨벤션센터",
    city: "대전",
    color: "#D5F0E8",
  },
];

export function BabyfairContainer() {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-4xl mx-auto pt-8">
        <h1 className="mb-2 text-center">베이비페어 일정</h1>
        <p className="text-center text-gray-500 mb-8">
          2026년 전국 베이비페어 행사 안내
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fairs.map((fair) => (
            <BabyfairCard key={fair.id} fair={fair} />
          ))}
        </div>

        {/* Info Card */}
        <Card className="mt-8 rounded-3xl shadow-md border-0 bg-gradient-to-r from-[#FFD6E0] to-[#E8D5F5]">
          <CardContent className="p-6">
            <h3 className="mb-3">💡 참관 팁</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• 사전 등록하면 입장료 할인 혜택이 있어요</li>
              <li>• 카드 여러 개 준비하면 카드사 할인 받을 수 있어요</li>
              <li>• 오전 일찍 가면 인기 상품 선착순 혜택을 받을 수 있어요</li>
              <li>• 큰 에코백이나 카트 챙겨가세요</li>
              <li>• 편한 신발 필수! 많이 걸어야 해요</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { BabyfairEvent } from "@/types/babyfair";
import { BabyfairCard } from "./BabyfairCard";

interface BabyfairContainerProps {
  events: BabyfairEvent[];
}

export function BabyfairContainer({ events }: BabyfairContainerProps) {
  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-4xl mx-auto pt-8">
        <h1 className="mb-2 text-center">베이비페어 일정</h1>
        <p className="text-center text-gray-500 mb-8">
          2026년 전국 베이비페어 행사 안내
        </p>

        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p>아직 등록된 행사가 없어요</p>
            <p className="text-sm mt-1">곧 업데이트될 예정입니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <BabyfairCard key={event.slug} event={event} />
            ))}
          </div>
        )}

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

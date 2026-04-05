import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WeightFormProps {
  onSubmit: (date: string, weight: number) => void;
  onClose: () => void;
}

export function WeightForm({ onSubmit, onClose }: WeightFormProps) {
  const [newDate, setNewDate] = useState("");
  const [newWeight, setNewWeight] = useState("");

  const handleAdd = () => {
    if (!newDate || !newWeight) return;
    onSubmit(newDate, parseFloat(newWeight));
    setNewDate("");
    setNewWeight("");
  };

  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-black/4">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3>새 기록 추가</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl bg-muted hover:bg-muted/80"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm">날짜</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-4 py-3 bg-input-background rounded-xl border border-black/6 focus:outline-none focus:ring-2 focus:ring-[#FFD4DE]/50 transition-shadow"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm">체중 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="예: 62.5"
              className="w-full px-4 py-3 bg-input-background rounded-xl border border-black/6 focus:outline-none focus:ring-2 focus:ring-[#FFD4DE]/50 transition-shadow"
            />
          </div>
          <Button
            onClick={handleAdd}
            className="w-full py-3 bg-[#FFD4DE] rounded-xl hover:bg-[#f5cada] text-[#3D4447] h-auto transition-colors duration-200"
          >
            추가
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

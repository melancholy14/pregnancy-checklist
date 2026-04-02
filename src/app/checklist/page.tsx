import checklistItems from "@/data/checklist_items.json";
import type { ChecklistItem } from "@/types/checklist";
import { ChecklistContainer } from "@/components/checklist/ChecklistContainer";
import { DueDateBanner } from "@/components/home/DueDateBanner";

export default function ChecklistPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <DueDateBanner />
      </div>
      <ChecklistContainer items={checklistItems as ChecklistItem[]} />
    </>
  );
}

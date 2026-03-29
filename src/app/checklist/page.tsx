import checklistItems from "@/data/checklist_items.json";
import type { ChecklistItem } from "@/types/checklist";
import { ChecklistContainer } from "@/components/checklist/ChecklistContainer";

export default function ChecklistPage() {
  return <ChecklistContainer items={checklistItems as ChecklistItem[]} />;
}

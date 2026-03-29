import babyfairEvents from "@/data/babyfair_events.json";
import type { BabyfairEvent } from "@/types/babyfair";
import { BabyfairContainer } from "@/components/babyfair/BabyfairContainer";

export default function BabyFairPage() {
  return <BabyfairContainer events={babyfairEvents as BabyfairEvent[]} />;
}

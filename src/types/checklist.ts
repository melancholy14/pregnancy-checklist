export type ChecklistCategory =
  | 'hospital'
  | 'hospital_bag'
  | 'baby_items'
  | 'postpartum'
  | 'admin'
  | 'bag_mom'
  | 'bag_baby'
  | 'bag_docs'
  | 'partner_before'
  | 'partner_day'
  | 'partner_after'
  | 'prep_health'
  | 'prep_nutrition'
  | 'prep_checkup'
  | 'prep_finance';

export type ChecklistItem = {
  id: string;
  title: string;
  category: ChecklistCategory;
  categoryName: string;
  /**
   * 추천 임신 주차.
   * - 양수(1~42): 해당 주차에 챙길 항목 — P2 매칭 대상.
   * - `0`: 미정/주차 무관 — **P2 매칭 대상이 아님** ("이번 주 추천" 마이크로 라벨 노출 X).
   *   신규 3종 슬러그(hospital_bag/partner_prep/pregnancy_prep)는 슬러그 자체가 컨텍스트라 일괄 0.
   *   `getChecklistByWeek` 가 0인 항목을 매칭에서 제외하는 규칙이 본 시맨틱과 일치한다.
   */
  recommendedWeek: number;
  priority: 'high' | 'medium' | 'low';
  isCustom?: boolean;
  note?: string;
};

export type ChecklistSubcategory = {
  key: ChecklistCategory;
  label: string;
};

export type ChecklistMeta = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  subcategories: ChecklistSubcategory[];
  linked_timeline_weeks?: number[];
  linked_article_slugs?: string[];
};

export type ChecklistData = {
  meta: ChecklistMeta;
  items: ChecklistItem[];
};

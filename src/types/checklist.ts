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
  linked_video_ids?: string[];
};

export type ChecklistData = {
  meta: ChecklistMeta;
  items: ChecklistItem[];
};

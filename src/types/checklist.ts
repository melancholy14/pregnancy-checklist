export type ChecklistItem = {
  id: string;
  title: string;
  category: 'hospital' | 'hospital_bag' | 'baby_items' | 'postpartum' | 'admin';
  categoryName: string;
  recommendedWeek: number;
  priority: 'high' | 'medium' | 'low';
  isCustom?: boolean;
};

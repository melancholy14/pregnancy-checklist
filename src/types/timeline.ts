export type TimelineItem = {
  id: string;
  week: number;
  title: string;
  description: string;
  type: 'prep' | 'shopping' | 'admin' | 'education' | 'wellbeing';
  priority: 'high' | 'medium' | 'low';
  linked_checklist_ids?: string[];
  linked_article_slugs?: string[];
  linked_video_ids?: string[];
  seo_slug?: string;
  isCustom?: boolean;
};

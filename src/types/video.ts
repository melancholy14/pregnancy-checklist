export type VideoItem = {
  id: string;
  title: string;
  youtube_id: string;
  category: 'exercise' | 'birth_prep' | 'newborn_care';
  categoryName: string;
  description?: string;
};

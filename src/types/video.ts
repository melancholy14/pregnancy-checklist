export type VideoCategory = 'exercise' | 'birth_prep' | 'newborn_care';

export type VideoItem = {
  id: string;
  title: string;
  youtube_id: string;
  category: VideoCategory;
  categoryName: string;
  subcategory: string;
  subcategoryName: string;
  description?: string;
  channel_id: string;
  upload_date: string;
  is_short?: boolean;
};

export type ChannelItem = {
  id: string;
  youtube_channel_id: string;
  name: string;
  description: string;
  category: VideoCategory;
  thumbnail_url: string;
};

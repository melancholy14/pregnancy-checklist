export type BabyfairEvent = {
  slug: string;
  name: string;
  venue_name: string;
  city: string;
  start_date: string;
  end_date: string;
  official_url: string;
  review_status: 'pending' | 'approved' | 'rejected';
  scale?: 'large' | 'medium' | 'small';
  admission?: string;
  pre_register_url?: string;
  parking?: string;
  highlights?: string[];
  tip?: string;
  operating_hours?: string;
};

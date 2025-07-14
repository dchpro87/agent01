// Type definitions for SerpApi responses
export interface SearchResult {
  title?: string;
  snippet?: string;
  description?: string;
  link?: string;
  url?: string;
  publication_info?: {
    authors?: string;
    summary?: string;
  };
}

export interface NewsResult {
  title?: string;
  snippet?: string;
  date?: string;
  source?: string;
  link?: string;
}

export interface ShoppingResult {
  title?: string;
  price?: string;
  rating?: string;
  source?: string;
  link?: string;
}

export interface ImageResult {
  title?: string;
  original?: {
    width?: string;
    height?: string;
    link?: string;
  };
  source?: string;
}

export interface VideoResult {
  title?: string;
  channel?: string;
  duration?: string;
  views?: string;
  published_date?: string;
  link?: string;
}

export interface SerpApiResponse {
  organic_results?: SearchResult[];
  news_results?: NewsResult[];
  shopping_results?: ShoppingResult[];
  images_results?: ImageResult[];
  video_results?: VideoResult[];
  answer_box?: {
    answer?: string;
    snippet?: string;
    link?: string;
  };
  knowledge_graph?: {
    title?: string;
    description?: string;
    website?: string;
  };
  related_questions?: Array<{ question: string }>;
  total_results?: number;
  search_metadata?: {
    id?: string;
    processing_time_ms?: number;
  };
}

export interface SearchParams {
  engine: string;
  api_key: string;
  q: string;
  num: number;
  location?: string;
  hl?: string;
  safe?: string;
  tbs?: string;
  [key: string]: string | number | undefined; // Allow additional properties
}

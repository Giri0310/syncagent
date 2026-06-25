export type WebsiteType = 'blog' | 'news' | 'cms' | 'static' | 'unknown';
export type SyncStatus = 'running' | 'completed' | 'failed';
export type ScheduleFrequency = 'manual' | 'daily' | 'weekly';
export type LogLevel = 'info' | 'warn' | 'error';

export interface ArticleMetadata {
  title: string;
  description: string;
  author?: string;
  date?: string;
  tags: string[];
  canonicalUrl?: string;
  siteName?: string;
}

export interface ExtractedImage {
  url: string;
  alt?: string;
  localPath?: string;
  filename: string;
}

export interface Article {
  id: string;
  sourceUrl: string;
  url: string;
  title: string;
  description: string;
  author?: string;
  date?: string;
  tags: string[];
  content: string; // Markdown
  images: ExtractedImage[];
  hash: string;
  importedAt: string;
  updatedAt: string;
}

export interface SyncHistoryEntry {
  id: string;
  sourceUrl: string;
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  articlesFound: number;
  articlesImported: number;
  articlesSkipped: number;
  errors: string[];
}

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  sourceUrl?: string;
  syncId?: string;
  timestamp: string;
}

export interface ScheduleConfig {
  id: string;
  sourceUrl: string;
  frequency: ScheduleFrequency;
  time: string; // HH:mm format
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface WebsiteAnalysis {
  url: string;
  websiteType: WebsiteType;
  title: string;
  description: string;
  detectedSelectors: {
    articleLinks: string;
    title: string;
    content: string;
    author: string;
    date: string;
    image: string;
  };
  allArticleUrls: string[];
  sampleArticleUrls: string[];
  totalArticleUrls: number;
}

export interface SyncResult {
  success: boolean;
  syncId: string;
  sourceUrl: string;
  articlesFound: number;
  articlesImported: number;
  articlesSkipped: number;
  errors: string[];
  articles: Article[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
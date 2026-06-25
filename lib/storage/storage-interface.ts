import { Article, LogEntry, ScheduleConfig, SyncHistoryEntry } from '../types';

export interface StorageInterface {
  // Articles
  getArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
  getArticleByUrl(url: string): Promise<Article | null>;
  getArticleByHash(hash: string): Promise<Article | null>;
  saveArticle(article: Article): Promise<Article>;
  deleteArticle(id: string): Promise<boolean>;

  // Sync History
  getSyncHistory(): Promise<SyncHistoryEntry[]>;
  getSyncHistoryById(id: string): Promise<SyncHistoryEntry | null>;
  saveSyncHistory(entry: SyncHistoryEntry): Promise<SyncHistoryEntry>;
  updateSyncHistory(id: string, updates: Partial<SyncHistoryEntry>): Promise<SyncHistoryEntry | null>;

  // Logs
  getLogs(level?: string, limit?: number): Promise<LogEntry[]>;
  saveLog(log: LogEntry): Promise<LogEntry>;

  // Schedules
  getSchedules(): Promise<ScheduleConfig[]>;
  getScheduleById(id: string): Promise<ScheduleConfig | null>;
  getScheduleBySourceUrl(sourceUrl: string): Promise<ScheduleConfig | null>;
  saveSchedule(schedule: ScheduleConfig): Promise<ScheduleConfig>;
  deleteSchedule(id: string): Promise<boolean>;
}
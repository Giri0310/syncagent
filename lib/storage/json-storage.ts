import fs from 'fs/promises';
import path from 'path';
import { Article, LogEntry, ScheduleConfig, SyncHistoryEntry } from '../types';
import { StorageInterface } from './storage-interface';
import { generateId } from '../utils';

interface DataStore {
  articles: Article[];
  syncHistory: SyncHistoryEntry[];
  logs: LogEntry[];
  schedules: ScheduleConfig[];
}

export class JsonStorage implements StorageInterface {
  private dataDir: string;
  private dbPath: string;

  constructor(dataDir: string = './data') {
    this.dataDir = path.resolve(dataDir);
    this.dbPath = path.join(this.dataDir, 'db.json');
  }

  private async init(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private async readData(): Promise<DataStore> {
    await this.init();
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      return JSON.parse(data) as DataStore;
    } catch {
      return { articles: [], syncHistory: [], logs: [], schedules: [] };
    }
  }

  private async writeData(data: DataStore): Promise<void> {
    await this.init();
    await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async getArticles(): Promise<Article[]> {
    const data = await this.readData();
    return [...data.articles].sort(
      (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );
  }

  async getArticleById(id: string): Promise<Article | null> {
    const data = await this.readData();
    return data.articles.find((a) => a.id === id) || null;
  }

  async getArticleByUrl(url: string): Promise<Article | null> {
    const data = await this.readData();
    return data.articles.find((a) => a.url === url) || null;
  }

  async getArticleByHash(hash: string): Promise<Article | null> {
    const data = await this.readData();
    return data.articles.find((a) => a.hash === hash) || null;
  }

  async saveArticle(article: Article): Promise<Article> {
    const data = await this.readData();
    const existingIndex = data.articles.findIndex(
      (a) => a.id === article.id || a.url === article.url || a.hash === article.hash
    );

    if (existingIndex >= 0) {
      data.articles[existingIndex] = { ...article, updatedAt: new Date().toISOString() };
    } else {
      if (!article.id) article.id = generateId();
      data.articles.push(article);
    }

    await this.writeData(data);
    return article;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const data = await this.readData();
    const initialLength = data.articles.length;
    data.articles = data.articles.filter((a) => a.id !== id);
    await this.writeData(data);
    return data.articles.length !== initialLength;
  }

  async getSyncHistory(): Promise<SyncHistoryEntry[]> {
    const data = await this.readData();
    return [...data.syncHistory].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async getSyncHistoryById(id: string): Promise<SyncHistoryEntry | null> {
    const data = await this.readData();
    return data.syncHistory.find((h) => h.id === id) || null;
  }

  async saveSyncHistory(entry: SyncHistoryEntry): Promise<SyncHistoryEntry> {
    const data = await this.readData();
    if (!entry.id) entry.id = generateId();
    data.syncHistory.push(entry);
    await this.writeData(data);
    return entry;
  }

  async updateSyncHistory(
    id: string,
    updates: Partial<SyncHistoryEntry>
  ): Promise<SyncHistoryEntry | null> {
    const data = await this.readData();
    const index = data.syncHistory.findIndex((h) => h.id === id);
    if (index === -1) return null;
    data.syncHistory[index] = { ...data.syncHistory[index], ...updates };
    await this.writeData(data);
    return data.syncHistory[index];
  }

  async getLogs(level?: string, limit: number = 100): Promise<LogEntry[]> {
    const data = await this.readData();
    let logs = data.logs;
    if (level) {
      logs = logs.filter((l) => l.level === level);
    }
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async saveLog(log: LogEntry): Promise<LogEntry> {
    const data = await this.readData();
    if (!log.id) log.id = generateId();
    data.logs.push(log);
    // Keep only last 1000 logs to prevent file bloat
    if (data.logs.length > 1000) {
      data.logs = data.logs.slice(-1000);
    }
    await this.writeData(data);
    return log;
  }

  async getSchedules(): Promise<ScheduleConfig[]> {
    const data = await this.readData();
    return data.schedules;
  }

  async getScheduleById(id: string): Promise<ScheduleConfig | null> {
    const data = await this.readData();
    return data.schedules.find((s) => s.id === id) || null;
  }

  async getScheduleBySourceUrl(sourceUrl: string): Promise<ScheduleConfig | null> {
    const data = await this.readData();
    return data.schedules.find((s) => s.sourceUrl === sourceUrl) || null;
  }

  async saveSchedule(schedule: ScheduleConfig): Promise<ScheduleConfig> {
    const data = await this.readData();
    const existingIndex = data.schedules.findIndex((s) => s.id === schedule.id);
    if (existingIndex >= 0) {
      data.schedules[existingIndex] = schedule;
    } else {
      if (!schedule.id) schedule.id = generateId();
      data.schedules.push(schedule);
    }
    await this.writeData(data);
    return schedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const data = await this.readData();
    const initialLength = data.schedules.length;
    data.schedules = data.schedules.filter((s) => s.id !== id);
    await this.writeData(data);
    return data.schedules.length !== initialLength;
  }
}
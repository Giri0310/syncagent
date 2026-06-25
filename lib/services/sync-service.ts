import { WebsiteAnalyzer } from './analyzer';
import { ContentExtractor } from './extractor';
import { SchedulerService } from './scheduler';
import { Logger } from './logger';
import { StorageInterface } from '../storage/storage-interface';
import {
  Article,
  LogEntry,
  ScheduleConfig,
  SyncHistoryEntry,
  SyncResult,
  WebsiteAnalysis,
} from '../types';
import { generateId, formatDate } from '../utils';

export class SyncService {
  private analyzer: WebsiteAnalyzer;
  private extractor: ContentExtractor;
  private storage: StorageInterface;
  private logger: Logger;
  private scheduler: SchedulerService;

  constructor(storage: StorageInterface, imageDir: string = './public/images') {
    this.storage = storage;
    this.analyzer = new WebsiteAnalyzer();
    this.extractor = new ContentExtractor(storage, imageDir);
    this.logger = new Logger(storage);
    this.scheduler = new SchedulerService(storage);
  }

  getScheduler(): SchedulerService {
    return this.scheduler;
  }

  async analyze(sourceUrl: string): Promise<WebsiteAnalysis> {
    await this.logger.info(`Analysis started for ${sourceUrl}`);
    try {
      const analysis = await this.analyzer.analyze(sourceUrl);
      await this.logger.info(
        `Analysis completed. Found ${analysis.totalArticleUrls} articles for ${sourceUrl}`
      );
      return analysis;
    } catch (error) {
      await this.logger.error(
        `Analysis failed for ${sourceUrl}: ${(error as Error).message}`,
        sourceUrl
      );
      throw error;
    }
  }

  async sync(sourceUrl: string, maxArticles: number = 20): Promise<SyncResult> {
    const syncId = generateId();
    const historyEntry: SyncHistoryEntry = {
      id: syncId,
      sourceUrl,
      status: 'running',
      startedAt: formatDate(new Date()),
      articlesFound: 0,
      articlesImported: 0,
      articlesSkipped: 0,
      errors: [],
    };

    await this.storage.saveSyncHistory(historyEntry);
    await this.logger.info(`Sync started for ${sourceUrl}`, sourceUrl, syncId);

    try {
      const analysis = await this.analyzer.analyze(sourceUrl);
      await this.logger.info(
        `Found ${analysis.totalArticleUrls} article links`,
        sourceUrl,
        syncId
      );

      const extracted = await this.extractor.extractFromAnalysis(
        analysis,
        syncId,
        maxArticles
      );

      const updatedEntry: Partial<SyncHistoryEntry> = {
        status: extracted.errors.length > 0 && extracted.articlesImported === 0 ? 'failed' : 'completed',
        completedAt: formatDate(new Date()),
        articlesFound: extracted.articlesFound,
        articlesImported: extracted.articlesImported,
        articlesSkipped: extracted.articlesSkipped,
        errors: extracted.errors,
      };

      await this.storage.updateSyncHistory(syncId, updatedEntry);
      await this.logger.info(
        `Sync completed. Imported ${extracted.articlesImported}, skipped ${extracted.articlesSkipped}`,
        sourceUrl,
        syncId
      );

      return {
        success: updatedEntry.status === 'completed',
        syncId,
        sourceUrl,
        articlesFound: extracted.articlesFound,
        articlesImported: extracted.articlesImported,
        articlesSkipped: extracted.articlesSkipped,
        errors: extracted.errors,
        articles: extracted.articles,
      };
    } catch (error) {
      const message = `Sync failed: ${(error as Error).message}`;
      await this.storage.updateSyncHistory(syncId, {
        status: 'failed',
        completedAt: formatDate(new Date()),
        errors: [message],
      });
      await this.logger.error(message, sourceUrl, syncId);

      return {
        success: false,
        syncId,
        sourceUrl,
        articlesFound: 0,
        articlesImported: 0,
        articlesSkipped: 0,
        errors: [message],
        articles: [],
      };
    }
  }

  async getArticles(): Promise<Article[]> {
    return this.storage.getArticles();
  }

  async getLogs(level?: string, limit?: number): Promise<LogEntry[]> {
    return this.storage.getLogs(level, limit);
  }

  async getSyncHistory(): Promise<SyncHistoryEntry[]> {
    return this.storage.getSyncHistory();
  }

  async getSchedules(): Promise<ScheduleConfig[]> {
    return this.storage.getSchedules();
  }

  async setSchedule(
    sourceUrl: string,
    frequency: ScheduleConfig['frequency'],
    time: string,
    enabled: boolean
  ): Promise<ScheduleConfig> {
    return this.scheduler.schedule(sourceUrl, frequency, time, enabled, (url) =>
      this.sync(url)
    );
  }

  async deleteArticle(id: string): Promise<boolean> {
    return this.storage.deleteArticle(id);
  }

  async deleteSchedule(id: string): Promise<boolean> {
    return this.scheduler.deleteSchedule(id);
  }

  async toggleSchedule(id: string, enabled: boolean): Promise<ScheduleConfig | null> {
    return this.scheduler.toggleSchedule(id, enabled, (url) => this.sync(url));
  }
}
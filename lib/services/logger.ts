import { LogLevel, LogEntry } from '../types';
import { StorageInterface } from '../storage/storage-interface';
import { generateId, formatDate } from '../utils';

export class Logger {
  private storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  private async log(
    level: LogLevel,
    message: string,
    sourceUrl?: string,
    syncId?: string
  ): Promise<LogEntry> {
    const entry: LogEntry = {
      id: generateId(),
      level,
      message,
      sourceUrl,
      syncId,
      timestamp: formatDate(new Date()),
    };

    console.log(`[${level.toUpperCase()}] ${message}${sourceUrl ? ` (${sourceUrl})` : ''}`);
    return this.storage.saveLog(entry);
  }

  info(message: string, sourceUrl?: string, syncId?: string): Promise<LogEntry> {
    return this.log('info', message, sourceUrl, syncId);
  }

  warn(message: string, sourceUrl?: string, syncId?: string): Promise<LogEntry> {
    return this.log('warn', message, sourceUrl, syncId);
  }

  error(message: string, sourceUrl?: string, syncId?: string): Promise<LogEntry> {
    return this.log('error', message, sourceUrl, syncId);
  }

  async getLogs(level?: LogLevel, limit: number = 100): Promise<LogEntry[]> {
    return this.storage.getLogs(level, limit);
  }
}
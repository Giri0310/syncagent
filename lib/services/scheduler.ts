import cron from 'node-cron';
import { ScheduleConfig, SyncResult } from '../types';
import { StorageInterface } from '../storage/storage-interface';
import { Logger } from './logger';

export class SchedulerService {
  private storage: StorageInterface;
  private logger: Logger;
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(storage: StorageInterface) {
    this.storage = storage;
    this.logger = new Logger(storage);
  }

  async schedule(
    sourceUrl: string,
    frequency: ScheduleConfig['frequency'],
    time: string,
    enabled: boolean = true,
    syncCallback: (url: string) => Promise<SyncResult>
  ): Promise<ScheduleConfig> {
    const existing = await this.storage.getScheduleBySourceUrl(sourceUrl);

    const schedule: ScheduleConfig = {
      id: existing?.id || generateSchedulerId(),
      sourceUrl,
      frequency,
      time,
      enabled,
      lastRunAt: existing?.lastRunAt,
      nextRunAt: this.calculateNextRun(frequency, time),
    };

    await this.storage.saveSchedule(schedule);

    // Restart task
    this.stopTask(schedule.id);

    if (enabled && frequency !== 'manual') {
      const cronExpression = this.buildCronExpression(frequency, time);
      if (cron.validate(cronExpression)) {
        const task = cron.schedule(cronExpression, async () => {
          await this.executeSync(schedule.id, syncCallback);
        });
        this.tasks.set(schedule.id, task);
      }
    }

    return schedule;
  }

  async executeSync(
    scheduleId: string,
    syncCallback: (url: string) => Promise<SyncResult>
  ): Promise<SyncResult | null> {
    const schedules = await this.storage.getSchedules();
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule || !schedule.enabled) return null;

    await this.logger.info(`Scheduled sync started for ${schedule.sourceUrl}`);
    const result = await syncCallback(schedule.sourceUrl);

    schedule.lastRunAt = new Date().toISOString();
    schedule.nextRunAt = this.calculateNextRun(schedule.frequency, schedule.time);
    await this.storage.saveSchedule(schedule);

    return result;
  }

  async loadSchedules(syncCallback: (url: string) => Promise<SyncResult>): Promise<void> {
    const schedules = await this.storage.getSchedules();
    for (const schedule of schedules) {
      if (schedule.enabled && schedule.frequency !== 'manual') {
        const cronExpression = this.buildCronExpression(schedule.frequency, schedule.time);
        if (cron.validate(cronExpression)) {
          const task = cron.schedule(cronExpression, async () => {
            await this.executeSync(schedule.id, syncCallback);
          });
          this.tasks.set(schedule.id, task);
        }
      }
    }
  }

  async deleteSchedule(id: string): Promise<boolean> {
    this.stopTask(id);
    return this.storage.deleteSchedule(id);
  }

  async toggleSchedule(
    id: string,
    enabled: boolean,
    syncCallback: (url: string) => Promise<SyncResult>
  ): Promise<ScheduleConfig | null> {
    const schedule = await this.storage.getScheduleById(id);
    if (!schedule) return null;
    return this.schedule(
      schedule.sourceUrl,
      schedule.frequency,
      schedule.time,
      enabled,
      syncCallback
    );
  }

  stopAll(): void {
    this.tasks.forEach((task) => task.stop());
    this.tasks.clear();
  }

  private stopTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
    }
  }

  private buildCronExpression(frequency: ScheduleConfig['frequency'], time: string): string {
    const [hours, minutes] = time.split(':');
    switch (frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * 1`;
      default:
        return '0 0 * * *';
    }
  }

  private calculateNextRun(frequency: ScheduleConfig['frequency'], time: string): string | undefined {
    if (frequency === 'manual') return undefined;

    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    let next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    if (frequency === 'weekly') {
      next.setDate(next.getDate() + ((7 - next.getDay() + 1) % 7 || 7));
    }

    return next.toISOString();
  }
}

function generateSchedulerId(): string {
  return `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
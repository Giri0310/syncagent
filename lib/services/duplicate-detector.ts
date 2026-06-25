import crypto from 'crypto';
import { Article } from '../types';
import { StorageInterface } from '../storage/storage-interface';

export class DuplicateDetector {
  private storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  async isDuplicate(article: Partial<Article>): Promise<boolean> {
    if (!article.url) return false;

    // Check by URL first
    const existingByUrl = await this.storage.getArticleByUrl(article.url);
    if (existingByUrl) return true;

    // Check by content hash
    if (article.hash) {
      const existingByHash = await this.storage.getArticleByHash(article.hash);
      if (existingByHash) return true;
    }

    return false;
  }

  generateContentHash(article: { title?: string; content?: string; url: string }): string {
    const normalizedContent = `${article.url}|${article.title || ''}|${this.stripHtml(article.content || '')}`;
    return crypto.createHash('sha256').update(normalizedContent).digest('hex');
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
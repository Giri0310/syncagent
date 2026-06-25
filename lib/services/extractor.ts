import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, ExtractedImage, WebsiteAnalysis } from '../types';
import { MarkdownConverter } from './markdown-converter';
import { ImageDownloader } from './image-downloader';
import { DuplicateDetector } from './duplicate-detector';
import { Logger } from './logger';
import { generateId, formatDate, ensureAbsoluteUrl, delay } from '../utils';
import { StorageInterface } from '../storage/storage-interface';

export class ContentExtractor {
  private markdownConverter: MarkdownConverter;
  private imageDownloader: ImageDownloader;
  private duplicateDetector: DuplicateDetector;
  private logger: Logger;
  private storage: StorageInterface;
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  constructor(storage: StorageInterface, imageDir: string = './public/images') {
    this.storage = storage;
    this.markdownConverter = new MarkdownConverter();
    this.imageDownloader = new ImageDownloader(imageDir);
    this.duplicateDetector = new DuplicateDetector(storage);
    this.logger = new Logger(storage);
  }

  async extractFromAnalysis(
    analysis: WebsiteAnalysis,
    syncId: string,
    maxArticles: number = 20
  ): Promise<{
    articles: Article[];
    articlesFound: number;
    articlesImported: number;
    articlesSkipped: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const articles: Article[] = [];
    let articlesImported = 0;
    let articlesSkipped = 0;

    const urlsToProcess = (analysis.allArticleUrls.length > 0
      ? analysis.allArticleUrls
      : analysis.sampleArticleUrls
    ).slice(0, maxArticles);

    await this.logger.info(
      `Starting extraction of ${urlsToProcess.length} articles from ${analysis.url}`,
      analysis.url,
      syncId
    );

    for (const url of urlsToProcess) {
      try {
        await delay(500); // Be polite
        const article = await this.extractArticle(url, analysis.url, syncId);

        if (!article) {
          articlesSkipped++;
          continue;
        }

        const isDuplicate = await this.duplicateDetector.isDuplicate(article);
        if (isDuplicate) {
          articlesSkipped++;
          await this.logger.info(`Skipped duplicate article: ${article.url}`, analysis.url, syncId);
          continue;
        }

        const savedArticle = await this.storage.saveArticle(article);
        articles.push(savedArticle);
        articlesImported++;
        await this.logger.info(`Imported article: ${article.title}`, analysis.url, syncId);
      } catch (error) {
        const message = `Failed to extract ${url}: ${(error as Error).message}`;
        errors.push(message);
        await this.logger.error(message, analysis.url, syncId);
      }
    }

    return {
      articles,
      articlesFound: urlsToProcess.length,
      articlesImported,
      articlesSkipped,
      errors,
    };
  }

  private async extractArticle(
    url: string,
    sourceUrl: string,
    syncId: string
  ): Promise<Article | null> {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = this.extractTitle($, url);
    if (!title) {
      await this.logger.warn(`No title found for ${url}`, sourceUrl, syncId);
      return null;
    }

    const description = this.extractDescription($);
    const author = this.extractAuthor($);
    const date = this.extractDate($);
    const tags = this.extractTags($);
    const contentHtml = this.extractContentHtml($);
    const imageUrls = this.extractImageUrls($, url);
    const filteredImageUrls = this.filterContentImages(imageUrls);
    const articleId = generateId();
    const downloadedImages = await this.imageDownloader.downloadImages(
      filteredImageUrls,
      url,
      articleId
    );
    const rawMarkdown = this.markdownConverter.convert(contentHtml);
    const content = this.rewriteImagePaths(rawMarkdown, downloadedImages);

    const hash = this.duplicateDetector.generateContentHash({ title, content, url });

    return {
      id: articleId,
      sourceUrl,
      url,
      title,
      description,
      author,
      date,
      tags,
      content,
      images: downloadedImages,
      hash,
      importedAt: formatDate(new Date()),
      updatedAt: formatDate(new Date()),
    };
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: { 'User-Agent': this.userAgent },
      timeout: 30000,
      maxRedirects: 5,
    });
    return response.data as string;
  }

  private extractTitle($: cheerio.CheerioAPI, fallbackUrl: string): string {
    return (
      $('meta[property="og:title"]').attr('content') ||
      $('article h1').first().text() ||
      $('h1').first().text() ||
      $('.entry-title').first().text() ||
      new URL(fallbackUrl).pathname.split('/').pop()?.replace(/-/g, ' ') ||
      ''
    ).trim();
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    return (
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('article p').first().text() ||
      ''
    ).trim();
  }

  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const author =
      $('meta[name="author"]').attr('content') ||
      $('[rel="author"]').first().text() ||
      $('.author').first().text() ||
      $('.byline').first().text();
    return author ? author.trim() : undefined;
  }

  private extractDate($: cheerio.CheerioAPI): string | undefined {
    const dateStr =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time').first().attr('datetime') ||
      $('time').first().text() ||
      $('.date').first().text() ||
      $('.published').first().text();

    if (!dateStr) return undefined;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : formatDate(date);
  }

  private extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    $('a[rel="tag"]').each((_, el) => {
      tags.push($(el).text().trim());
    });
    return Array.from(new Set(tags)).filter(Boolean);
  }

  private extractContentHtml($: cheerio.CheerioAPI): string {
    // Try common content selectors
    const selectors = [
      'article',
      '.post-content',
      '.entry-content',
      '.article-content',
      '[role="main"]',
      'main',
      '.content',
      '.blog-post',
    ];

    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length && el.text().trim().length > 200) {
        return el.html() || '';
      }
    }

    // Fallback: use body minus navigation/footer
    $('nav, header, footer, aside, script, style').remove();
    return $('body').html() || '';
  }

  private extractImageUrls($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const urls = new Set<string>();

    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src) {
        urls.add(ensureAbsoluteUrl(src, baseUrl));
      }
    });

    // Featured image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) urls.add(ensureAbsoluteUrl(ogImage, baseUrl));

    return Array.from(urls);
  }

  private filterContentImages(urls: string[]): string[] {
    const skipPatterns = [
      /\blogo\b/i,
      /\bfavicon\b/i,
      /\bicon\b/i,
      /\bavatar\b/i,
      /\bsocial\b/i,
      /\bshare\b/i,
      /\bfeed\b/i,
      /gravatar\.com/i,
    ];

    const validExtension = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;

    return urls.filter((url) => {
      if (skipPatterns.some((p) => p.test(url))) return false;
      if (url.includes('data:image')) return false;
      return validExtension.test(url);
    });
  }

  private rewriteImagePaths(content: string, images: ExtractedImage[]): string {
    return images.reduce((md, img) => {
      if (!img.localPath) return md;
      const escaped = img.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return md.replace(new RegExp(escaped, 'g'), img.localPath);
    }, content);
  }
}
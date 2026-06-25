import axios from 'axios';
import * as cheerio from 'cheerio';
import { WebsiteAnalysis, WebsiteType } from '../types';
import { ensureAbsoluteUrl, delay } from '../utils';

export class WebsiteAnalyzer {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

  async analyze(url: string): Promise<WebsiteAnalysis> {
    const normalizedUrl = this.normalizeUrl(url);
    const html = await this.fetchHtml(normalizedUrl);
    const $ = cheerio.load(html);

    const websiteType = this.detectWebsiteType($, normalizedUrl);
    const title = this.extractTitle($);
    const description = this.extractDescription($);
    const articleLinks = this.discoverArticleLinks($, normalizedUrl);

    const uniqueLinks = Array.from(new Set(articleLinks)).slice(0, 200);

    return {
      url: normalizedUrl,
      websiteType,
      title,
      description,
      detectedSelectors: this.inferSelectors($, websiteType),
      allArticleUrls: uniqueLinks,
      sampleArticleUrls: uniqueLinks.slice(0, 10),
      totalArticleUrls: uniqueLinks.length,
    };
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  private async fetchHtml(url: string, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await axios.get(url, {
          headers: { 'User-Agent': this.userAgent },
          timeout: 30000,
          maxRedirects: 5,
        });
        return response.data as string;
      } catch (error) {
        if (i === retries) throw error;
        await delay(1000 * (i + 1));
      }
    }
    throw new Error(`Failed to fetch ${url}`);
  }

  private detectWebsiteType($: cheerio.CheerioAPI, url: string): WebsiteType {
    const html = $.html().toLowerCase();
    const generator = $('meta[name="generator"]').attr('content')?.toLowerCase() || '';

    if (
      generator.includes('wordpress') ||
      html.includes('wp-content') ||
      html.includes('wp-includes')
    ) {
      return 'blog';
    }
    if (generator.includes('drupal') || generator.includes('joomla')) return 'cms';
    if ($('article').length > 0 || $('.post').length > 0 || $('.entry').length > 0) {
      return 'blog';
    }
    if ($('.news').length > 0 || $('h1, h2').length > 10) return 'news';
    if ($('article h2 a, .post h2 a, h2 a').length === 0) return 'static';

    return 'unknown';
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    return (
      $('meta[property="og:title"]').attr('content') ||
      $('title').first().text() ||
      ''
    ).trim();
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    return (
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''
    ).trim();
  }

  private discoverArticleLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const base = new URL(baseUrl).origin;
    const links = new Set<string>();

    const selectors = [
      'article a',
      '.post a',
      '.entry a',
      '.blog-post a',
      '.news-item a',
      'h2 a',
      'h3 a',
      '.card a',
      '.content-item a',
    ];

    selectors.forEach((selector) => {
      $(selector).each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const absolute = ensureAbsoluteUrl(href, baseUrl);
          if (absolute.startsWith(base) && this.looksLikeArticleUrl(absolute)) {
            links.add(absolute.split('#')[0]);
          }
        }
      });
    });

    // Fallback: collect all internal links
    if (links.size === 0) {
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const absolute = ensureAbsoluteUrl(href, baseUrl);
          if (absolute.startsWith(base) && this.looksLikeArticleUrl(absolute)) {
            links.add(absolute.split('#')[0]);
          }
        }
      });
    }

    return Array.from(links);
  }

  private looksLikeArticleUrl(url: string): boolean {
    const lower = url.toLowerCase();
    const excludedPatterns = [
      '/wp-content/',
      '/wp-includes/',
      '/assets/',
      '/images/',
      '/css/',
      '/js/',
      '/api/',
      '/feed',
      '/rss',
      '/tag/',
      '/category/',
      '/author/',
      '/archive',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.pdf',
      '.zip',
      '.mp4',
      '.mp3',
    ];

    if (excludedPatterns.some((p) => lower.includes(p))) return false;

    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/\/$/, '');
      const pathNoNum = path.replace(/\/page\/\d+$/i, '');
      if (/\/page\/\d+$/i.test(path)) return false;

      return (
        /\d{4}\/\d{2}/.test(pathNoNum) || // blog/2024/06/slug
        /\/[\w\-]+\/?$/.test(pathNoNum) // generic clean path
      );
    } catch {
      return false;
    }
  }

  private inferSelectors($: cheerio.CheerioAPI, type: WebsiteType) {
    // Default selectors
    return {
      articleLinks: 'article a, .post a, h2 a, h3 a',
      title: 'h1, article h1, .entry-title, [property="og:title"]',
      content: 'article, .post-content, .entry-content, [role="main"]',
      author: '.author, [rel="author"], .byline',
      date: 'time, .date, .published, [property="article:published_time"]',
      image: 'article img, .post-content img, [property="og:image"]',
    };
  }
}
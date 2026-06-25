import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ExtractedImage } from '../types';
import { ensureAbsoluteUrl, sanitizeFilename } from '../utils';

export class ImageDownloader {
  private imageDir: string;
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  constructor(imageDir: string = './public/images') {
    this.imageDir = path.resolve(imageDir);
  }

  async downloadImages(
    imageUrls: string[],
    sourceUrl: string,
    articleId: string
  ): Promise<ExtractedImage[]> {
    await fs.mkdir(this.imageDir, { recursive: true });
    const downloaded: ExtractedImage[] = [];

    for (const imgUrl of imageUrls) {
      try {
        const absoluteUrl = ensureAbsoluteUrl(imgUrl, sourceUrl);
        const image = await this.downloadImage(absoluteUrl, articleId);
        if (image) downloaded.push(image);
      } catch (error) {
        console.warn(`Failed to download image ${imgUrl}:`, (error as Error).message);
      }
    }

    return downloaded;
  }

  private async downloadImage(imgUrl: string, articleId: string): Promise<ExtractedImage | null> {
    if (!imgUrl.match(/^https?:\/\//i)) return null;

    const ext = this.getExtension(imgUrl);
    const hash = crypto.createHash('md5').update(imgUrl).digest('hex').slice(0, 12);
    const filename = `${sanitizeFilename(articleId)}-${hash}.${ext}`;
    const localPath = path.join('images', filename);
    const fullPath = path.join(this.imageDir, filename);

    try {
      const response = await axios.get(imgUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': this.userAgent },
        maxRedirects: 5,
      });

      if (response.data.length > 10 * 1024 * 1024) {
        console.warn(`Image too large, skipping: ${imgUrl}`);
        return null;
      }

      await fs.writeFile(fullPath, Buffer.from(response.data));

      return {
        url: imgUrl,
        filename,
        localPath: `/images/${filename}`,
      };
    } catch (error) {
      console.warn(`Download failed: ${imgUrl} - ${(error as Error).message}`);
      return null;
    }
  }

  private getExtension(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i);
      if (match) {
        return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      }
    } catch {
      // ignore
    }
    return 'jpg';
  }
}
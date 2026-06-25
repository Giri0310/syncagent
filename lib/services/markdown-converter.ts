import TurndownService from 'turndown';

export class MarkdownConverter {
  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });

    // Keep images with local paths if needed; here we preserve original src
    this.turndown.addRule('image', {
      filter: 'img',
      replacement: (_content, node) => {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title');
        const titlePart = title ? ` "${title}"` : '';
        return src ? `![${alt}](${src}${titlePart})` : '';
      },
    });

    // Better link handling
    this.turndown.addRule('anchor', {
      filter: 'a',
      replacement: (content, node) => {
        const href = node.getAttribute('href') || '';
        const title = node.getAttribute('title');
        const titlePart = title ? ` "${title}"` : '';
        if (!href || content.trim().length === 0) return content;
        return `[${content}](${href}${titlePart})`;
      },
    });

    // Remove script/style tags
    this.turndown.remove(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form']);
  }

  convert(html: string): string {
    if (!html) return '';
    return this.turndown.turndown(html);
  }
}
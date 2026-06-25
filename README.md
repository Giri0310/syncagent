# Generic Content Sync Agent

A production-ready web application that analyzes websites, detects article pages, extracts content, downloads images, converts HTML to Markdown, prevents duplicates, and maintains sync history — all through a clean dashboard.

## Features

- **Website Analyzer**: Detects website type and discovers article URLs.
- **Content Extraction**: Extracts title, description, author, date, tags, images, and content.
- **Markdown Conversion**: Converts clean article HTML to Markdown.
- **Image Downloader**: Downloads and stores images locally.
- **Duplicate Detection**: Prevents importing the same article twice via URL and content hash checks.
- **Sync History**: Tracks every sync run with status and counts.
- **Dashboard**: Professional UI with real-time logs, articles, history, and schedules.
- **Scheduler**: Supports manual, daily, and weekly sync schedules.
- **Logging**: Detailed logs for sync start, articles found/imported, errors, and completion.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios
- Cheerio
- Turndown
- node-cron
- UUID

## Project Structure

```
generic-content-sync-agent/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # POST /api/analyze
│   │   ├── sync/route.ts          # POST /api/sync
│   │   ├── articles/route.ts      # GET /api/articles
│   │   ├── history/route.ts       # GET /api/history
│   │   ├── logs/route.ts          # GET /api/logs
│   │   ├── schedule/route.ts      # GET/POST /api/schedule
│   │   └── cron/route.ts          # Vercel cron-compatible trigger
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Dashboard.tsx
│   ├── SourceInput.tsx
│   ├── ArticlesViewer.tsx
│   ├── HistoryViewer.tsx
│   ├── LogsViewer.tsx
│   └── ScheduleSettings.tsx
├── lib/
│   ├── storage/
│   │   ├── storage-interface.ts
│   │   ├── json-storage.ts
│   │   └── storage-factory.ts
│   ├── services/
│   │   ├── analyzer.ts
│   │   ├── extractor.ts
│   │   ├── image-downloader.ts
│   │   ├── markdown-converter.ts
│   │   ├── duplicate-detector.ts
│   │   ├── logger.ts
│   │   ├── scheduler.ts
│   │   └── sync-service.ts
│   ├── types.ts
│   └── utils.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_FLOW.md
│   ├── DEPLOYMENT.md
│   └── TESTING.md
├── public/images/                 # Downloaded images
├── data/                          # JSON storage
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── vercel.json
├── .env.example
├── .env.local
└── README.md
```

## Installation

### Prerequisites

- Node.js >= 18
- npm

### Steps

```bash
# Clone the repository
git clone https://github.com/Giri0310/syncagent.git
cd syncagent

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and adjust values:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_ADAPTER` | `json` | Storage backend (`json`) |
| `DATA_DIR` | `./data` | Directory for JSON files |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public app URL |
| `CRON_SECRET` | (empty) | Secret for protecting `/api/cron` |

## Usage

1. Enter a source website URL (e.g., a blog homepage).
2. Click **Analyze Website** to discover article pages.
3. Click **Start Sync** to extract and import articles.
4. View imported articles, sync history, logs, and schedules in their respective tabs.
5. Configure manual, daily, or weekly sync schedules.

## Build & Deploy

### Local Build

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Data Flow

See [docs/DATA_FLOW.md](docs/DATA_FLOW.md).

## Testing

See [docs/TESTING.md](docs/TESTING.md).

## Important Notes

- In serverless environments like Vercel, scheduling with `node-cron` is not persistent. Use the configured Vercel Cron Jobs (`/api/cron`) for reliable scheduled execution.
- JSON file storage works locally; for production scale, switch to a managed database.
- Respect robots.txt and terms of service when scraping third-party websites.
- Some websites may block automated requests; the analyzer includes a realistic User-Agent and retry logic.

## License

MIT

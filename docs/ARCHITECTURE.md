# Architecture

## Overview

The Generic Content Sync Agent is a full-stack Next.js application that follows a modular service-oriented architecture. It separates concerns into storage, services, API routes, and UI components.

## High-Level Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Next.js App Router                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Dashboard   │  │  API Routes  │  │  Image Static Serving  │  │
│  │   (Pages)    │  │   (Server)   │  │        (Public)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘  │
└─────────┼─────────────────┼────────────────────────────────────────┘
          │                 │
          │                 ▼
          │        ┌──────────────────┐
          │        │  Sync Service    │
          │        │  Orchestrator    │
          │        └────────┬─────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Service Layer                           │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │  Website   │ │  Content   │ │    Image     │ │ Markdown  │ │
│  │  Analyzer  │ │  Extractor │ │  Downloader  │ │ Converter │ │
│  └────────────┘ └────────────┘ └──────────────┘ └───────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐                │
│  │ Duplicate│ │   Logger   │ │  Scheduler   │                │
│  │ Detector │ │            │ │   Service    │                │
│  └────────────┘ └────────────┘ └──────────────┘                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Storage Layer                           │
│  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│  │   JsonStorage        │  │   Future: PostgreSQL/SQLite    │ │
│  │   (data/db.json)     │  │   via StorageInterface adapter   │ │
│  └──────────────────────┘  └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Layers

### 1. Presentation Layer

- **Dashboard.tsx**: Main container with tabs.
- **SourceInput.tsx**: URL input and action triggers.
- **ArticlesViewer.tsx**: Browse and read imported articles.
- **HistoryViewer.tsx**: Sync run history.
- **LogsViewer.tsx**: Real-time log viewer with filters.
- **ScheduleSettings.tsx**: Configure sync schedules.

### 2. API Layer

Next.js Route Handlers:
- `POST /api/analyze` — Analyze a website and return discovered article URLs.
- `POST /api/sync` — Run a sync job.
- `GET /api/articles` — List imported articles.
- `GET /api/history` — List sync history.
- `GET /api/logs` — List logs.
- `GET/POST /api/schedule` — Manage schedules.
- `GET /api/cron` — Vercel Cron Jobs trigger.

### 3. Service Layer

- **SyncService**: Orchestrates the analysis and sync pipeline.
- **WebsiteAnalyzer**: Fetches and analyzes websites to discover article links.
- **ContentExtractor**: Extracts article data from discovered pages.
- **ImageDownloader**: Downloads images to `public/images/`.
- **MarkdownConverter**: Converts extracted HTML content to Markdown.
- **DuplicateDetector**: Prevents duplicate imports via URL and content hash.
- **Logger**: Stores structured logs.
- **SchedulerService**: Manages cron-based scheduling.

### 4. Storage Layer

- **StorageInterface**: Abstract storage contract.
- **JsonStorage**: File-based JSON implementation for zero-config setup.
- **StorageFactory**: Creates the configured storage adapter.

## Design Principles

1. **Modularity**: Each service has a single responsibility.
2. **Extensibility**: New storage backends can be added by implementing `StorageInterface`.
3. **Resilience**: Retry logic, error boundaries, and detailed logging.
4. **Type Safety**: Full TypeScript coverage.

## Data Models

- **Article**: Imported content with metadata, images, Markdown content, and hashes.
- **SyncHistoryEntry**: Record of each sync run.
- **LogEntry**: Timestamped log messages.
- **ScheduleConfig**: Recurrence rules for automatic sync.

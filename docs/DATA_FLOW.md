# Data Flow

## User Initiates Sync

```
┌──────────┐    POST /api/sync     ┌──────────────┐
│  Browser │ ────────────────────▶ │  SyncService │
└──────────┘                       └──────┬───────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  WebsiteAnalyzer │
                                 │    .analyze()    │
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  Discover Links  │
                                 │  Detect Selectors│
                                 │  Classify Site   │
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │ ContentExtractor │
                                 │ .extractFromAnalysis()
                                 └────────┬─────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
   ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
   │   Extract    │               │   Download   │               │   Convert    │
   │   Metadata   │               │    Images    │               │ HTML → MD    │
   └──────────────┘               └──────────────┘               └──────────────┘
          │                               │                               │
          └───────────────┬───────────────┴───────────────────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Duplicate  │
                   │   Detector   │
                   └──────┬───────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        ┌──────────┐            ┌──────────┐
        │ Duplicate│            │  New     │
        │  Skip    │            │  Save    │
        └──────────┘            └────┬─────┘
                                     │
                                     ▼
                            ┌──────────────┐
                            │   Storage    │
                            │  (articles)  │
                            └──────┬───────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │  Sync History + Logs      │
                     └───────────────────────────┘
                                   │
                                   ▼
                            ┌──────────┐
                            │  Browser │
                            │ Dashboard│
                            └──────────┘
```

## Scheduled Sync Flow

```
┌────────────────┐     ┌─────────────┐     ┌─────────────┐
│ Vercel Cron /  │────▶│ /api/cron   │────▶│ Scheduler   │
│ node-cron      │     │             │     │ Service     │
└────────────────┘     └─────────────┘     └──────┬──────┘
                                                  │
                                                  ▼
                                          ┌───────────────┐
                                          │ SyncService   │
                                          │    .sync()    │
                                          └───────────────┘
```

## Storage Flow

All writes go through the storage abstraction:

```
Service ──▶ StorageInterface ──▶ JsonStorage ──▶ data/db.json
```

Entities persisted:
- `articles` — imported articles, keyed by ID.
- `syncHistory` — each sync run.
- `logs` — up to the last 1000 log entries.
- `schedules` — recurring sync schedules.

## Duplicate Detection

1. URL already exists in storage → skip.
2. Content hash (SHA-256 of URL + title + stripped content) already exists → skip.
3. Otherwise → save as new article.

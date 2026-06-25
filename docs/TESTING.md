# Testing Guide

## Manual Testing

### 1. Start the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 2. Analyze a Website

1. Enter a blog homepage URL, e.g., `https://example-blog.com`.
2. Click **Analyze Website**.
3. Verify:
   - Website type is detected.
   - Article count is shown.
   - Sample article URLs are listed.

### 3. Sync Content

1. Click **Start Sync**.
2. Wait for the sync to complete.
3. Verify:
   - Sync result shows found/imported/skipped counts.
   - Articles tab displays imported articles.
   - History tab shows the sync run.
   - Logs tab records sync events.

### 4. Duplicate Detection

1. Run sync again with the same URL.
2. Verify `articlesSkipped` increases and no duplicates appear in the articles tab.

### 5. Scheduling

1. Go to the **Schedule** tab.
2. Enter a source URL, select **Daily**, and set a time.
3. Save the schedule.
4. Verify it appears in the active schedules list.

### 6. Cron Trigger

```bash
curl "http://localhost:3000/api/cron"
```

If `CRON_SECRET` is set, include it:

```bash
curl "http://localhost:3000/api/cron?secret=change-me-in-production"
```

## Automated Testing

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Build Test

```bash
npm run build
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Website returns 403 | Target site may block scrapers. Try a different site or add proxy headers. |
| No articles found | The site may use JS rendering. Consider adding a headless browser for SPAs. |
| Build fails | Run `npm run typecheck` and fix type errors. |
| Files not persisted on Vercel | Vercel filesystem is ephemeral; use Vercel Postgres or similar. |

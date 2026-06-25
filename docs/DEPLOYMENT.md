# Deployment Guide

## Deploy to Vercel (Recommended)

### Prerequisites

- [Vercel account](https://vercel.com/signup)
- Vercel CLI: `npm i -g vercel`

### Steps

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy from project root**
   ```bash
   cd syncagent
   vercel
   ```
   Follow the prompts to link to your GitHub repository or deploy directly.

3. **Set environment variables**
   In the Vercel dashboard, add:
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
   - `CRON_SECRET` = a strong random string

4. **Configure cron jobs**
   The `vercel.json` already defines an hourly cron job pointing to `/api/cron`. Vercel will pick it up automatically.

5. **Redeploy**
   ```bash
   vercel --prod
   ```

## Deploy to Railway / Render

1. Push code to GitHub.
2. Create a new project on Railway or Render.
3. Connect your GitHub repository.
4. Build command: `npm run build`
5. Start command: `npm start`
6. Add environment variables from `.env.example`.

## Production Considerations

### Cron Jobs

`node-cron` runs only while the Node.js process is alive. On serverless platforms, use an external cron or Vercel Cron Jobs, which are configured in `vercel.json`.

### Storage

JSON file storage works for local development but not for multi-instance or serverless production workloads because the filesystem is ephemeral. For production:

- Use Vercel Postgres, Neon, Supabase, or Railway Postgres.
- Implement a `PostgresStorage` adapter implementing `StorageInterface`.
- Set `STORAGE_ADAPTER=postgres` once implemented.

### Security

- Set a strong `CRON_SECRET` to protect `/api/cron`.
- Do not commit `.env.local` to Git (it is listed in `.gitignore`).
- Be mindful of robots.txt and terms of service when scraping external sites.

### Environment Variables

| Variable | Production Value | Required |
|----------|------------------|----------|
| `NEXT_PUBLIC_APP_URL` | Public URL of deployed app | Yes |
| `CRON_SECRET` | Strong random string | Recommended |
| `STORAGE_ADAPTER` | `json` (or future adapter) | No (defaults to json) |
| `DATA_DIR` | `./data` | No |

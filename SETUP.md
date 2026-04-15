# L'Oxygène Setup Guide

## Supabase Setup
1. Go to https://supabase.com and create free account
2. Create new project (name: loxygene)
3. Go to Settings → API
4. Copy: Project URL and anon/public key
5. Paste into .env.local:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```
6. Go to SQL Editor in Supabase dashboard
7. Copy and run the contents of `lib/supabase/schema.sql`

## Zoom Video SDK Setup
1. Go to https://marketplace.zoom.us
2. Create account → Build App → Video SDK
3. Copy SDK Key and SDK Secret
4. Paste into .env.local:
   ```
   NEXT_PUBLIC_ZOOM_SDK_KEY=xxx
   ZOOM_SDK_SECRET=xxx
   ```
   > Note: `ZOOM_SDK_SECRET` has no `NEXT_PUBLIC_` prefix — it stays server-side only.

## YouTube Data API Setup
1. Go to https://console.cloud.google.com
2. Create project → Enable YouTube Data API v3
3. Create credentials → API Key
4. Paste into .env.local:
   ```
   YOUTUBE_API_KEY=xxx
   ```
   > Note: `YOUTUBE_API_KEY` has no `NEXT_PUBLIC_` prefix — it stays server-side only.

## Full .env.local Example
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Zoom Video SDK
NEXT_PUBLIC_ZOOM_SDK_KEY=your_zoom_sdk_key_here
ZOOM_SDK_SECRET=your_zoom_sdk_secret_here

# YouTube Data API (server-side only)
YOUTUBE_API_KEY=your_youtube_api_key_here
```

## Running Locally
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Demo Mode
If any service credentials are missing, the app runs in **Demo Mode** with mock data:
- Chat: local mock messages (no real-time sync)
- Video: WebRTC local camera only (no multi-party)
- Song search: curated mock song list
- Rooms: static mock room list

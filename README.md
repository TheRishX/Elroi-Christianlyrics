# SongLight Christian Lyrics

Mobile-first Christian lyrics search engine for Hindi, Nepali, and English songs.

## Local development

```bash
npm install
npm run dev
```

Without `WORDPRESS_API_URL`, the app uses a small local fixture catalogue so the UI can be reviewed immediately. Copy `.env.example` to `.env.local` when connecting WordPress.

## WordPress

Install `wordpress-plugin/christian-lyrics-api/christian-lyrics-api.php` in WordPress. The plugin is the starting integration layer for the `song` post type and REST API. Production fields should be registered as structured post meta (or through an agreed field plugin) and populated with section-based lyric JSON.

## Admin

The branded entry point is `/jesus`. The current UI is a safe scaffold; production login must be wired to secure server-side session validation using `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET`. Never commit plaintext credentials.

## Deployment

Deploy the Next.js app to Vercel, configure the environment variables in `.env.example`, then configure the WordPress webhook environment values to point to the Vercel revalidation route.

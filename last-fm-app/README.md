<div align="center">

![next.fm](public/next.svg)

# next.fm

A Last.fm-powered social music experience built with Next.js and NextAuth.

</div>

## Overview

next.fm blends the familiarity of Last.fm scrobbling with a social feed inspired by Instagram. Users authenticate with their Last.fm account, choose an anonymous username, and land in a dashboard that highlights their listening history, current track, and weekly top artists. A right-hand sidebar surfaces the live listening status of the friends they follow.

This project is configured for deployment on Vercel and uses MongoDB for persistence.

## Tech Stack

- [Next.js 14 (App Router)](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [NextAuth.js](https://next-auth.js.org/) with a custom Last.fm provider
- [MongoDB](https://www.mongodb.com/) + `@next-auth/mongodb-adapter`
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/) for hosting

## Features

- 🔐 Last.fm authentication with a 1-month session
- 🪪 Anonymous username onboarding flow
- 🎧 Real-time “Now Playing” card powered by Last.fm
- 📻 Scrollable listening history pulled from scrobbles
- 📈 Weekly top artist chart
- 👥 Friend sidebar that mirrors Discord-style presence (based on follow graph)
- 🧱 Responsive sidebar layout ready for future modules (society, events, posts)

## Getting Started

### Prerequisites

- Node.js 18.17+ (or 20+ LTS recommended)
- npm (included with Node) or your favourite package manager
- MongoDB database (MongoDB Atlas, DocumentDB, etc.)
- Last.fm API key + secret ([create here](https://www.last.fm/api/account/create))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example environment file and fill in your secrets:

```bash
cp .env.example .env
```

Update the variables in `.env`:

```
NEXTAUTH_URL=http://localhost:3000        # your local dev URL or deployed domain
NEXTAUTH_SECRET=replace-with-strong-secret # generate via `openssl rand -base64 32`
LASTFM_API_KEY=your-lastfm-api-key         # from Last.fm dashboard
LASTFM_API_SECRET=your-lastfm-api-secret   # from Last.fm dashboard
NEXTAUTH_DEBUG=true                        # optional: verbose auth logs in development
MONGODB_URI=mongodb+srv://...              # MongoDB connection string
MONGODB_DB=nextfm                          # Optional: override database name
```

> **Tip:** When deploying to Vercel, set the same variables in the project’s Environment Variables tab. `NEXTAUTH_URL` should point to the production domain (e.g. `https://nextfm.vercel.app`).

### 3. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to sign in with Last.fm and explore the dashboard.

## Project Structure

```
app/
  (auth)/                 → Auth-only routes (`/signin`, `/onboarding`)
  (dashboard)/            → Authenticated experience, including `/`, `/profile`, `/society`, `/events`, `/posts/create`
  api/                    → Route handlers (NextAuth, username onboarding)
components/
  ui/                     → shadcn/ui components
  ...                     → Feature-specific building blocks
lib/
  auth.ts                 → NextAuth configuration
  lastfm.ts               → Last.fm API helpers
  friends.ts              → Friend/follow utilities
  mongodb.ts              → MongoDB connection helper
  users.ts                → User persistence helpers
types/                    → TypeScript module augmentation (NextAuth)
```

## Available Scripts

- `npm run dev` – start the local development server
- `npm run build` – create a production build
- `npm run start` – run the production build locally
- `npm run lint` – run ESLint across the project

## Deployment

1. Push your changes to GitHub/GitLab.
2. Create a new Vercel project and import the repository.
3. Add all required environment variables in the Vercel dashboard.
4. Trigger the first deployment; Vercel will run `npm install`, `npm run build`, and `npm start`.

MongoDB Atlas is an easy drop-in choice—allow access from Vercel’s IP ranges or enable `0.0.0.0/0` (with caution) while you test.

## Roadmap Ideas

- Rich post composer with album artwork previews
- Reactions and comments on listening history
- Live event rooms with synchronized playback
- Daily/weekly listening stories and badges

---

Happy listening! 🎶

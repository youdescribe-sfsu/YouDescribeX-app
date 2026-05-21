# YouDescribeX App — CLAUDE.md

## What This Project Is

React frontend (TypeScript) for **YouDescribeX** — a platform for creating and publishing audio descriptions for YouTube videos, making video content accessible to blind/low-vision users.

---

## Local Dev

```bash
npm start        # Dev server at http://localhost:3000
npm run build    # Production build
npm test         # Run tests
npm run lint     # ESLint check
npm run lint:fix # Auto-fix lint issues
npm run format   # Prettier format
```

**Backend required:** The app expects the API at `http://localhost:4001` (YouDescribeX-api repo). Start the API server before running the frontend.

---

## Environment

`.env` contains development defaults (committed). Key vars:

```
PORT=3000
REACT_APP_YDX_BACKEND_URL=http://localhost:4001
REACT_APP_REDIRECT_URL=http://localhost:4001
REACT_APP_YOUTUBE_API_URL=https://www.googleapis.com/youtube/v3
REACT_APP_ENVIRONMENT=development
```

Override locally with `.env.local` (git-ignored).

---

## Key Directories

```
src/
├── pages/              # Route-level page components
│   ├── YDXHome.tsx    # Main audio description editor (large file ~22k lines)
│   ├── Video/          # Video playback page
│   ├── Home/           # Landing page
│   ├── Profile/        # User profile
│   └── Search/         # Video search
├── features/           # Feature modules used within pages
│   ├── Describe/       # Audio clip editing (AudioClip, EditClip, InsertPublish, etc.)
│   ├── Tutorial/       # Onboarding tutorial system (Zustand store)
│   └── Video/          # Video player features
├── shared/
│   ├── config.ts       # All API URLs, YouTube config, constants — start here
│   ├── types/          # TypeScript type definitions
│   ├── components/     # Reusable UI (Navbar, Footer, Spinner)
│   └── utils/          # Helpers: YouTubeService, ourFetch, converters
└── App.tsx             # Routing setup + Zustand userDataStore init
```

---

## Architecture Notes

- **State management:** Zustand (`userDataStore` in App.tsx, `tutorialStore` in features/Tutorial)
- **HTTP:** Axios for most requests; `ourFetch.ts` (XMLHttpRequest wrapper) for some custom calls
- **Audio:** Howler.js for playback, react-media-recorder for recording
- **YouTube player:** react-youtube component
- **Routing:** React Router v6
- **Build tool:** Create React App + Craco (webpack customization, no eject needed)
- **Path alias:** `@/` → `src/`
- **Caching:** localStorage (30-min TTL for video data), sessionStorage for participant IDs

---

## Backend Integration (YouDescribeX-api)

| What               | Where                                            |
| ------------------ | ------------------------------------------------ |
| API base           | `http://localhost:4001/api`                      |
| YouTube proxy      | `http://localhost:4001/api/youtube-proxy/videos` |
| Audio file serving | `http://localhost:4001/api/static/<clip_path>`   |
| Auth               | Google OAuth via backend                         |

Changes to API contracts (routes, payloads, auth) need matching updates in both repos.

---

## Code Quality

- TypeScript strict mode enabled
- ESLint + Prettier enforced
- Pre-commit hooks via Husky (lint runs on commit)
- Run `npm run lint:fix && npm run format` before committing if hooks block you

---

## External Services

- **Google OAuth** — user authentication
- **YouTube Data API v3** — video metadata
- **LogRocket** — error/session logging (`zs1fnc/youdescribex-dev`)
- **Google Analytics** (GA3 + GA4)

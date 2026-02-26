# Coreq

> **The fastest way to talk to APIs.** A keyboard-first HTTP client inspired by Postman, HTTPie, and Raycast.

Dark mode only · PWA-installable · No account required · Works fully offline

---

## Features

|                              |                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| **Command Palette** `Ctrl+K` | Fuzzy-search across every request, collection, environment, and history entry               |
| **Multi-tab workspace**      | VS Code-style preview tabs — opening from sidebar reuses a slot until you interact          |
| **Request editor**           | Params, headers, body (JSON / form-data / URL-encoded / XML), Bearer / Basic / API-key auth |
| **Response viewer**          | JSON syntax highlighting, raw ↔ pretty toggle, copy & download                              |
| **Collections**              | Nested folders, context menus, rename, import/export JSON                                   |
| **Postman import**           | Drag in any Postman v2.0 or v2.1 collection — multiple files at once                        |
| **Environments**             | `{{variable}}` interpolation, secret masking, per-env activation                            |
| **History**                  | Last 200 requests, one-click reopen                                                         |
| **cURL**                     | Import from cURL string, export any request as cURL                                         |
| **PWA**                      | Installable on desktop/mobile, works offline                                                |

---

## Keyboard Shortcuts

| Shortcut             | Action               |
| -------------------- | -------------------- |
| `Ctrl / ⌘ + K`       | Open command palette |
| `Ctrl + Enter`       | Send request         |
| `Ctrl + T`           | New tab              |
| `Ctrl + W`           | Close current tab    |
| Middle-click tab     | Close tab            |
| `Ctrl + Tab`         | Next tab             |
| `Ctrl + Shift + Tab` | Previous tab         |
| `Ctrl + 1 – 9`       | Jump to tab N        |

---

## Stack

**Frontend** — Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4  
**State** — Zustand + localStorage (no server needed for core usage)  
**Backend** — NestJS 10 · Prisma 5 · PostgreSQL (optional — for sync/auth)  
**Auth** — JWT (passport-jwt) · bcryptjs  
**Search** — fuse.js client-side · pg_trgm + tsvector server-side

---

## Getting Started

### Option A — Docker (recommended)

```bash
git clone https://github.com/your-username/coreq
cd coreq

cp .env.example .env
# Open .env and change POSTGRES_PASSWORD and JWT_SECRET

docker compose up --build
```

- Frontend → http://localhost:3000
- API → http://localhost:3001
- Swagger → http://localhost:3001/api/docs

PostgreSQL data persists in a named Docker volume across restarts.

### Option B — Local development

**Prerequisites:** Node 20+, PostgreSQL 14+

```bash
# Frontend
npm install
npm run dev        # http://localhost:3000

# Backend (separate terminal)
cd backend
npm install
cp ../.env.example .env   # edit DATABASE_URL
npx prisma generate
npx prisma db push
npm run start:dev  # http://localhost:3001
```

---

## Project Structure

```
coreq/
├── app/
│   ├── api/proxy/route.ts    # Server-side proxy (fixes CORS for any external API)
│   ├── manifest.ts           # PWA manifest
│   └── page.tsx              # App entry point
├── components/
│   ├── collections/          # Sidebar tree with context menus
│   ├── command-palette/      # cmdk + fuse.js fuzzy search
│   ├── environment/          # Variable editor
│   ├── history/              # Request history panel
│   ├── layout/               # Header, tabs, sidebar nav, modals
│   ├── request/              # URL bar, params/headers/body/auth editors
│   ├── response/             # Status, body viewer, headers
│   └── ui/                   # Button, Input, Badge, Tooltip, Resizable...
├── hooks/
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── http-client.ts        # Sends requests via /api/proxy
│   ├── types.ts              # Shared TypeScript types
│   └── utils.ts              # Postman parser, cURL, env interpolation...
├── store/                    # Zustand stores (persisted to localStorage)
│   ├── collections-store.ts
│   ├── environment-store.ts
│   ├── history-store.ts
│   ├── request-store.ts      # Tabs + draft requests + responses
│   └── ui-store.ts
├── public/sw.js              # Service worker (PWA offline cache)
├── Dockerfile
├── docker-compose.yml
└── backend/
    ├── src/
    │   ├── auth/             # JWT register/login
    │   ├── collections/      # CRUD
    │   ├── environments/     # CRUD + variables
    │   ├── history/          # Paginated list
    │   ├── requests/         # CRUD
    │   └── search/           # pg_trgm full-text search
    ├── prisma/schema.prisma
    └── Dockerfile
```

---

## How the CORS proxy works

All HTTP requests go through `POST /api/proxy` — a Next.js route that runs server-side in Node.js. The browser calls the same origin; the server makes the real outbound request with no browser CORS restrictions. Your custom headers, auth tokens, and body are forwarded as-is. Response body, status, headers, and timing are returned to the client.

---

## Environment Variables

Copy `.env.example` to `.env`. Required fields:

| Variable            | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `POSTGRES_USER`     | PostgreSQL username                                              |
| `POSTGRES_PASSWORD` | PostgreSQL password — **change this**                            |
| `POSTGRES_DB`       | Database name                                                    |
| `DATABASE_URL`      | Full connection string (auto-built by compose)                   |
| `JWT_SECRET`        | Secret for signing tokens — **min 32 chars, change this**        |
| `JWT_EXPIRES_IN`    | Token lifetime e.g. `7d`                                         |
| `FRONTEND_URL`      | Allowed CORS origin for the backend e.g. `http://localhost:3000` |

---

## License

MIT

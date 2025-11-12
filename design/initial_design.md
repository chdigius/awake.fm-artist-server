# Awake.fm Artist Server — Design Doc (v0.1)

> **TL;DR**: A content-first, flat-file artist node that compiles Markdown/YAML into normalized JSON for any frontend to consume. Runs in two modes: **Full Node (Engine + UI + Network)** and **Static Site (prebuilt JSON + SPA)**. The backend is a headless **engine** (Quart) that validates, indexes, and serves content, streams media via signed URLs, and participates in the Awake.fm network. The frontend is a pluggable client (Vue by default) that renders the JSON.

---

## 1. Objectives

* **Artist-owned content**: Source of truth is flat files (Markdown/YAML) + media on disk.
* **Decoupled architecture**: Backend (engine) and frontend (UI) are independent; communicate via a stable JSON/WS contract.
* **Two hosting modes**:

  1. **Full Node** (backend + network features)
  2. **Static Site** (prebuilt JSON deployed anywhere)
* **Network-ready**: Nodes can register/announce to the Awake.fm mothership and discover peers.
* **Security posture**: Media served via short-TTL signed URLs; CORS allowlist; future Blackveil hooks.
* **Upgrade path**: Optional migration from file-only index to DB-backed search/analytics without breaking DTOs.

---

## 2. Non-Goals (for v0.1)

* No multi-tenant hosting. One repo = one artist node.
* No WYSIWYG admin editor initially (writes happen via Git/manual edits).
* No public-facing likes/follower counts.
* No blockchain/IPFS dependencies.

---

## 3. Modes of Operation

### 3.1 Full Node Mode (Engine + UI)

* **Engine (Quart)** reads `content/`, validates YAML against schemas, compiles an in-memory index **and** JSON artifacts under `build/`.
* Serves REST endpoints under `/v1/*`, WebSocket at `/v1/ws`, and issues signed media URLs.
* Optional nginx handles static assets and `/media`.

### 3.2 Static Site Mode (Frontend-only)

* CLI `awake build` compiles JSON bundle to `/build`.
* SPA is configured to read from `/data` (mapped to `/build`) instead of `/v1`.
* No network participation, no signed URLs (media is public or fronted by host rules).

---

## 4. Repository Layout (v0.1)

```
awake.fm-artist-server/
│
├─ content/                # Source-of-truth data & media
│  ├─ server.yaml
│  ├─ artist/
│  │   ├─ index.yaml
│  │   ├─ pages/
│  │   └─ music/
│  │       ├─ albums/
│  │       ├─ singles/
│  │       └─ sets/
│  └─ media/               # Optional consolidated media path
│
├─ build/                  # Auto-generated JSON bundle (gitignored)
│  ├─ server.json
│  ├─ artist.json
│  ├─ albums/
│  ├─ tracks/
│  └─ sets/
│
├─ backend/                # Quart engine — the node's logic layer
│  ├─ app.py
│  ├─ core/
│  │   ├─ indexer.py       # walks /content → /build
│  │   ├─ validator.py     # JSON Schema validation
│  │   ├─ media.py         # signed URL gen / probing
│  │   └─ config.py
│  ├─ api/
│  │   ├─ routes_albums.py
│  │   ├─ routes_tracks.py
│  │   ├─ routes_sets.py
│  │   ├─ routes_server.py
│  │   └─ routes_network.py
│  ├─ ws/
│  │   └─ socket.py
│  ├─ schemas/
│  ├─ cli/
│  │   ├─ build.py         # awake build
│  │   ├─ serve.py         # awake serve
│  │   └─ watch.py
│  ├─ Dockerfile
│  └─ requirements.txt
│
├─ frontend/               # Default pluggable Vue SPA
│  ├─ src/
│  │   ├─ views/
│  │   ├─ components/
│  │   ├─ api/
│  │   │   └─ client.js
│  │   ├─ App.vue
│  │   └─ main.js
│  ├─ public/
│  ├─ vite.config.js
│  ├─ package.json
│  └─ vercel.json
│
├─ .awake.yaml             # repo-wide config
├─ docker-compose.yml
├─ README.md
└─ LICENSE
```

### 4.1 Layer Responsibilities

* **content/**: artist’s actual creative data (YAML, markdown, media). Single source of truth.
* **build/**: compiled, validated, normalized JSON (acts as the interface shared between frontend and backend).
* **backend/**: core engine that indexes, validates, serves, and participates in the Awake.fm network.
* **frontend/**: optional Vue UI; replaceable with any framework as long as it consumes the JSON contract.

### 4.2 Workflow Summary

1. Artist edits content (YAML/Markdown/media) in `content/`.
2. Backend indexer validates and compiles to `build/`.
3. Frontend consumes JSON from `build/` (static) or `/v1/*` (dynamic).
4. Networked nodes register and sync through the backend.

### 4.3 Deployment Modes

* **Full Node Mode**: Backend + Frontend served together (Docker, Cloudflared, or local).
* **Static Mode**: `awake build` → deploy `/build` and `/frontend/dist` to any static host (e.g., Vercel, Netlify).

---

Next section will define data structures, DTOs, and schema validation for the `content/` tree.

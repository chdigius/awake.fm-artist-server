# Awake.fm Artist Node - Feature Backlog

This document tracks enhancement ideas and future features for the Artist Node system.

---

## Audio Player v1.0 TODO

**Goal:** Solid, polished global audio player for first production release.

### Core Features (Must Have)
- [x] **Deep linking for tracks with timestamps** - ✅ COMPLETE
  - ✅ `id="track-{trackId}"` on SetCard components
  - ✅ Wrapped in `<a href="#track-{trackId}">` for native right-click support
  - ✅ URL hash updates when track plays (History API)
  - ✅ Page load: parse hash → find page → scroll → auto-play
  - ✅ **Timestamp support (YouTube-style):**
    - ✅ Share button copies URL with timestamp: `#track-xyz&t=47:23`
    - ✅ Parse timestamp from URL → seek BEFORE play starts
    - ✅ Support both `47:23` (MM:SS) and `2843` (seconds) formats
    - ✅ Share button tooltip shows current timestamp: "Share (at 47:23)"
    - ✅ Copy toast notification
  - ✅ **Active track highlighting** - Theme-aware pulsing glow on currently playing track
  - ✅ Backend `/api/collection/find-track` endpoint for paginated collections
  - ✅ `useAudioCard` composable for reusable track logic
  - **Implementation notes:**
    - Uses `window.__pendingSeekTimestamp` for pre-play seeking
    - Highlight tied to `playerStore.currentTrack` (works across pages)
    - CollectionBlock handles deep link detection and page loading
    - SetCard highlight uses `var(--color-accent)` for theme integration
- [x] **History dropdown/combo selector** - ✅ COMPLETE
  - ✅ Click track title to open history panel
  - ✅ Most recent tracks first (reversed order)
  - ✅ Stays open for rapid track switching (power user mode)
  - ✅ Close button in header (✕)
  - ✅ Left-click track → plays immediately (no history reordering)
  - ✅ Right-click track → native browser context menu (Copy Link, Open in New Tab)
  - ✅ History items are proper `<a>` tags with `href` for deep links
  - ✅ Theme-aware styling with glassmorphism
  - ✅ Proper text truncation with visible play icons
  - ✅ Slide-down animation
  - ✅ Track count indicator
  - **Implementation notes:**
    - `playerStore.play(track, addToHistory: false)` prevents reordering when playing from history
    - History limited to 50 tracks (configurable)
    - Better UX than Beatport! 🔥
- [ ] **Previous/Next navigation** - Walk through history with buttons
- [ ] **Visual polish pass** - Smooth transitions, hover states, loading indicators
- [ ] **Mobile responsive testing** - Ensure all controls work on touch devices
- [ ] **Keyboard shortcuts** - Spacebar (play/pause), arrow keys (seek), M (mute)
- [ ] **Volume slider** - Replace mute toggle with full volume control
- [ ] **Loading states** - Show spinner/progress during track load
- [ ] **Error handling** - Graceful failures for missing files, network issues
- [ ] **Accessibility** - ARIA labels, keyboard navigation, screen reader support

### Nice to Have (If Time Allows)
- [ ] **Browser media session API** - Show in OS media controls (Windows/Mac/mobile)
- [ ] **Persist player state** - Remember volume, position on page refresh (localStorage)
- [ ] **Visualizer presets** - Let users cycle through different visualizers
- [ ] **Track progress tooltips** - Hover over progress bar → show timestamp
- [ ] **Playback speed control** - 0.5x to 2.0x for DJ sets/podcasts

---

## History → Playlist → Commerce Pipeline

### History Persistence & Sync (v1.5)
**Status:** Design phase  
**Priority:** High (Post-v1.0)

**Vision:** Two-tier history system: LocalStorage for anonymous users, Mothership sync for authenticated users.

**Core Principle:** Artist node stays stateless. No user accounts, no database. History lives in browser (anonymous) or mothership (authenticated).

---

#### LocalStorage History (Anonymous Users)
**No account needed. Privacy-first. Works offline.**

**Features:**
- [ ] **Store history in localStorage** - Per-artist key: `awake_fm_history_{artistSlug}`
- [ ] **Restore on page load** - Check localStorage, populate playerStore.history
- [ ] **Max 50 tracks** - Prevent localStorage bloat, FIFO eviction
- [ ] **Clear button wipes localStorage** - Confirmation dialog, clears local history
- [ ] **Separate history per artist** - Each artist node has its own localStorage key

**Implementation:**
```typescript
// On mount (GlobalPlayerBar.vue or App.vue)
const artistSlug = 'ishimura' // from route or config
const storageKey = `awake_fm_history_${artistSlug}`
const savedHistory = localStorage.getItem(storageKey)
if (savedHistory) {
  playerStore.history = JSON.parse(savedHistory)
}

// On track play (watch playerStore.history)
watch(() => playerStore.history, (newHistory) => {
  localStorage.setItem(storageKey, JSON.stringify(newHistory))
}, { deep: true })
```

**Why this is great:**
- **Zero friction:** No signup, just play music
- **Privacy:** Data never leaves browser
- **Offline-first:** Works even if artist node is static HTML
- **Per-artist isolation:** Each artist's history is separate

---

#### Mothership Sync (Authenticated Users)
**Optional. User creates account on mothership. History syncs across devices and artist nodes.**

**Features:**
- [ ] **Mothership user accounts** - Signup/login on awake.fm
- [ ] **History API endpoints** - GET/POST /api/user/history/{artistSlug}
- [ ] **Auth check on artist node** - Check if user logged in to mothership
- [ ] **Fetch history from mothership** - On page load, if authenticated
- [ ] **Sync history to mothership** - On track play, POST to mothership API
- [ ] **Fallback to localStorage** - If mothership offline or user logged out
- [ ] **Cross-device sync** - Same history on phone, laptop, work PC

**Technical architecture:**
- **Mothership API:**
  ```yaml
  GET /api/user/history/{artistSlug}
    - Returns user's history for specific artist
    - Artist node calls this on mount (if authenticated)
    - Response: { history: [...], historyIndex: 5 }

  POST /api/user/history/{artistSlug}
    - Syncs history from artist node to mothership
    - Called on track play, or on interval (debounced)
    - Body: { history: [...], historyIndex: 5 }
  ```

- **Artist node integration:**
  ```typescript
  // On mount
  const isAuthenticated = await checkMothershipAuth()
  if (isAuthenticated) {
    const { history } = await fetch(`https://awake.fm/api/user/history/${artistSlug}`)
    playerStore.history = history
  } else {
    // Fallback to localStorage
    const localHistory = localStorage.getItem(storageKey)
    playerStore.history = JSON.parse(localHistory || '[]')
  }

  // On track play
  if (isAuthenticated) {
    await fetch(`https://awake.fm/api/user/history/${artistSlug}`, {
      method: 'POST',
      body: JSON.stringify({ history: playerStore.history })
    })
  } else {
    localStorage.setItem(storageKey, JSON.stringify(playerStore.history))
  }
  ```

- **Mothership user data model:**
  ```json
  {
    "userId": "user_123",
    "email": "fan@example.com",
    "history": {
      "ishimura": [
        { "filename": "neon-dreams.mp3", "playedAt": "2026-01-27T..." }
      ],
      "rom_trooper": [
        { "filename": "cyberpunk-rain.mp3", "playedAt": "2026-01-27T..." }
      ]
    },
    "historyIndex": {
      "ishimura": 5,
      "rom_trooper": 2
    }
  }
  ```

**Why this is killer:**
- **Roaming profile:** History follows user across devices
- **Cross-server history:** See all plays across entire network
- **Backup:** History survives browser clear/reinstall
- **Artist node stays stateless:** No user DB, no auth system
- **Optional:** Works standalone (localStorage) or networked (mothership)

---

### History Management & Curation (v1.5)
**Status:** Design phase  
**Priority:** High (Post-v1.0)

**Vision:** Transform play history into curated, editable playlists that can be shared and monetized.

**Features:**
- [ ] **Delete individual history items** - X button on hover, removes from history array
- [ ] **Drag-and-drop reordering** - Rearrange tracks to perfect the flow
- [ ] **Copy history as text** - Button in header copies formatted tracklist with deep links
  - Format: `1. Artist - Title (link)`
  - Paste anywhere: Discord, Twitter, blog posts
  - Deep links work across entire Awake.fm network
- [ ] **Rename history/playlist** - Give your curated list a name
- [ ] **Save multiple playlists** - Store in localStorage (or mothership if authenticated)

**Implementation notes:**
- Drag-and-drop: Use Vue Draggable or native HTML5 drag API
- Copy format: Markdown-style with deep links
- History becomes "active playlist" that can be saved/loaded
- localStorage: `awake_fm_playlists_${artistSlug}` (anonymous)
- Mothership: POST /api/user/playlists (authenticated)

---

### Shareable Playlists (v2.0)
**Status:** Design phase  
**Priority:** High (Network effect feature)

**Vision:** Users create playlists, share them across the network, others can listen/fork/buy.

**Features:**
- [ ] **Share button** - Generates shareable playlist page
- [ ] **Playlist page** - Dedicated URL showing all tracks with cards
- [ ] **Fork playlist** - Copy someone's playlist to your history
- [ ] **Playlist metadata** - Title, description, creator, cover art
- [ ] **Playlist discovery** - Browse trending/popular playlists on mothership

**Technical architecture:**
- **Artist node:** Export playlist as JSON
- **Mothership:** Host playlist pages, handle discovery
- **Playlist URL:** `awake.fm/playlists/{id}`
- **Playlist format:**
  ```json
  {
    "id": "abc123",
    "title": "Ishimura's Favorites",
    "creator": "Ishimura",
    "creatorNode": "awake.fm/artists/ishimura",
    "description": "My top picks from 2025",
    "coverArt": "https://...",
    "tracks": [
      {
        "artist": "Rom Trooper",
        "title": "Neon Dreams",
        "deepLink": "awake.fm/artists/rom_trooper#track-neon-dreams",
        "duration": 240,
        "price": 1.00
      }
    ]
  }
  ```

**Why this is killer:**
- DJs share set tracklists with fans
- Producers curate "influences" playlists
- Fans discover music through trusted curators
- Cross-artist discovery (network effect!)
- Viral potential (share on social media)

---

### Commerce Integration (v2.5)
**Status:** Design phase  
**Priority:** Medium-High (Monetization)

**Vision:** Direct artist-to-fan sales. Artist node = complete commerce stack. No middleman.

**Core Principle:** Artist server handles checkout. Artist keeps 97%+ (Stripe fee only). Full sovereignty.

---

#### Artist Node Commerce (Direct Sales)
**User on artist server** → **checkout on artist server** → **artist gets paid directly**

**Features:**
- [ ] **Per-track pricing** - Artists set prices in YAML
- [ ] **Shopping cart component** - Add tracks, view cart, update quantities
- [ ] **Stripe Connect integration** - Artist connects their Stripe account
- [ ] **Checkout flow** - Payment form, order confirmation
- [ ] **Download delivery** - Secure download links after purchase
- [ ] **License key generation** - Optional DRM-free license keys
- [ ] **Order history** - Customer account with past purchases

**Technical architecture:**
- **Artist YAML:**
  ```yaml
  tracks:
    - title: "Neon Dreams"
      price: 1.00
      download_formats: [mp3, flac, wav]
      license: "Creative Commons BY-NC-SA"
  ```
- **Backend (Quart):**
  - `/api/cart` - Cart management
  - `/api/checkout` - Stripe payment intent
  - `/api/orders` - Order history
  - `/api/download/{token}` - Secure download
- **Frontend (Vue):**
  - `ShoppingCart.vue` - Cart UI
  - `CheckoutFlow.vue` - Payment form
  - `DownloadPage.vue` - Post-purchase downloads
- **Payment flow:**
  1. User browses artist's music on their server
  2. Adds tracks to cart (localStorage)
  3. Checkout on artist's server
  4. Stripe payment → artist's Stripe Connect account
  5. Artist server generates download tokens
  6. User downloads directly from artist server
  7. **Artist keeps 97%+ (Stripe fee only)**

**Pricing models:**
- Pay-what-you-want (minimum $1)
- Fixed price per track
- Album bundles (discount for full album)
- Playlist bundles (buy entire history/playlist)

---

#### Mothership Commerce (Cross-Artist Discovery)
**User on mothership** → **discovers multiple artists** → **checkout on mothership** → **payment split to each artist**

**Features:**
- [ ] **Cross-artist cart** - Add tracks from multiple artist nodes
- [ ] **Unified checkout** - Single payment for multi-artist cart
- [ ] **Payment splitting** - Mothership splits payment to each artist's Stripe Connect
- [ ] **Distributed downloads** - Each artist serves their own files
- [ ] **Platform fee** - Optional 3-5% for discovery/coordination

**Technical architecture:**
- **Mothership:**
  - Aggregates cart items from multiple artist nodes
  - Single Stripe checkout
  - Splits payment to each artist via Stripe Connect
  - Coordinates download tokens from each artist
- **Artist node:**
  - Exposes cart API for mothership integration
  - Receives payment notification from mothership
  - Generates download token
  - Serves file to customer
- **Payment flow:**
  1. User browses mothership, discovers playlist with 5 artists
  2. Adds tracks to mothership cart
  3. Checkout on mothership (single payment)
  4. Mothership splits payment to each artist's Stripe Connect
  5. Each artist generates download token
  6. User downloads from each artist's server
  7. **Artist keeps 92-94% (Stripe + small platform fee)**

**Artist choice:**
- Self-hosted only? Direct sales, 97% revenue, no platform fee
- Join network? More discovery, 92-94% revenue, small platform fee
- Both? Best of both worlds

---

**Why this is killer:**
- **Full sovereignty:** Artist node = complete business (no dependencies)
- **Optional network:** Join for discovery, leave anytime
- **Direct payments:** Artist's Stripe account, not platform wallet
- **No lock-in:** Direct sales always work, even if mothership disappears
- **Transparent fees:** Stripe 2.9% + 30¢, optional platform 3-5%
- **Artist control:** Pricing, licensing, formats, everything

**Use cases:**
1. **Solo artist** → Self-host node → Direct sales → Keep 97%
2. **DJ plays live set** → Share tracklist → Fans buy on artist server → 97%
3. **Network discovery** → Fan finds playlist on mothership → Buys from 5 artists → Each keeps 92-94%
4. **Producer curates playlist** → Shares on mothership → Students buy → Artists get paid directly

---

## Audio Player

### Queue Management & Shareable Playlists
**Status:** Design phase, not implemented  
**Priority:** Post-v1.0 (High priority for v2.0)

**Vision:** Transform play history into curated, shareable playlists that work across the entire Awake.fm network.

**v2.0 Features:**
- **Explicit queue functionality** - Users can add tracks without playing them immediately
- **Multi-action track controls** - Play now | Add to queue | Play next (insert at front)
- **Queue UI panel** - See upcoming tracks, reorder via drag-and-drop, remove items
- **Queue persistence** - Store in localStorage/IndexedDB, survives page refresh
- **Shareable playlists (local)** - Share a playlist link for single artist node
- **Cross-network playlists** - Curate tracks from multiple artist nodes, share via mothership
- **Playlist metadata** - Name, description, cover art, creator attribution
- **Social features** - Like/fork playlists, follow curators, discover trending

**UX Considerations:**
- **Desktop:** Hover over SetCard → show play/queue/next buttons
- **Mobile:** Tap SetCard → reveal control panel → tap specific action
- **Behavior:** Click when nothing playing → play immediately; click when playing → add to queue (or toggle via setting)
- **Queue mode toggle:** Explicit "Queue Mode" button for clear intent

**Technical Architecture:**
- Extend `playerStore` with `queue: AudioTrack[]` array
- Add actions: `addToQueue()`, `playNext()`, `removeFromQueue()`, `reorderQueue()`
- Playlist format: JSON with track metadata + URLs (absolute paths for cross-network)
- Mothership integration: POST playlist → get shareable ID → retrieve via GET
- localStorage key: `awake_fm_playlist_${artistSlug}` per artist node
- Cross-network: `awake_fm_playlist_network` for mothership playlists

**Why This Is Killer:**
- **No other platform does this well** - cross-artist discovery playlists that work seamlessly
- **Artist sovereignty** - Artists control their content, users curate freely
- **Network effect** - More artists = more discovery = more value
- **Viral potential** - Shareable playlists become marketing for entire network
- **Monetization path** - Premium playlists, curated collections, exclusive content

**Implementation Phases:**
1. **Phase 1 (v2.0):** Queue functionality on single artist node + local persistence
2. **Phase 2 (v2.1):** Shareable playlists within single artist node
3. **Phase 3 (v2.2):** Cross-network playlists via mothership integration
4. **Phase 4 (v3.0):** Social features (like/fork/follow/discover)

---

### Mutual Exclusion: Embedded + Global Player
**Status:** Partially implemented, needs refinement  
**Priority:** Medium

Currently both embedded AudioPlayerBlock and GlobalPlayerBar can play simultaneously. Need clean mutual exclusion:
- When embedded player plays → pause/hide global player
- When global player plays → pause embedded player
- Only one audio source active at a time
- Shared playerStore state for coordination
- Visual indicators of which player is active
- Smooth transitions between player types

**Technical notes:**
- playerStore already has `activePlayerType` and `activeEmbeddedId` tracking
- Watchers in place but interaction needs refinement
- Consider user mental model: should global player stay visible but paused, or hide completely?
- Needs tight iteration cycles to get UX right

### Advanced Global Player Display Options
**Status:** ✅ COMPLETE - Hybrid approach implemented  
**Priority:** ~~Low-Medium~~ DONE

**Implemented solution (2026-01-28):**
- Page adds bottom padding (70px) when player appears - matches minimized player height
- Full player overlays when expanded (no layout shift during minimize/expand)
- Minimized player sits perfectly above page content (no blocking!)
- Smooth CSS transition (0.3s ease) makes padding changes barely noticeable
- Player closes (X button) removes padding - clean dismiss

**Result:** Perfect balance of layout stability and immersive full player. Only 2 subtle layout shifts total (player appears, player closes). Feels smooth and natural! 🎉

---

## Media & Collections

### Set Tracklists (Companion YAML Files)
**Status:** Design approved, not yet implemented  
**Priority:** Medium

Sets can have companion `.yaml` files with tracklists and timestamps:
- `20151101_bassdrive.mp3` + `20151101_bassdrive.yaml`
- YAML contains tracklist with titles and timestamps
- SetCard displays tracklist UI (collapsible/tabbed)
- AudioPlayerBlock supports timestamp jumping
- URL hash routing for deep-linking (`#t=5:23`)

```yaml
# Example: 20151101_bassdrive.yaml
tracklist:
  - title: "Artist - Track Name"
    timestamp: "00:00"
  - title: "Another Artist - Track"
    timestamp: "05:23"
# Future: guest_info, recording_location, show_notes, etc.
```

### ID3 Metadata Extraction
**Status:** Not started  
**Priority:** Medium

Extract metadata from audio files during media_folder scanning:
- Artist, album, duration, artwork from MP3 tags
- Display in SetCard/TrackCard components
- Cache extracted metadata to avoid re-parsing on every scan
- Fallback to filename parsing if tags missing

### Visualizer Seeding from File Metadata
**Status:** Not started  
**Priority:** Low

Generate unique visualizers per track using file metadata:
- Hash filename/duration → seed value
- Pass seed to RadiantForge visualizer config
- Each set gets unique animated identity
- Consistent across plays (deterministic)

### HLS Streaming for Large Audio Files
**Status:** Not started  
**Priority:** High (v2.0 - Audio Pre-processing Phase)

**Problem:** Large audio files (100MB+ 2-hour DJ sets) cause buffering stalls every ~10-12 minutes when served as single MP3s. Browser downloads entire file but connection drops/throttles mid-stream, causing playback to stall waiting for data that never arrives.

**Current workaround (v1.0):** Auto-recovery system that detects stalls and triggers pause/seek/play cycle to request fresh buffer. Works but not ideal for long-form content.

**Proper solution:** HLS (HTTP Live Streaming) adaptive streaming protocol.

**Implementation:**
- **Build-time transcoding:** `builder.py` detects large audio files (>50MB threshold)
- **ffmpeg chunking:** Split MP3 into 10-second HLS segments (.ts files)
- **Generate playlist:** Create .m3u8 manifest file listing all segments
- **Player detection:** Frontend checks for .m3u8, uses HLS.js library for playback
- **Fallback:** Smaller files (<50MB) continue using direct MP3 streaming
- **Storage:** Chunks stored alongside original: `audio/track.mp3` + `audio/track.m3u8` + `audio/track/segment-*.ts`

**Benefits:**
- ✅ No buffering stalls - continuous chunk requests
- ✅ Faster start time - only loads first chunk
- ✅ Adaptive bitrate - quality adjusts to connection speed
- ✅ Better seeking - jump to any chunk instantly
- ✅ Works with existing MP3s - transcoding is one-time build step

**Technical notes:**
- HLS.js library for browser support (native HLS only in Safari)
- ffmpeg command: `ffmpeg -i input.mp3 -codec:a aac -b:a 128k -f hls -hls_time 10 -hls_list_size 0 output.m3u8`
- Consider multiple bitrates for true adaptive streaming (128k, 192k, 320k)
- Integrate with media_folder scanner for automatic detection
- Add progress indicator during build for transcoding time

**Synergy with other features:**
- Combine with waveform generation in single audio pre-processing pipeline
- Both run during `builder.py` content graph build
- Cache results to avoid re-processing on every build
- Could add MP3 normalization, metadata extraction, thumbnail generation

**v2.0 Audio Pre-processing Pipeline:**
1. Scan media_folder for audio files
2. Extract ID3 metadata (artist, album, artwork)
3. Generate waveforms (PNG + JSON)
4. Transcode large files to HLS chunks
5. Cache all generated assets
6. Update content graph with asset references

---

### Waveform Generation & Display
**Status:** Not started  
**Priority:** High (v2.0 - Audio Pre-processing Phase)

Generate waveform graphics for audio files during build process:

**Generation pipeline:**
- Integrate into `builder.py` - scan audio files during content graph build
- Use `audiowaveform` (BBC tool) or `librosa` (Python) for peak extraction
- Generate multiple formats: PNG (thumbnails), SVG (interactive), JSON (data)
- Cache generated waveforms in `content/artists/{artist}/music/.waveforms/`
- Multiple sizes: thumbnail (80px height for cards), full (200px for player)
- Skip regeneration if waveform already exists (performance)

**Display integration:**
- SetCard: Show mini waveform preview instead of placeholder box
- GlobalPlayerBar: Full waveform with playback progress overlay
- AudioPlayerBlock: Embedded player waveform display
- Interactive seeking: Click waveform to jump to position (SoundCloud-style)

**YAML configuration:**
```yaml
media:
  type: audio
  waveform:
    enabled: true
    color: "#4da3ff"           # waveform color
    progress_color: "#00ff99"  # played portion color
    height: 80                 # thumbnail height
    style: "bars"              # bars | line | gradient
```

**Technical options:**
- **audiowaveform** (BBC, C++, super fast, generates PNG/JSON/DAT)
- **librosa** (Python, full control, spectral analysis, slower)
- **wavesurfer.js** (client-side, requires loading full audio, not ideal for 2hr sets)

**Benefits:**
- Visual preview of track/set before playing
- Professional look (Spotify/SoundCloud level polish)
- Helps users navigate long DJ sets (see drops, buildups, breaks)
- Differentiates Awake.fm from basic music platforms
- "Wow factor" that makes artists want to use the platform

**Implementation notes:**
- For 128 Bassdrive sets (25GB), generation might take 10-30 minutes first run
- Waveforms should be gitignored (generated assets, not source)
- Consider progressive generation: generate on-demand when track first accessed
- Could expose as API endpoint: `/api/waveform?path=...` for dynamic generation

### Album Card Component
**Status:** Not started  
**Priority:** Medium

Build `AlbumCard.vue` for album collections:
- Album artwork display
- Title, artist, release date
- Track count indicator
- Hover/click behavior
- Grid/list mode variants

### Track Card Component
**Status:** Not started  
**Priority:** Medium

Build `TrackCard.vue` for track collections:
- Waveform preview or visualizer thumbnail
- Title, artist, duration
- Play button inline
- Grid/list mode variants

---

## Navigation & UX

### Breadcrumb Navigation
**Status:** Not started  
**Priority:** High (v1.0 - Core UX)

**Vision:** Clean, theme-aware breadcrumb trail showing current location in site hierarchy.

**Hierarchy structure:**
```
Server → Artist → Project/Album/Page → Subpage → Track
```

**Example breadcrumbs:**
- `Awake.fm Network > Ishimura > Music > Tracks > Neon Dreams`
- `Awake.fm Network > Awake.fm Legacy > Bassdrive Archive > 2015-11-01 Set`
- `Awake.fm Network > Rom Trooper > About`

**Features:**
- ✅ Auto-generated from current route/content graph
- ✅ Each segment is clickable link (except current page)
- ✅ Separator: `>` or `/` (configurable per theme)
- ✅ Theme-aware styling (uses `--color-text-secondary` and `--color-accent`)
- ✅ Mobile responsive: collapse middle segments on small screens
- ✅ Hover states on links
- ✅ Current page styled differently (bold, accent color, or no link)

**Placement:**
- Below header/hero, above main content
- Sticky option: stays visible on scroll
- Optional: integrate into page header component

**Technical implementation:**
- Vue component: `Breadcrumb.vue`
- Props: `segments: Array<{label: string, path: string, isCurrent: boolean}>`
- Auto-generate from Vue Router current route
- Backend: content graph already has hierarchy (server → artist → pages)
- Frontend: parse route params to build breadcrumb trail

**YAML configuration (optional per-page override):**
```yaml
breadcrumb:
  enabled: true
  custom_label: "Radio Archive"  # Override auto-generated label
  hide_ancestors: false          # Show/hide parent segments
```

**Styling considerations:**
- Subtle, not distracting
- Consistent spacing and sizing
- Use theme accent color for hover/active states
- Icon support: home icon for server root, folder icons, etc.

**Mobile behavior:**
- Full breadcrumbs on desktop
- Collapse to: `... > Parent > Current` on mobile
- Or: dropdown menu showing full hierarchy

**Why this matters:**
- Users always know where they are in deep content hierarchies
- Easy navigation back to parent pages
- Professional UX polish (every modern site has this)
- SEO benefits (structured data for breadcrumbs)
- Reduces "lost in the site" feeling

**Use cases:**
- User deep-links to track → sees full path back to artist homepage
- Browsing subpages → quick jump back to main artist page
- Exploring multiple artists → breadcrumb shows which artist's content you're viewing

**Implementation priority:**
- Build basic breadcrumb component first (v1.0)
- Add sticky/collapse features later (v1.5)
- SEO structured data (v2.0)

---

## Collections System

### Collection Carousel Layout
**Status:** Not started  
**Priority:** Medium

Build `CollectionCarousel.vue` component:
- Horizontal scrolling cards
- Touch/swipe support
- Navigation arrows
- Auto-scroll option
- Featured content use case

### Collection Filters & Sorting
**Status:** Not started  
**Priority:** Low

Add UI controls for filtering/sorting collections:
- Filter by tag, date range, genre
- Sort by date, title, duration, popularity
- Persist filter state in URL query params
- Apply filters at API level for performance

### Collection Pagination UI Polish
**Status:** Not started  
**Priority:** Low

Enhance pagination controls:
- Prev/Next button styling
- Page number indicators
- Jump to page input
- Infinite scroll option
- Load more button variant

---

## RadiantForge Visualizers

### Interactive Visualizers
**Status:** Concept only  
**Priority:** Low

Build interactive visualizers (mini-games):
- Rhythm game visualizer (beat matching)
- Particle painter (user-controlled)
- Audio-reactive drawing tool
- Transform passive listening into active engagement

### Additional Visualizer Types
**Status:** Not started  
**Priority:** Low

Build more visualizer presets:
- Kaleidoscope (mirrored patterns)
- Waveform (classic oscilloscope)
- Particle storm (chaotic energy)
- Cyberpunk rain (matrix-style falling code)
- Custom GLSL shaders for advanced effects

---

## Sigil System

### Pre-rendered Sigils for Mothership
**Status:** Design approved, not yet implemented  
**Priority:** Medium

Generate static versions of sigils for mothership security:
- Use headless browser (Puppeteer/Playwright) to capture frames
- Generate animated WebP (mothership UI) + GIF (RSS/email/social)
- Generate static PNG fallback thumbnail
- Integrate into `builder.py` build process
- Mothership serves pre-rendered assets, never executes artist code

---

## Content Management

### Media Folder Auto-Discovery UI
**Status:** Not started  
**Priority:** Low

Admin UI for configuring media_folder collections:
- Browse filesystem tree
- Preview discovered files
- Configure pattern matching
- Set visualizer defaults
- Generate collection YAML snippet

---

## Performance & Infrastructure

### Build Process Optimization
**Status:** Not started  
**Priority:** Low

Optimize content graph build times:
- Incremental builds (only changed files)
- Parallel YAML parsing
- Cache validation results
- Build progress indicators

### Audio Streaming Optimization
**Status:** Not started  
**Priority:** Medium

Enhance audio delivery:
- Range request support for seeking
- Adaptive bitrate streaming
- CDN integration options
- Audio preloading strategies

---

## Documentation

### Artist Onboarding Guide
**Status:** Not started  
**Priority:** High

Create comprehensive guide for new artists:
- How to structure content folders
- YAML syntax examples
- Theme customization
- Effect configuration
- Media collection setup
- Best practices

### Developer Documentation
**Status:** Not started  
**Priority:** Medium

Technical documentation for contributors:
- Architecture overview
- Component API reference
- Adding new block types
- Creating custom visualizers
- Testing guidelines

---

*Last updated: 2026-01-28*

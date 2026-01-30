# Awake.fm Artist Node - Feature Backlog

This document tracks enhancement ideas and future features for the Artist Node system.

---

## Audio Player v1.0 TODO

**Goal:** Solid, polished global audio player for first production release.

### Core Features (Must Have)
- [ ] **Deep linking for tracks with timestamps** - Every track gets unique URL anchor for bookmarking/sharing
  - Add `id="track-{trackId}"` to SetCard/TrackCard components
  - Wrap cards in `<a href="#track-{trackId}">` for native right-click menu support
  - Update URL hash when track plays (History API)
  - On page load, check for hash → scroll to track → optionally auto-play
  - **Timestamp support (YouTube-style):**
    - Share button copies URL with current timestamp: `#track-xyz&t=47:23`
    - On load, parse timestamp from URL → seek to position → auto-play
    - Support both `47:23` (MM:SS) and `2843` (seconds) formats
    - Share button tooltip shows current timestamp: "Share (at 47:23)"
    - Optional: Update hash every 10s as track plays (debounced) for mid-play bookmarking
    - Visual indicator when loading from timestamp: "▶ Starting at 47:23..."
  - Browser back/forward buttons navigate track history
  - **Why this matters:** DJs can share exact moments, producers reference specific sections, fans jump to drops instantly
  - **Use cases:** Share sick drops, reference production techniques, create timestamped playlists, deep-link from blog posts
- [ ] **History dropdown/combo selector** - Click track title → see play history → jump to any track
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

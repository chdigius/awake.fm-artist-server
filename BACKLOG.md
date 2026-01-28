# Awake.fm Artist Node - Feature Backlog

This document tracks enhancement ideas and future features for the Artist Node system.

---

## Audio Player

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

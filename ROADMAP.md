# Awake.fm Artist Node - Development Roadmap

> **Philosophy:** Visual identity first, prove multiple artist archetypes, polish before monetization, commerce when we have something worth selling.

---

## Current Status: **Alpha Development - Phase 1**

**Completed:**
- ✅ Audio Player v1.0 (play/pause, prev/next, history, deep linking, visualizers)
- ✅ Media Folder Collection Scanner (128 Bassdrive sets auto-discovered)
- ✅ RadiantForge Generative Engine (fractals, geometry, custom color palettes)
- ✅ Universal Generative Images (thumbnails, banners, backgrounds)
- ✅ Custom Color Palette System (baseHue, hueRange, modulation)
- ✅ SetCard Component (grid/list/carousel modes)
- ✅ Global Player with Audio-Reactive Visualizers

**In Progress:**
- 🔄 Mobile Responsive Fixes (hero banners + collection grids)

---

## Phase 1: Generative Graphics & Visual Identity 🎨
**Goal:** Make Awake.fm Legacy pages look FIRE with expanded generative art system

**Status:** Next Up (After mobile fixes)

### Milestones:

#### 1.1 RadiantForge Generator Expansion
- [ ] **Particle Systems** - Flowing particles, constellation patterns
- [ ] **Voronoi Diagrams** - Organic cell patterns, shattered glass aesthetic
- [ ] **Perlin Noise Landscapes** - Flowing terrain, topographic maps
- [ ] **Audio-Reactive Patterns** - Waveform-driven generative art
- [ ] **Glitch Art** - Digital corruption, datamosh aesthetic
- [ ] **Synthwave Grids** - Retro 80s perspective grids, neon horizons
- [ ] **Cellular Automata** - Conway's Game of Life, evolving patterns

#### 1.2 Awake.fm Legacy Visual Polish
- [ ] Hero banner with new generator (synthwave grid? particle system?)
- [ ] Collection thumbnails with varied generators per section
- [ ] Background images with subtle generative patterns
- [ ] Test all generators with custom color palettes
- [ ] Mobile responsive testing for all new visuals

#### 1.3 Generator Documentation
- [ ] Add new generator examples to CMS guide
- [ ] Document generator-specific options
- [ ] Create visual gallery of generator outputs
- [ ] Best practices for choosing generators per content type

**Success Criteria:** Awake.fm Legacy pages look production-ready, multiple generators in use, mobile-friendly

---

## Phase 2: Multiple Artist Archetypes 💿🎵🔊
**Goal:** Prove CMS flexibility by building 4 distinct artist experiences

**Status:** Not Started

### Artist Archetypes:

**1. Awake.fm Legacy** ✅ (Complete) - **Longform Audio Archive**
- Vibe: Radio archive, historical collection
- Focus: 50+ DJ sets, Bassdrive residency
- UX: Browse by date, large media collections
- Inspiration: Mixcloud meets Archive.org

**2. ROM Trooper** 💿 - **Album-Focused (Bandcamp-style)**
- Vibe: Discography showcase, album-first
- Focus: Full releases, track listings, artwork
- UX: Album grid → Album detail → Track listing
- Inspiration: Bandcamp's clean album presentation

**3. ZØL** 🎵 - **Track Stream (SoundCloud-style)**
- Vibe: Steady flow of techno singles
- Focus: Individual tracks, frequent releases
- UX: Infinite scroll track feed, quick play
- Inspiration: SoundCloud's stream-first experience

**4. The Ravine** 🔊 - **Hybrid (Sets + Albums)**
- Vibe: Versatile artist, multiple formats
- Focus: Both DJ sets and studio albums
- UX: Tabbed sections, flexible navigation
- Inspiration: Best of both worlds

### Milestones:

#### 2.1 Album Components (ROM Trooper)
- [ ] **AlbumCard Component** - Grid/list/carousel modes
- [ ] **Album Detail Page** - Track listing, artwork, purchase CTA
- [ ] **TrackCard Component** - Individual track display
- [ ] **Album Collection Block** - Display albums with metadata
- [ ] **Bandcamp-inspired Layout** - Clean, album-first design

#### 2.2 Track Stream Components (ZØL)
- [ ] **Track Feed Layout** - Vertical stream, infinite scroll
- [ ] **Inline Play Controls** - Play directly from feed
- [ ] **Track Metadata Display** - BPM, key, genre tags
- [ ] **SoundCloud-inspired Layout** - Stream-first, quick access
- [ ] **Auto-play Next Track** - Seamless listening experience

#### 2.3 Hybrid Layout (The Ravine)
- [ ] **Tabbed Navigation** - Sets / Albums / Tracks sections
- [ ] **Unified Player Experience** - Works across all tabs
- [ ] **Flexible Content Blocks** - Mix and match layouts
- [ ] **Demonstrate CMS Flexibility** - Same system, different feel

#### 2.4 Navigation & UX (All Artists)
- [ ] **Breadcrumb Navigation** - Show user location in site hierarchy
- [ ] **Artist → Content** navigation flows
- [ ] **Back button behavior** - Proper history management
- [ ] **Deep linking** - Share specific pages/tracks/albums
- [ ] **Consistent Player** - Works across all artist types

#### 2.5 Visual Identity Per Artist
- [ ] **ROM Trooper** - Industrial, dark, album art-focused
- [ ] **ZØL** - Minimal, techno aesthetic, grid-based
- [ ] **The Ravine** - Atmospheric, deep, immersive
- [ ] **Custom Color Palettes** - Each artist has unique palette
- [ ] **Generator Selection** - Different generators per artist vibe

**Success Criteria:** 4 distinct artist experiences, each feels unique, CMS flexibility proven, ready for any artist type

---

## Phase 3: Queue System & Shopping Experience 🛒
**Goal:** Enable playlist building and track shopping (Beatport++, but better)

**Status:** Not Started

### Milestones:

#### 3.1 Queue Management
- [ ] **Queue UI** - Upcoming tracks panel
- [ ] **Drag-and-Drop Reordering** - Vue Draggable integration
- [ ] **Add to Queue** - From any track/set card
- [ ] **Queue Persistence** - localStorage + optional sync
- [ ] **Auto-play Queue** - Seamless track transitions

#### 3.2 Shopping While Listening
- [ ] **Add to Cart from Player** - Buy what you're hearing
- [ ] **Queue → Cart** - Convert playlist to purchase
- [ ] **Price Display** - Show prices on cards
- [ ] **Bundle Discounts** - Album vs individual tracks
- [ ] **Wishlist Feature** - Save for later

#### 3.3 Discovery & Curation
- [ ] **Similar Tracks** - Recommendations based on queue
- [ ] **Genre/BPM Filtering** - Find compatible tracks
- [ ] **Key Matching** - Harmonic mixing suggestions
- [ ] **Artist Cross-Promotion** - Discover related artists
- [ ] **Playlist Sharing** - Share your queue/cart

**Success Criteria:** Users can build playlists while browsing, shopping feels integrated, experience beats Beatport

---

## Phase 4: Alpha Polish Pass ✨
**Goal:** Make entire site cohesive, mobile-friendly, ready for external testing

**Status:** Not Started

### Milestones:

#### 3.1 Mobile Responsive Complete
- [ ] All hero banners responsive across devices
- [ ] Collection grids work on mobile (touch, spacing, sizing)
- [ ] Audio player mobile UX (minimize, controls, visualizer)
- [ ] Navigation mobile-friendly (hamburger menu if needed)
- [ ] Test on iPhone SE, iPhone 14 Pro Max, Android devices

#### 3.2 Visual Cohesion
- [ ] Consistent spacing/sizing across all pages
- [ ] Theme system working across all artists
- [ ] Visual effects (scanlines, chroma, vhs) polished
- [ ] Typography hierarchy consistent
- [ ] Color palette system working site-wide

#### 3.3 Performance Optimization
- [ ] Lazy loading for generative images
- [ ] Audio streaming optimization
- [ ] Page load time < 3 seconds
- [ ] 60fps animations across site
- [ ] Lighthouse score > 90

#### 3.4 User Testing
- [ ] Internal alpha testing (Chris + friends)
- [ ] Gather feedback on UX flow
- [ ] Identify pain points
- [ ] Fix critical bugs
- [ ] Iterate on design based on feedback

**Success Criteria:** Site looks professional, works on all devices, ready to show publicly

---

## Phase 5: Commerce Integration 💰
**Goal:** Enable artist-direct sales (tracks, albums, merch)

**Status:** Not Started

### Milestones:

#### 4.1 Shopping Cart System
- [ ] **Cart State Management** - Pinia store for cart
- [ ] **Add to Cart** - From album/track pages
- [ ] **Cart UI** - Slide-out panel or dedicated page
- [ ] **Cart Persistence** - localStorage + optional sync
- [ ] **Quantity Management** - Adjust quantities, remove items

#### 4.2 Stripe Integration
- [ ] **Stripe Connect** - Artist-direct payments (97%+ revenue)
- [ ] **Checkout Flow** - Secure payment form
- [ ] **Order Confirmation** - Email receipt, order details
- [ ] **Payment Processing** - Handle success/failure states
- [ ] **Webhook Handling** - Process payment events

#### 4.3 Digital Delivery
- [ ] **Secure Download Links** - Time-limited, single-use
- [ ] **Download Page** - Post-purchase access
- [ ] **File Formats** - MP3, FLAC, WAV options
- [ ] **Download Tracking** - Analytics for artists
- [ ] **Re-download Support** - Email-based recovery

#### 4.4 Artist Dashboard (Future)
- [ ] **Sales Analytics** - Revenue, popular items
- [ ] **Order Management** - View orders, issue refunds
- [ ] **Payout Tracking** - Stripe Connect balance
- [ ] **Product Management** - Add/edit/remove items

**Success Criteria:** Artists can sell directly to fans, payments work reliably, 97%+ revenue to artists

---

## Phase 6: Network Features 🌐
**Goal:** Connect artist nodes, enable cross-artist discovery

**Status:** Design Phase

### Milestones:

#### 5.1 History & Playlists
- [ ] **History Persistence** - localStorage per-artist
- [ ] **Mothership Sync** - Optional roaming profile
- [ ] **Playlist Curation** - Delete, reorder, rename
- [ ] **Shareable Playlists** - Generate playlist pages
- [ ] **Playlist Discovery** - Trending playlists on mothership

#### 5.2 Mothership Integration
- [ ] **Artist Directory** - Browse all artists on network
- [ ] **Cross-Artist Search** - Find tracks across network
- [ ] **User Profiles** - Optional accounts for sync
- [ ] **Social Features** - Follow artists, share playlists
- [ ] **Cross-Artist Cart** - Single checkout for multiple artists

#### 5.3 Static Asset Generation
- [ ] **Pre-rendered Sigils** - Puppeteer-based rendering
- [ ] **Animated WebP/GIF** - For mothership display
- [ ] **Static Thumbnails** - PNG fallbacks
- [ ] **Build Process Integration** - Auto-generate during build

**Success Criteria:** Artist nodes feel connected, users can discover across network, mothership adds value

---

## Phase 7: Audio Infrastructure 🎧
**Goal:** Production-grade audio delivery for large files

**Status:** Design Phase

### Milestones:

#### 6.1 HLS Streaming
- [ ] **Segment Audio Files** - FFmpeg-based processing
- [ ] **HLS Manifest Generation** - M3U8 playlists
- [ ] **Adaptive Bitrate** - Multiple quality levels
- [ ] **CDN Integration** - Fast global delivery
- [ ] **Build Process** - Auto-segment during build

#### 6.2 Waveform Generation
- [ ] **Waveform Extraction** - audiowaveform (BBC tool)
- [ ] **Waveform Display** - Canvas-based rendering
- [ ] **Click-to-Seek** - SoundCloud-style interaction
- [ ] **Progress Overlay** - Show playback position
- [ ] **Build Process** - Auto-generate during build

#### 6.3 Metadata Extraction
- [ ] **ID3 Tag Reading** - Extract artist, title, album, artwork
- [ ] **Auto-populate Track Info** - Reduce manual YAML
- [ ] **Artwork Extraction** - Use embedded album art
- [ ] **Duration Calculation** - Auto-detect track length
- [ ] **Build Process** - Scan during content graph build

**Success Criteria:** Large audio files stream smoothly, waveforms provide visual preview, metadata auto-populated

---

## Phase 8: Documentation & Onboarding 📚
**Goal:** Enable artists to build their own nodes

**Status:** Not Started

### Milestones:

#### 7.1 CMS Reference Manual (The Bible)
- [ ] **Complete YAML Reference** - Every field documented
- [ ] **Block Type Guide** - Hero, section, collection, etc.
- [ ] **Generator Reference** - All RadiantForge generators
- [ ] **Color Palette Guide** - HSL, custom palettes, modulation
- [ ] **Layout Options** - Grid, list, carousel configurations
- [ ] **Media Folder Guide** - Auto-discovery, metadata

#### 7.2 Artist Onboarding Guide
- [ ] **Getting Started** - Clone repo, install dependencies
- [ ] **First Artist Node** - Step-by-step tutorial
- [ ] **Content Structure** - Folder organization, naming
- [ ] **Customization Guide** - Themes, effects, colors
- [ ] **Deployment Guide** - Hosting, domains, SSL
- [ ] **Troubleshooting** - Common issues, solutions

#### 7.3 LifewareCore Integration
- [ ] **AI Assistant for Site Building** - Natural language → YAML
- [ ] **Content Generation** - AI helps write bios, descriptions
- [ ] **Visual Suggestions** - AI recommends generators/colors
- [ ] **Error Detection** - AI catches YAML mistakes
- [ ] **Continue Integration** - Use in VS Code

**Success Criteria:** Artists can build nodes without Chris's help, documentation is comprehensive, AI assistant works

---

## Future Phases (Post-Alpha)

### Phase 9: Advanced Features
- Interactive visualizers (rhythm games, particle painters)
- Custom GLSL shaders for advanced effects
- Video support (music videos, live performances)
- Live streaming integration
- Merch integration (print-on-demand)

### Phase 10: Mothership Development
- Decentralized artist network
- User-defined browsing experience
- Cross-artist discovery
- Social features (follow, share, comment)
- Federated identity

### Phase 11: Platform Maturity
- Mobile apps (iOS, Android)
- Desktop apps (Electron)
- Browser extensions
- API for third-party integrations
- Plugin system for custom features

---

## Success Metrics

### Alpha Launch (Phase 4 Complete)
- 4 artist nodes live (Awake.fm Legacy, ROM Trooper, ZØL, The Ravine)
- Each demonstrates different archetype
- Mobile-friendly across all devices
- Audio player works flawlessly
- Generative visuals look professional
- Ready for external testing

### Beta Launch (Phase 5 Complete)
- Queue system working (playlist building while browsing)
- Shopping experience integrated (Beatport++, but better)
- Commerce working (at least 1 sale)
- Artists earning 97%+ revenue
- 10+ artist nodes live
- Positive user feedback
- Ready for public announcement

### v1.0 Launch (Phase 6-8 Complete)
- Network features working (mothership, cross-artist discovery)
- Audio infrastructure production-ready (HLS, waveforms, metadata)
- Documentation complete (CMS Bible, onboarding guides)
- 25+ artist nodes live
- Artists onboarding themselves
- LifewareCore AI assistant working

---

## Design Principles

1. **Artist Sovereignty First** - Artists own content, distribution, and revenue
2. **Visual Expression** - Generative art as differentiator
3. **Builder-Operator Pragmatism** - Simple, transparent systems
4. **Performance Matters** - 60fps, fast loads, smooth interactions
5. **Mobile-First** - Works great on phones, scales up to desktop
6. **Progressive Enhancement** - Core features work everywhere, advanced features where supported
7. **Zero Lock-In** - Flat-file YAML, git-based, portable
8. **AI-Assisted** - LLMs help artists build without learning YAML

---

## Notes

- **Backlog vs Roadmap:** Backlog = detailed task list, Roadmap = strategic phases
- **Flexibility:** Phases may shift based on user feedback and priorities
- **Iteration:** Each phase includes testing and refinement
- **Documentation:** Update roadmap as we complete phases

---

*Last updated: 2026-02-05*
*Current Phase: Phase 1 (Generative Graphics Expansion)*

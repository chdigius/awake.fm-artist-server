# Awake.fm Artist Node - Vision

> **Digital sovereignty for musicians. Own your content, own your audience, own your future.**

---

## The Problem

Modern music platforms have failed artists:

- **Spotify/Apple Music**: Fractions of pennies per stream, zero audience ownership, algorithm-gated discovery
- **SoundCloud**: Dying platform, limited customization, still algorithm-dependent
- **Bandcamp**: Better, but generic templates, limited expressiveness, no network effects
- **WordPress/Wix**: "Ikea furniture internet" - everything looks the same, complex, expensive plugins

**Artists are tenants, not owners.** They build on rented land, subject to platform whims, algorithm changes, and TOS updates.

---

## The Vision

**Awake.fm is the anti-platform.** A decentralized network where each artist runs their own node - a self-hosted, fully customizable music site that's:

### 🏠 **Sovereign**
- Your domain, your server, your rules
- Git-based content (not locked in a database)
- Can leave the network anytime, keep everything
- No platform can deplatform you

### 🎨 **Expressive**
- Fully customizable themes, effects, layouts
- Audio-reactive visualizers (G-Force for the web)
- Waveform previews, custom players
- Not a template - a canvas

### 🤖 **AI-Native**
- Flat-file YAML structure perfect for LLM reasoning
- Artists describe their vision in English, AI writes the config
- LifewareCore integration: local AI that knows your music, your style, your preferences
- "Cursor for musicians" - natural language site building

### 🌐 **Connected**
- Awake.fm Mothership: federated discovery, cross-promotion
- Artist-to-artist links, collaborative releases
- SocialCaster integration: broadcast to mainstream social (RSS, Mastodon, Bluesky)
- Network effects without platform lock-in

### 💪 **Powerful**
- Media folder scanning: drop MP3s, auto-generate collections
- ID3 metadata extraction, waveform generation
- Audio-reactive visualizers per track
- Full e-commerce (sell music, merch, tickets)
- Blog, bio pages, photo galleries
- All from simple YAML files

---

## The Ecosystem

```
┌─────────────────────────────────────────┐
│     AWAKE.FM MOTHERSHIP (Discovery)     │
│  Network directory, cross-promotion,    │
│  federated search, artist connections   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼────────┐
│  ARTIST NODE   │  │  ARTIST NODE  │
│  (Your Domain) │  │ (Their Domain)│
│                │  │               │
│ • Music/Sets   │  │ • Music/Sets  │
│ • Visualizers  │  │ • Visualizers │
│ • Blog/Updates │  │ • Blog/Updates│
│ • Store        │  │ • Store       │
└───────┬────────┘  └───────┬───────┘
        │                   │
┌───────▼────────┐  ┌──────▼────────┐
│ LIFEWARECORE   │  │ SOCIALCASTER  │
│ (Local AI)     │  │ (Broadcasting)│
│                │  │               │
│ • Site builder │  │ • RSS feeds   │
│ • Content mgmt │  │ • Mastodon    │
│ • Memory/prefs │  │ • Bluesky     │
│ • Automation   │  │ • Newsletter  │
└────────────────┘  └───────────────┘
```

---

## The Artist Experience

### Day 1: Setup
```
Artist: "I want a dark cyberpunk site with neon green accents"
LifewareCore: *generates theme YAML, applies effects*
Artist: "Perfect. Add my Bandcamp discography."
LifewareCore: *scans folder, extracts metadata, builds collections*
```

### Day 30: New Release
```
Artist: *drops new album folder with MP3s + artwork*
LifewareCore: "New album detected. Want me to add it to your site?"
Artist: "Yeah, with waveform previews and the nebula visualizer"
LifewareCore: *generates waveforms, configures visualizer, updates YAML*
SocialCaster: *broadcasts to Twitter, Mastodon, RSS*
```

### Day 365: Network Growth
- 500 plays on your site (you own the analytics)
- 50 email subscribers (you own the list)
- Featured on Awake.fm mothership (network discovery)
- 3 collaborative releases with other artists (cross-promotion)
- $2,000 in direct sales (no platform fees)

**You're not a "content creator." You're a digital homesteader.**

---

## Why This Works

### For Artists
- **Own everything**: domain, content, audience, data
- **Express freely**: no template constraints, full creative control
- **Keep revenue**: direct sales, no 30% platform cuts
- **Build equity**: your site appreciates, platform followers don't
- **Stay independent**: can't be deplatformed, algorithm-gated, or TOS'd

### For Fans
- **Better experience**: custom visualizers, waveforms, immersive design
- **Direct connection**: support artists directly, no middleman
- **Ad-free**: no Spotify ads, no algorithm manipulation
- **Ownership**: buy music, actually own it (not rent it)

### For the Network
- **Decentralized**: no single point of failure
- **Federated**: discovery without centralization
- **Composable**: artists can mix/match tools (node + LifewareCore + SocialCaster)
- **Sustainable**: artists pay for their own hosting (cheap), not platform overhead

---

## The Technology

### Artist Node (This Repo)
- **Frontend**: Vue 3 + Vite (fast, modern, reactive)
- **Backend**: Python/Quart (async, lightweight)
- **Content**: Flat-file YAML + Git (version control, no database)
- **Visualizers**: RadiantForge (p5.js, audio-reactive, fullscreen)
- **Player**: Custom audio player with waveforms, visualizers, queue
- **Themes**: CSS variables, cascading effects (CRT, VHS, chromatic aberration)

### LifewareCore Integration (Future)
- Local AI assistant specialized for Awake.fm
- Continue + VS Code integration
- Session memory, context awareness
- Natural language → YAML generation
- Automated content management

### SocialCaster Integration (Future)
- Broadcast updates to mainstream social
- RSS feeds, Mastodon, Bluesky, newsletters
- "Propaganda leaflets to the mainstream internet"
- Stay connected without being trapped

---

## The Philosophy

### Builder-Operator Pragmatism
- Simple, transparent systems
- Config-driven extensibility
- AI as force multiplier, not replacement
- Infrastructure that empowers individuals

### Artist Sovereignty
- Own your platform, own your future
- No algorithm can hide you
- No TOS can silence you
- No platform can extract rent

### The Anti-Platform
- Decentralized but connected
- Independent but collaborative
- Sovereign but networked
- **Digital homesteading, not tenant farming**

---

## The Movement

This isn't just a music platform. It's a **rejection of platform capitalism.**

We're building infrastructure for artists who are tired of:
- Being algorithm-gated
- Paying platform taxes
- Building on rented land
- Having their audience held hostage

**Awake.fm is the artist-first internet.**

If you're an indie musician who wants:
- Full creative control
- Direct fan relationships
- Revenue without middlemen
- A site cooler than Spotify

**This is for you.**

---

## Current Status

**Alpha Development** - Core infrastructure working:
- ✅ Flat-file CMS with YAML content graphs
- ✅ Media folder scanning (auto-discover audio files)
- ✅ Custom audio player with minimize/fullscreen
- ✅ Audio-reactive visualizers (RadiantForge)
- ✅ Fullscreen visualizer support
- ✅ Theme system with visual effects
- ✅ Collection system (grid/list/carousel layouts)
- ✅ Pagination, routing, navigation

**Next Up:**
- Waveform generation & display
- LifewareCore integration (AI assistant)
- SocialCaster integration (broadcasting)
- Mothership federation (network discovery)
- E-commerce (direct sales)

---

## Join the Movement

This is open-source, artist-owned infrastructure.

**For Artists**: Launch your node, own your future
**For Developers**: Contribute to the anti-platform
**For Fans**: Support artists directly, no middleman

**The internet doesn't have to be Ikea furniture.**

Let's build something better. Together.

---

*Last updated: 2026-01-28*
*"Own your platform. Own your future."*

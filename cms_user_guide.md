# Awake.fm Artist Node CMS User Guide

## Overview

The Awake.fm Artist Node uses a **file-based CMS** powered by YAML configuration files. Content is organized into a hierarchical tree of **nodes**, where each node represents a page, artist, album, track, or other content entity.

This guide explains how to structure content, configure nodes, and use the various features of the CMS.

---

## Core Concepts

### Nodes

A **node** is a directory in the content tree that represents a discrete piece of content (e.g., a page, artist, album, track). Each node can contain:

- **`index.yaml`** - Content definition (blocks, layout, metadata)
- **`_meta.yaml`** - Folder-level metadata (theme, effects, collection ordering)
- **Child nodes** - Subdirectories representing nested content

### Content Graph

The CMS builds a **content graph** from your YAML files:

1. **Build time**: `scripts/builder.py` walks the content tree and generates `build/content_graph.json`
2. **Runtime**: Backend loads the content graph and serves it via API
3. **Frontend**: Vue components consume the API and render blocks

**Pipeline**: `YAML files` → `builder.py` → `content_graph.json` → `Backend API` → `Frontend Components`

---

## File Structure

### Typical Node Structure

```
content/
├── server/
│   ├── _meta.yaml          # Server-level metadata (theme, effects)
│   └── index.yaml          # Homepage content
├── artists/
│   ├── _meta.yaml          # Artists folder metadata (collection_order)
│   ├── index.yaml          # Artists index page
│   ├── zol/
│   │   ├── _meta.yaml      # Artist-specific metadata
│   │   ├── index.yaml      # Artist homepage
│   │   ├── music/
│   │   │   ├── albums/
│   │   │   ├── tracks/
│   │   │   └── sets/
│   │   └── pages/
│   │       └── bio/
│   │           └── index.yaml
│   └── rom_trooper/
│       └── ...
```

---

## `index.yaml` - Content Definition

The `index.yaml` file defines the **content and layout** for a node.

### Basic Structure

```yaml
layout: page          # Layout type: page, artist, album, track, etc.
slug: my-page         # URL slug (optional, defaults to folder name)
display_name: My Page # Human-readable title
tagline: Short tagline for this content # Optional tagline

# Preview data for collection cards (IMPORTANT!)
preview:
  caption: "Artist Name — Short description"
  badge: "Artist"  # Badge text (e.g., "Artist", "Album", "Track")
  blurb: "Longer description that appears on cards in collections"

blocks:
  - type: hero
    # ... block configuration
  - type: section
    # ... block configuration
```

### Preview Section (Required for Collection Cards)

The `preview` section controls how a node appears when displayed in collection cards (grid, list, carousel). **This is required for nodes that will be displayed in collections.**

**Properties:**
- `title` (string, optional) - Display title for the card. **Auto-populates from `display_name` if not set.**
- `image` (string, optional) - Path to card image/logo (e.g., "/artists/artist-name/logo.png")
- `sigil` (object, optional) - Custom p5.js sigil configuration (see Sigils section)
- `caption` (string) - Short caption text (e.g., "Artist Name — Genre")
- `badge` (string, optional) - Badge label (e.g., "Artist", "Album", "Track", "Featured")
- `blurb` (string) - Description text shown on cards

**Card Image Priority:**
1. `preview.image` - Static image (highest priority)
2. `preview.sigil` - Custom p5.js sigil configuration
3. Generative default - Hash-based sigil (if neither is specified)

**Example:**
```yaml
display_name: "Zol"  # This will auto-populate preview.title

preview:
  # title: "Zol"  # Optional - auto-populated from display_name if omitted
  caption: "Zol — Electronic Producer"
  badge: "Artist"
  blurb: "Experimental electronic music blending ambient textures with glitchy beats."
```

**Auto-Population:** If `preview.title` is not explicitly set, it will automatically use the value from `display_name`. This means you typically only need to set `display_name` once at the top level.

### Supported Layouts

- **`page`** - Generic content page
- **`artist`** - Artist profile page
- **`album`** - Album page
- **`track`** - Track page
- **`set`** - DJ set or playlist page

---

## Block Types

Blocks are the building blocks of content. Each block has a `type` and type-specific configuration.

### 1. Hero Block

Large header section with heading, subheading, optional background image, and optional sigil overlay.

```yaml
- type: hero
  heading: "Welcome to Awake.fm"
  subheading: "Decentralized music network"
  body: |
    Optional longer description text that appears below the subheading.
    Can be multiple lines.
  background: "/content/assets/backgrounds/hero_bg.jpg"
  sigil:
    type: "p5"
    id: "node-001"
    options:
      seed: "custom-seed"
      variant: "orbit"
  cta:
    label: "Get Started"
    target: "#content"
```

**Properties:**
- `heading` (string) - Main heading text
- `subheading` (string, optional) - Subtitle text
- `body` (string, optional) - Longer description (supports multiline)
- `background` (string, optional) - Path to background image
- `sigil` (object, optional) - Animated or static visual sigil (see Sigil Configuration below)
- `cta` (object, optional) - Call-to-action button
  - `label` (string) - Button text
  - `target` (string) - Link target (URL or anchor)

#### Sigil Configuration

Sigils are visual elements that can be either **animated p5.js sketches** or **static images**.

**p5.js Animated Sigil:**
```yaml
sigil:
  type: "p5"
  id: "node-001"              # Registered sigil ID
  options:
    seed: "custom-seed"       # Seed for generative variation
    variant: "orbit"          # Sigil variant/style
```

**Static Image Sigil:**
```yaml
sigil:
  type: "image"
  src: "/content/artists/artist-name/logo.png"
  alt: "Artist Logo"
```

**Combining Background + Sigil:**

You can use both a background image AND a sigil - the sigil will be overlaid on top of the background:

```yaml
- type: hero
  heading: "Artist Name"
  subheading: "Genre / Style"
  background: "/content/assets/backgrounds/dark-abstract.jpg"  # Full background
  sigil:                                                        # Overlaid on top
    type: "image"
    src: "/content/artists/artist-name/logo.png"
    alt: "Artist Logo"
```

---

### 2. Section Block

Container for grouping related blocks with an optional label.

```yaml
- type: section
  label: Featured Artists
  align:
    horizontal: center  # left, center, right, start, end, stretch
  blocks:
    - type: collection
      # ... nested blocks
```

**Properties:**
- `label` (string, optional) - Section heading
- `align` (object, optional) - Alignment configuration
  - `horizontal` - Label alignment (inherits from first child collection if not set)
- `blocks` (array) - Nested content blocks

**Alignment Priority:**
1. Explicit `section.align.horizontal`
2. Inherited from first child collection's `layout.align.horizontal`
3. Default (left-aligned)

---

### 3. Collection Block

Displays a collection of items (artists, albums, tracks) in various layouts.

```yaml
- type: collection
  source: folder              # Currently only "folder" is implemented
  path: /artists              # Source path for folder source
  card: artist                # Card type: artist, album, track
  layout:
    mode: grid                # grid, list, carousel
    columns:
      xs: 1
      sm: 2
      md: 3
      lg: 4
      xl: 5
    gap: 1rem
    align:
      horizontal: center      # left, center, right, start, end, stretch
      vertical: start         # start, center, end
  paging:
    mode: load_more           # load_more, pages, infinite
    per_page: 12
  sort: name_asc              # name_asc, name_desc, random, or omit for collection_order
```

**Properties:**
- `source` (string) - Data source (currently only `folder` is implemented)
  - `folder` - Direct children of a node path
  - Future: `api`, `roster`, `tag`, `query`
- `path` (string) - Source path for folder source
- `card` (string) - Card component: `artist`, `album`, `track`
- `layout` (object) - Layout configuration
  - `mode` - Display mode: `grid`, `list`, `carousel`
  - `columns` (object, for grid) - Responsive column counts
  - `gap` (string, for grid/list) - Spacing between items
  - `max_width` (string, for list) - Max width of list container
  - `align` (object) - Alignment configuration
  - `slides_per_view` (object, for carousel) - Responsive slides visible
  - `spacing` (string, for carousel) - Gap between slides
  - `controls` (object, for carousel) - UI controls
    - `arrows` (boolean) - Show prev/next buttons
    - `dots` (boolean) - Show dot indicators
  - `autoplay` (object, for carousel) - Autoplay configuration
    - `enabled` (boolean)
    - `interval` (number) - Milliseconds between slides
    - `pause_on_hover` (boolean)
- `paging` (object) - Pagination configuration
  - `mode` - Pagination type: `load_more`, `pages`, `infinite`
  - `per_page` (number) - Items per page
- `sort` (string, optional) - Sort order (see Sorting section)

**Collection Sorting (3-Tier Priority):**

1. **Explicit `sort` parameter** (highest priority)
   - `name_asc` - Alphabetical A-Z
   - `name_desc` - Alphabetical Z-A
   - `random` - Random order
2. **`collection_order` from parent `_meta.yaml`** (if no explicit sort)
   - Allows custom ordering by slug
3. **Default: `name_asc`** (if no sort or collection_order)

---

### 3.1. Generative Thumbnails (Collection Items)

Generate unique, deterministic thumbnails for collection items (tracks, albums, sets) using fractal mathematics and seed images.

**Key Features:**
- 🎨 Unique visual for each track (seeded from filename/title)
- 🔄 Deterministic (same track = same thumbnail every time)
- 🌈 Theme-aware coloring (matches page theme)
- 🔥 Multiple fractal types (Mandelbrot, Burning Ship, Julia, Tricorn, etc.)
- ⚡ Lightweight Canvas 2D rendering (no p5.js overhead)

#### Basic Configuration

```yaml
blocks:
  - type: collection
    source: media_folder
    path: "artists/my_artist/music/tracks"
    pattern: "*.mp3"
    thumbnail:
      type: generative_from_seed
      seedImage: /content/artists/my_artist/assets/logo.png
      seedFrom: filename
      style:
        # Pattern type
        pattern: burning_ship
        
        # Universal settings (apply to all patterns)
        colorSource: theme
        colorMode: duotone_generate
        saturation: 90
        lightness: 55
        hueRange: 180
        patternOpacity: 0.6
        blendMode: multiply
        
        # Fractal-specific settings
        fractalParams:
          maxIterations: 120
          zoom: 2.5
          offsetX: 0.0
          offsetY: -0.5
```

#### Universal Settings (All Patterns)

These settings work for **all pattern types** (fractals and geometric):

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `colorSource` | `theme` \| `seed` | `seed` | `theme` = use page theme colors, `seed` = random per track |
| `colorMode` | string | `duotone_generate` | Color mapping mode (currently only duotone supported) |
| `saturation` | 0-100 | 80 | Color intensity (0 = grayscale, 100 = vivid) |
| `lightness` | 0-100 | 50 | Brightness (0 = black, 100 = white) |
| `hueRange` | 0-360 | 360 | Color spread in gradient (60 = analogous, 360 = rainbow) |
| `patternOpacity` | 0.0-1.0 | 0.5 | Pattern overlay strength (0 = invisible, 1 = opaque) |
| `blendMode` | string | `multiply` | How pattern blends with seed image: `multiply`, `overlay`, `screen`, `difference`, `add` |

#### Fractal Pattern Types

##### Mandelbrot
Classic fractal with infinite detail and self-similarity.

```yaml
style:
  pattern: mandelbrot
  fractalParams:
    maxIterations: 50-200      # Detail level (higher = finer, slower)
    zoom: 1.0-5.0               # How zoomed in (auto-seeded if omitted)
    offsetX: -1.0 to 1.0        # Horizontal pan (auto-seeded if omitted)
    offsetY: -1.0 to 1.0        # Vertical pan (auto-seeded if omitted)
```

**Visual:** Circular main body with intricate tendrils. Smooth, organic.

##### Burning Ship 🔥🚢
Dramatic fractal with ship-like structures and sharp, spiky detail.

```yaml
style:
  pattern: burning_ship
  fractalParams:
    maxIterations: 50-200
    zoom: 1.0-5.0
    offsetX: -1.0 to 1.0
    offsetY: -1.0 to 1.0
```

**Visual:** Ship-like main structure with extremely detailed spiky tendrils. Aggressive, dramatic aesthetic. Perfect for dark/cyberpunk themes.

**Note:** Burning Ship looks best with `offsetY` around -0.5 to -0.7 to capture the "ship" structure.

##### Julia Set
Related to Mandelbrot but with different structure. Creates beautiful swirls.

```yaml
style:
  pattern: julia
  fractalParams:
    maxIterations: 50-200
    zoom: 1.0-5.0
    offsetX: -1.0 to 1.0
    offsetY: -1.0 to 1.0
```

**Visual:** Swirling, symmetrical patterns. Different structure than Mandelbrot.

##### Tricorn (Mandelbar) 🦄
Conjugate of Mandelbrot. Heart-shaped with organic tendrils.

```yaml
style:
  pattern: tricorn
  fractalParams:
    maxIterations: 50-200
    zoom: 1.0-5.0
    offsetX: -1.0 to 1.0
    offsetY: -1.0 to 1.0
```

**Visual:** Heart-shaped main body with smooth, flowing tendrils. Elegant, organic aesthetic.

##### Fractal Noise 🌊
Multi-octave Perlin-style noise. Creates flowing, organic patterns.

```yaml
style:
  pattern: fractal_noise
  fractalParams:
    octaves: 4              # 1-8 (number of noise layers, more = finer detail)
    persistence: 0.5        # 0.0-1.0 (amplitude decay, higher = rougher)
    noiseScale: 3.0         # 1.0-8.0 (base frequency, lower = larger features)
```

**Visual:** Smooth, flowing gradients. Great for subtle backgrounds.

**Parameter Guide:**
- `octaves`: More layers = more detail. Try 2-3 for smooth, 5-6 for turbulent
- `persistence`: Lower (0.3) = smoother, Higher (0.7) = rougher, more chaotic
- `noiseScale`: Lower (1-2) = large flowing shapes, Higher (5-8) = fine texture

#### Geometric Pattern Types

These patterns don't use `fractalParams`:

##### Geometric
Grid of circles and squares with noise-based placement.

```yaml
style:
  pattern: geometric
  # No fractalParams
```

##### Waves
Flowing sine wave patterns.

```yaml
style:
  pattern: waves
  # No fractalParams
```

##### Particles
Random particle scatter (starfield effect).

```yaml
style:
  pattern: particles
  # No fractalParams
```

##### Sierpinski
Sierpinski triangle (recursive geometric).

```yaml
style:
  pattern: sierpinski
  # No fractalParams
```

#### Color Modes

Currently only `duotone_generate` is supported:
- Converts seed image to grayscale
- Maps dark pixels to dark color (HSL based on `hue`, high saturation, low lightness)
- Maps light pixels to light color (HSL based on `hue`, medium saturation, high lightness)
- Creates consistent two-color aesthetic

**Future:** `colorize_bw`, `extract_and_vary`, `manual_palette` planned.

#### Seeding Strategy

The `seedFrom` property determines how thumbnails are seeded:

```yaml
seedFrom: filename  # Hash filename for seed (default, recommended)
seedFrom: title     # Hash track title for seed
seedFrom: custom    # Use custom seed value (advanced)
```

**Important:** Use `filename` for consistency - even if metadata changes, thumbnail stays the same!

#### Best Practices

**For Visual Consistency:**
```yaml
# Use same pattern and seed image across entire collection
pattern: burning_ship
seedImage: /content/artists/my_artist/assets/logo.png
colorSource: theme  # Matches page theme
```

**For Maximum Detail:**
```yaml
fractalParams:
  maxIterations: 150-200  # Higher = more detail (slower rendering)
  zoom: 3.0-4.0           # Zoom into interesting regions
```

**For Dramatic Effect:**
```yaml
pattern: burning_ship     # Most dramatic fractal
patternOpacity: 0.7-0.8   # Strong overlay
hueRange: 60-120          # Narrower color range for cohesion
```

**For Subtle Backgrounds:**
```yaml
pattern: fractal_noise    # Smooth gradients
patternOpacity: 0.3-0.4   # Light overlay
```

#### Production Examples 🔥

Real-world configurations from Awake.fm artists:

##### Example 1: Julia Set Dragon (Organic Swirls) 💫

Perfect for: Liquid DnB, ambient, melodic sets

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: julia
    
    # Universal color settings
    colorSource: theme       # Matches page theme
    colorMode: duotone_generate
    saturation: 85           # Slightly desaturated for organic feel
    lightness: 50            # Balanced brightness
    hueRange: 240            # Wide rainbow spectrum
    
    # Universal compositing
    blendSeed: true
    blendMode: overlay       # Smooth integration with logo
    patternOpacity: 0.7      # Strong fractal presence
    seedImageAlpha: 0.6      # Logo partially transparent
    
    # Julia-specific parameters
    fractalParams:
      maxIterations: 150     # High detail
      zoom: 1.5              # Standard view
      offsetX: 0.0           # Centered
      offsetY: 0.0           # Centered
      # Julia constant (controls shape)
      juliaC:
        re: -0.7             # Classic dragon curve
        im: 0.27015          # Organic swirls
```

**Result:** Each track gets unique swirling dragon-like patterns with rainbow gradients flowing through semi-transparent logo. Organic, psychedelic aesthetic.

**Try these Julia constants for different shapes:**
```yaml
# Spiral galaxy
juliaC: { re: -0.4, im: 0.6 }

# Lightning bolts
juliaC: { re: 0.285, im: 0.01 }

# Tree branches (dendrite)
juliaC: { re: -0.8, im: 0.156 }

# San Marco Dragon
juliaC: { re: -0.75, im: 0.11 }
```

##### Example 2: Burning Ship Towers (Cyberpunk) 🔥

Perfect for: Neurofunk, techstep, dark DnB

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: burning_ship
    
    # Universal color settings
    colorSource: theme
    colorMode: duotone_generate
    saturation: 90           # High saturation for intensity
    lightness: 55            # Slightly bright
    hueRange: 180            # Moderate color spread
    
    # Universal compositing
    blendSeed: true
    blendMode: multiply      # Dark, rich blending
    patternOpacity: 0.8      # Strong fractal overlay
    seedImageAlpha: 0.8      # Logo mostly opaque
    
    # Burning Ship-specific parameters
    fractalParams:
      maxIterations: 180     # ULTRA-FINE tower detail
      zoom: 2.8              # Zoom in on towers
      offsetX: 0.0           # Centered horizontally
      offsetY: -1.05         # Focus on tower deck region
```

**Result:** Sharp, architectural "tower" structures with intense detail. Dramatic, aggressive aesthetic perfect for heavy music.

##### Example 3: Mandelbrot Classic (Versatile) 🌀

Perfect for: General use, classic fractal aesthetic, psychedelic vibes

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: mandelbrot
    
    # Universal settings
    colorSource: theme
    colorMode: duotone_generate
    saturation: 80           # Balanced saturation
    lightness: 50            # Balanced brightness
    hueRange: 360            # FULL RAINBOW spectrum
    
    # Universal compositing
    blendSeed: true
    blendMode: multiply      # Rich, classic fractal blending
    patternOpacity: 0.6      # Balanced overlay
    seedImageAlpha: 1.0      # Logo fully opaque
    
    # Mandelbrot parameters
    fractalParams:
      maxIterations: 120     # Balanced detail
      zoom: 1.5              # BASE zoom (seeding adds variation around this)
      offsetX: 0.0           # Centered (seeding pans around)
      offsetY: 0.0           # Centered (seeding pans around)
```

**Result:** Classic Mandelbrot with iconic four-directional tendrils (top/bottom/left/right). Rainbow spectrum flows through intricate detail. Each track shows unique view via seeded panning. Base zoom (1.5) keeps focus on interesting regions with minimal black space.

**Pro tip:** Without explicit zoom/offset, seeding might explore empty outer regions. Set a base zoom (1.5-2.5) to focus on the fractal's detailed areas while still allowing seeded variation!

##### Example 4: Tricorn Flowing Tendrils (Elegant) 🦄

Perfect for: Melodic, liquid, soulful sets

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: tricorn
    
    # Universal settings
    colorSource: theme
    colorMode: duotone_generate
    saturation: 75           # Softer saturation
    lightness: 55            # Brighter for elegance
    hueRange: 120            # Analogous colors
    
    # Universal compositing
    blendSeed: true
    blendMode: overlay       # Smooth blending
    patternOpacity: 0.5      # Subtle overlay
    seedImageAlpha: 0.8      # Logo prominent
    
    # Tricorn parameters (EXTREME zoom with offset creates diagonal sweeps!)
    fractalParams:
      maxIterations: 150     # Sharp definition
      zoom: -8.2             # NEGATIVE zoom for inverted/mirrored effect
      offsetX: -0.8          # Offset to find interesting regions
      offsetY: 0.0           # Centered vertically
```

**Result:** Dramatic diagonal sweeping tendrils flowing across corners! Each track unique with elegant flowing aesthetic. The negative zoom creates an inverted/mirrored effect that showcases Tricorn's smooth, organic curves.

**Pro tip:** Tricorn's "heart shape" requires specific zoom to show. Instead, use extreme zoom (positive or negative) with offsets to explore the fractal's beautiful flowing tendrils!

##### Example 5: Fractal Noise (Subtle) 🌊

Perfect for: Ambient, chill, background music

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: fractal_noise
    
    # Universal settings
    colorSource: seed        # Random colors per track
    colorMode: duotone_generate
    saturation: 60           # Desaturated
    lightness: 60            # Bright, airy
    hueRange: 60             # Analogous (tight color range)
    
    # Universal compositing
    blendSeed: true
    blendMode: screen        # Additive, bright blending
    patternOpacity: 0.3      # Very subtle
    seedImageAlpha: 1.0      # Logo fully opaque
    
    # Fractal Noise-specific parameters
    fractalParams:
      octaves: 3             # Fewer layers for smooth flow
      persistence: 0.4       # Low persistence for gentle gradients
      noiseScale: 2.5        # Medium scale for balanced features
```

**Result:** Smooth, flowing gradient clouds. Subtle, doesn't overpower logo. Perfect for when you want recognizable branding with gentle variation.

**Try different noise styles:**
```yaml
# Turbulent (clouds/smoke)
fractalParams:
  octaves: 6
  persistence: 0.6
  noiseScale: 4.0

# Large flowing (lava lamp)
fractalParams:
  octaves: 2
  persistence: 0.3
  noiseScale: 1.5

# Fine texture (marble)
fractalParams:
  octaves: 5
  persistence: 0.5
  noiseScale: 6.0
```

##### Example 6: Sierpinski Triangle (Sharp Geometric) 🔺

Perfect for: Glitch hop, IDM, mathematical/minimal aesthetic

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: sierpinski
    
    # Universal color settings
    colorSource: theme
    colorMode: duotone_generate
    saturation: 85           # High saturation for bold shapes
    lightness: 55            # Balanced brightness
    hueRange: 180            # Wide color variety
    
    # Universal compositing
    blendSeed: true
    blendMode: overlay       # Smooth integration
    patternOpacity: 0.8      # Strong pattern presence
    seedImageAlpha: 1.0      # Logo fully opaque
    
    # No fractalParams needed - depth is seeded automatically
```

**Result:** Recursive triangle patterns with clean, sharp edges. Creates mathematical, structured aesthetic. Each track gets different recursion depth based on filename seed.

**Note:** Sierpinski recursion depth is automatically varied per track (3-5 levels) for visual diversity.

##### Example 7: Geometric Shapes (Clean Polygons) 🔷

Perfect for: House, techno, minimal, modern electronic

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: geometric
    
    # Universal color settings
    colorSource: theme
    colorMode: duotone_generate
    saturation: 80           # Clean, professional saturation
    lightness: 50            # Balanced
    hueRange: 120            # Moderate color spread
    
    # Universal compositing
    blendSeed: true
    blendMode: overlay       # Smooth blending
    patternOpacity: 0.7      # Medium presence
    seedImageAlpha: 1.0      # Logo fully visible
    
    # No fractalParams needed - shapes/positions are seeded
```

**Result:** Random polygons (triangles, squares, hexagons) scattered across canvas. Clean, modern aesthetic with geometric precision. Each track gets unique shape combinations.

##### Example 8: Waves (Flowing Lines) 🌊

Perfect for: Liquid DnB, chillout, ambient, progressive

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: waves
    
    # Universal color settings
    colorSource: theme
    colorMode: duotone_generate
    saturation: 70           # Moderate saturation for smooth flow
    lightness: 55            # Slightly bright
    hueRange: 90             # Tight color harmony
    
    # Universal compositing
    blendSeed: true
    blendMode: overlay       # Smooth, flowing blend
    patternOpacity: 0.6      # Subtle presence
    seedImageAlpha: 1.0      # Logo clear and readable
    
    # No fractalParams needed - wave parameters are seeded
```

**Result:** Flowing sine wave patterns with gentle curves. Creates movement and rhythm. Each track gets unique wave frequencies, amplitudes, and phases based on filename seed.

##### Example 9: Particles (Starfield) ✨

Perfect for: Space bass, ambient, cosmic themes, minimalist

```yaml
thumbnail:
  type: generative_from_seed
  seedImage: /content/artists/my_artist/assets/logo.png
  seedFrom: filename
  style:
    pattern: particles
    
    # Universal color settings
    colorSource: theme
    colorMode: duotone_generate
    saturation: 60           # Desaturated for spacey feel
    lightness: 65            # Bright particles
    hueRange: 40             # Tight color range
    
    # Universal compositing
    blendSeed: true
    blendMode: overlay       # Soft, glowing blend
    patternOpacity: 0.4      # Very subtle
    seedImageAlpha: 1.0      # Logo prominent
    
    # No fractalParams needed - particle count/positions are seeded
```

**Result:** Scattered dots like a starfield. Minimal, spacey aesthetic with clean, open composition. Each track gets unique particle placement and density. Perfect for letting logo/branding shine while adding subtle texture.

#### Performance Considerations

- **Iteration count:** Higher = more detail but slower rendering
  - 50-80: Fast, good for testing
  - 80-120: Balanced (recommended)
  - 120-200: Maximum detail, slower

- **Lazy loading:** Thumbnails use IntersectionObserver - only render when visible
- **Canvas size:** Automatically sized to container (responsive)
- **Rendering:** Pure Canvas 2D (no p5.js overhead)

#### Troubleshooting

**Thumbnails not showing:**
- Check `seedImage` path is correct
- Ensure content graph is rebuilt: `python -m scripts.builder`
- Verify browser console for errors

**Thumbnails look too similar:**
- Increase `hueRange` (0-360 for maximum variation)
- Try different `pattern` type
- Adjust `zoom` and `offset` for different fractal regions

**Thumbnails too dark/light:**
- Adjust `lightness` (0-100)
- Try `saturation` adjustments
- Check `patternOpacity` (lower = more seed image shows through)

**Performance issues:**
- Lower `maxIterations` (50-100)
- Use simpler patterns (`geometric`, `waves` instead of fractals)
- Ensure lazy loading is working (check console)

---

### 4. Markdown Block

Renders markdown content.

```yaml
- type: markdown
  content: |
    # Heading
    This is **bold** and this is *italic*.
```

**Properties:**
- `content` (string) - Markdown text

---

### 5. Audio Player Block

Embeds an audio player with visualizer support.

```yaml
- type: audio_player
  track_path: /artists/zol/music/tracks/neon-dreams
  visualizer: spectrum-bars   # spectrum-bars, gforce-flow, nebula-flight
  visualizer_options:
    renderer: webgl           # webgl or 2d (default: 2d)
```

**Properties:**
- `track_path` (string) - Path to track node
- `visualizer` (string, optional) - Visualizer ID
- `visualizer_options` (object, optional) - Visualizer configuration

---

### 6. Subpage Block

Creates a styled link to another page/node with configurable appearance.

```yaml
- type: subpage
  ref: /artists/awake_fm_legacy/pages/bassdrive
  title: "Bassdrive Radio Archive"
  badge: "50+ SETS"
  align: center
  size: large
  weight: bold
  decoration: none
  transform: uppercase
  font: heading
  icon:
    position: right
    type: arrow
```

**Properties:**
- `ref` (string, required) - Path to target page/node
- `title` (string) - Display text for the link
- `label` (string) - Deprecated, use `title` instead
- `badge` (string, optional) - Badge text (e.g., "NEW", "50+ ITEMS")
- `nav` (boolean) - Include in navigation dropdowns (default: false)

**Styling Options:**
- `align` (string) - Horizontal alignment: `left`, `center`, `right` (default: `left`)
- `size` (string) - Font size: `small`, `medium`, `large`, `xl` (default: `large`)
- `weight` (string) - Font weight: `light`, `normal`, `bold` (default: `bold`)
- `decoration` (string) - Text decoration: `none`, `underline`, `overline` (default: `none`)
- `transform` (string) - Text transform: `none`, `uppercase`, `lowercase`, `capitalize` (default: `none`)
- `font` (string) - Font family: `body`, `heading`, `mono` (default: `heading`)
- `icon` (object, optional) - Icon configuration
  - `position` - Icon placement: `left`, `right`, `none` (default: `right`)
  - `type` - Icon symbol: `arrow`, `chevron`, `external`, `none` (default: `arrow`)

**Examples:**

```yaml
# Centered, uppercase link with badge
- type: subpage
  ref: /pages/archive
  title: "Radio Archive"
  badge: "50+ SETS"
  align: center
  transform: uppercase

# Simple left-aligned link
- type: subpage
  ref: /pages/bio
  title: "Read Full Bio"
  size: medium
  weight: normal

# External-style link with icon
- type: subpage
  ref: /pages/store
  title: "Visit Store"
  icon:
    type: external
    position: right
```

---

## `_meta.yaml` - Folder Metadata

The `_meta.yaml` file defines **folder-level configuration** that applies to the node and potentially its children.

### Structure

```yaml
theme: cyberpunk           # Theme name (inherits from parent if omitted)
effects:
  - scanlines
  - chromatic-aberration
collection_order:          # Custom ordering for collections sourced from this folder
  - zol
  - rom_trooper
  - ishimura
  - hierba_phase
  - the_ravine
```

### Properties

- **`theme`** (string, optional) - Visual theme name
  - Inherits from parent node if not specified
  - Available themes: `cyberpunk`, `neon`, `minimal`, etc.
- **`effects`** (array, optional) - Visual effects to apply
  - Examples: `scanlines`, `chromatic-aberration`, `vhs`, `crt`
- **`collection_order`** (array, optional) - Custom ordering for child nodes
  - List of slugs (folder names) in desired order
  - Used by collection blocks when `sort` is not explicitly set
  - Unlisted items appear at the end, sorted alphabetically

---

## Themes and Effects

### Themes

Themes control the overall visual style (colors, fonts, spacing). Set via `_meta.yaml`:

```yaml
theme: cyberpunk
```

Themes cascade down the node tree - child nodes inherit the parent's theme unless they specify their own.

### Effects

Effects are visual overlays/filters applied to content:

```yaml
effects:
  - scanlines        # Retro CRT scanline effect
  - chromatic-aberration  # RGB color separation
  - vhs              # VHS tape distortion
  - crt              # CRT monitor curvature
```

Effects also cascade and can be combined.

---

## Content Graph Pipeline

Understanding the full pipeline helps when debugging or adding new features.

### 1. Content Creation (YAML)

You create/edit YAML files in the `content/` directory.

```yaml
# content/artists/zol/index.yaml
layout: artist
display_name: Zol
blocks:
  - type: hero
    title: Zol
```

### 2. Build Script (`scripts/builder.py`)

Parses YAML files and generates `build/content_graph.json`:

```bash
cd artist-node
python -m scripts.builder
```

**Key functions:**
- `parse_block()` - Parses individual blocks from YAML
- `build_node_from_directory()` - Builds node metadata and content

### 3. Content Graph (`backend/models/content_graph.py`)

Loads the JSON at runtime and provides query methods:

- `get_node(path)` - Retrieve a node by path
- `get_children(path)` - Get child nodes
- `resolve_collection()` - Resolve collection data

### 4. API Endpoints (`backend/controllers/`)

Serve content via REST API:

- `GET /api/node?path=/artists/zol` - Get node content
- `GET /api/collection?source=folder&path=/artists` - Get collection data

### 5. Frontend Components (`frontend/vue/src/components/`)

Render content blocks:

- `BlockRenderer.vue` - Routes blocks to appropriate components
- `CollectionBlock.vue` - Renders collections
- `CollectionGrid.vue`, `CollectionList.vue`, `CollectionCarousel.vue` - Layout modes
- `ArtistCard.vue`, `AlbumCard.vue`, `TrackCard.vue` - Card components

---

## Adding New Properties

When adding a new property to blocks or metadata, you must update **all three parsers**:

### Example: Adding `section.align`

1. **Backend Model** (`backend/models/blocks/section.py`)
   ```python
   @dataclass
   class SectionBlock:
     # ... existing fields
     align: Optional[Dict[str, Any]] = None  # <-- ADD THIS
   ```

2. **Builder Script** (`scripts/builder.py`)
   ```python
   if block_type == "section":
     return SectionBlock(
       # ... existing fields
       align=raw.get("align"),  # <-- ADD THIS
     )
   ```

3. **Content Graph Parser** (`backend/models/content_graph.py`)
   ```python
   if btype == "section":
     return SectionBlock(
       # ... existing fields
       align=data.get("align"),  # <-- ADD THIS
     )
   ```

4. **Node Parser** (`backend/models/node.py`)
   ```python
   elif btype == "section":
     blocks.append(SectionBlock(
       # ... existing fields
       align=b.get("align"),  # <-- ADD THIS
     ))
   ```

5. **Rebuild Content Graph**
   ```bash
   cd artist-node
   python -m scripts.builder
   ```

6. **Frontend Component** (e.g., `BlockRenderer.vue`)
   ```typescript
   // Use the new property
   const align = block.align?.horizontal || 'left';
   ```

**Critical**: Properties must be added in ALL parsers or they'll be `null` in the output!

---

## Collection Ordering

Collections support flexible ordering through a 3-tier priority system.

### Priority 1: Explicit Sort (Highest)

Set `sort` in the collection block:

```yaml
- type: collection
  source: folder
  path: /artists
  sort: random  # Overrides everything
```

### Priority 2: Collection Order

Set `collection_order` in the parent folder's `_meta.yaml`:

```yaml
# content/artists/_meta.yaml
collection_order:
  - zol
  - rom_trooper
  - ishimura
```

This applies to **all collections sourced from this folder** unless they have an explicit `sort`.

### Priority 3: Default (name_asc)

If no `sort` or `collection_order` is specified, items are sorted alphabetically.

---

## Card Types

Cards are reusable components for displaying collection items.

### Artist Card

Displays artist information with sigil/image.

**Modes:**
- `grid` - Vertical card (sigil above, text below)
- `list` - Horizontal card (sigil left, text right)
- `carousel` - Compact vertical card

**Data:**
- `display_name` - Artist name
- `slug` - URL slug
- `blurb` - Short description
- `sigil` - Generative sigil configuration

### Album Card (Future)

Displays album artwork and metadata.

### Track Card (Future)

Displays track information with play button.

---

## Visualizers

Audio visualizers are powered by **RadiantForge** (p5.js-based framework).

### Available Visualizers

- **`spectrum-bars`** - Classic frequency spectrum bars
- **`gforce-flow`** - Flowing particle trails (2D renderer)
- **`nebula-flight`** - 3D starfield with parallax (WebGL renderer)

### Configuration

```yaml
- type: audio_player
  track_path: /artists/zol/music/tracks/neon-dreams
  visualizer: nebula-flight
  visualizer_options:
    renderer: webgl  # webgl or 2d (default: 2d)
    # ... visualizer-specific options
```

### Renderer Selection

- **2D renderer** - Faster for pixel manipulation, trail effects
- **WebGL renderer** - Faster for massive particle counts, 3D transforms

---

## Sigils

Sigils are visual identity elements that can appear in hero blocks, artist cards, and other contexts. They can be either **generative p5.js animations** or **static images**.

### Sigil Types

#### 1. Generative p5.js Sigils

Animated sketches powered by p5.js that create unique, dynamic visuals:

```yaml
sigil:
  type: "p5"
  id: "node-001"              # Registered sigil ID (e.g., "node-001", "orbit-sigil")
  options:
    seed: "artist-name"       # Seed for consistent generation
    variant: "orbit"          # Visual variant/style
    color: "#00ffff"          # Custom color (optional)
```

**Available p5.js Sigils:**
- `node-001` - Default generative sigil (particles, geometric shapes)
- Custom sigils can be registered in the RadiantForge system

**Generative Default:**
If no sigil is specified in artist cards, a **hash-based generative sigil** is automatically created using the artist's name as a seed. This ensures:
- Visual consistency (same artist = same sigil)
- Unique identity (different artists = different sigils)
- No manual configuration required

#### 2. Static Image Sigils

Use your own logo, artwork, or icon:

```yaml
sigil:
  type: "image"
  src: "/content/artists/artist-name/logo.png"
  alt: "Artist Logo"
```

**Supported formats:** PNG, JPG, SVG, GIF, WebP

**Best practices:**
- Use square images (1:1 aspect ratio)
- Recommended size: 512x512px or higher
- Transparent backgrounds work best (PNG)
- Keep file size reasonable (<500KB)

### Sigil Contexts

Sigils appear in multiple places:

1. **Hero Blocks** - Large, prominent display with optional background
2. **Artist Cards** - Small icon in collection grids/lists
3. **Navigation** - (Future) Menu items and breadcrumbs

### Combining Sigils with Backgrounds

In hero blocks, you can layer a sigil over a background image:

```yaml
- type: hero
  heading: "Artist Name"
  background: "/content/assets/backgrounds/abstract.jpg"  # Full-width background
  sigil:                                                   # Centered overlay
    type: "image"
    src: "/content/artists/artist-name/logo.png"
```

This creates a professional, branded hero section with depth and visual interest.

---

## Best Practices

### Content Organization

- **One node per directory** - Each folder represents a single content node
- **Use `_meta.yaml` for folder-level config** - Theme, effects, collection ordering
- **Use `index.yaml` for content** - Blocks, layout, display metadata

### Collection Ordering

- **Use `collection_order` for curated lists** - Featured artists, recommended albums
- **Use `sort: random` for discovery** - Encourage exploration
- **Use `sort: name_asc` for directories** - Large collections benefit from alphabetical order

### Performance

- **Limit `per_page` for large collections** - 12-24 items per page is ideal
- **Use `load_more` for better UX** - Avoids overwhelming users with pagination controls
- **Choose the right visualizer renderer** - 2D for simple effects, WebGL for particles

### Theming

- **Set theme at the top level** - Let it cascade down
- **Override theme for special sections** - Artist-specific branding
- **Combine effects sparingly** - Too many effects can be distracting

---

## Troubleshooting

### Content not updating?

1. **Rebuild the content graph:**
   ```bash
   cd artist-node
   python -m scripts.builder
   ```

2. **Restart the backend server** (if needed)

3. **Check for YAML syntax errors** - Indentation matters!

### Property not showing up?

- **Check all three parsers** - `builder.py`, `content_graph.py`, `node.py`
- **Rebuild content graph** after backend changes
- **Check frontend component** - Is it reading the property?

### Collection not in the right order?

- **Check sort priority** - Explicit `sort` overrides `collection_order`
- **Verify `collection_order` in `_meta.yaml`** - Must be in parent folder
- **Check slugs** - Must match folder names exactly

### Sigils not resizing?

- **Check container CSS** - Sigil fills parent container
- **ResizeObserver** handles dynamic resizing automatically

---

## Examples

### Complete Artist Node

```yaml
# content/artists/zol/index.yaml
layout: artist
display_name: Zol
slug: zol
tagline: "Electronic Producer"

# Preview data for collection cards
preview:
  title: "Zol"
  caption: "Zol — Electronic Producer"
  badge: "Artist"
  blurb: "Experimental electronic music blending ambient textures with glitchy beats."

blocks:
  - type: hero
    title: Zol
    subtitle: Electronic music producer

  - type: section
    label: Latest Tracks
    blocks:
      - type: collection
        source: folder
        path: /artists/zol/music/tracks
        card: track
        layout:
          mode: grid
          columns:
            xs: 1
            sm: 2
            md: 3
        paging:
          mode: load_more
          per_page: 12
```

### Curated Artist Directory

```yaml
# content/artists/_meta.yaml
theme: cyberpunk
effects:
  - scanlines
collection_order:
  - zol
  - rom_trooper
  - ishimura
```

```yaml
# content/server/index.yaml
layout: page
display_name: Awake.fm

blocks:
  - type: hero
    title: Awake.fm
    subtitle: Decentralized Music Network

  - type: section
    label: Featured Artists
    align:
      horizontal: center
    blocks:
      - type: collection
        source: folder
        path: /artists
        card: artist
        layout:
          mode: grid
          columns:
            xs: 1
            sm: 2
            md: 3
            lg: 4
          align:
            horizontal: center
        paging:
          mode: load_more
          per_page: 12
        # No explicit sort - uses collection_order from artists/_meta.yaml
```

---

## Future Features

- **Custom card types** - User-defined card components
- **Advanced filtering** - Filter collections by genre, date, etc.
- **Search** - Full-text search across content
- **Dynamic theming** - User-selectable themes
- **Interactive visualizers** - Rhythm games, particle painters
- **Custom sigil upload** - Artist-provided p5.js code or static images

---

## Contributing

When adding new features to the CMS:

1. **Update backend models** - Add dataclass fields
2. **Update all three parsers** - `builder.py`, `content_graph.py`, `node.py`
3. **Add frontend components** - Vue components for rendering
4. **Update this guide** - Document the new feature
5. **Test the pipeline** - YAML → build → API → frontend

---

## Support

For questions or issues:
- Check this guide first
- Review the code comments
- Ask the AI assistant (it knows this guide!)

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-11


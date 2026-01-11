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


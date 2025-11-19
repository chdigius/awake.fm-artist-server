Awake.fm Artist Node – Content & Config Architecture (v2, 2025-11-19)
====================================================================

This document defines the structure of an Awake.fm artist server node, including:

- Node-level infrastructure configuration
- File-based content graph
- Server/label metadata
- Artist metadata
- Layout-driven rendering rules
- Horizontal scaling considerations

This version supersedes earlier drafts and reflects the clean separation between node infra config and site content.

--------------------------------------------------------------------
1. Core Concepts
--------------------------------------------------------------------

There are two distinct layers in an Awake.fm artist node:

A) Node Infrastructure (outside the content directory)
   - Lives in: config/node.yaml
   - Controls:
       node_id
       network registration and endpoints
       public/API base URLs
       auth subsystem
       security/Blackveil behavior
       pointer to the content root
   - Does not describe artists, albums, pages, or label information.

B) Content Graph (inside the content directory)
   - Flat-file, folder-based, YAML-driven content model.
   - Any folder containing index.yaml is a content node.
   - Layout-based rendering for each node.
   - Fully shareable across multiple instances in a cluster.
   - Suitable for horizontal scaling and flexible deployment.

Routing behavior is derived from the content graph via the value of root_content inside content/_meta.yaml.

Example:
root_content: server        => "/" routes to content/server/index.yaml
root_content: artists/zol   => "/" routes to content/artists/zol/index.yaml

--------------------------------------------------------------------
2. Directory Structure
--------------------------------------------------------------------

Example structure:

project/
  config/
    node.yaml
  content/
    _meta.yaml
    server/
      _meta.yaml
      index.yaml
      pages/
        about/
          index.yaml
        store/
          index.yaml
          items/
            awake-node-shirt-black-l/
              index.yaml
              media/
        releases/
          index.yaml
          awake-001/
            index.yaml
            media/
    artists/
      zol/
        _meta.yaml
        index.yaml
        pages/
          about/
            index.yaml
          studio/
            index.yaml
        music/
          albums/
            void-systems/
              index.yaml
              media/
              tracks/
                01-pulse-arrival/
                  index.yaml
                  media/
          tracks/
            stray-signal/
              index.yaml
              media/
          sets/
            live-berlin-2025/
              index.yaml
              media/
      dissolvr/
        _meta.yaml
        index.yaml
        pages/
          about/
            index.yaml
        music/
          tracks/
            dissolve-88/
              index.yaml
              media/

--------------------------------------------------------------------
3. Node Infrastructure Config (config/node.yaml)
--------------------------------------------------------------------

Node-level configuration exists outside the content graph.

Example:

node_id: awake-fm-node-001

network:
  mothership_base_base_url: "https://api.awake.fm"
  register_on_start: true

endpoints:
  public_base_url: "https://awake-fm-node-001.awake.fm"
  api_base_url: "https://awake-fm-node-001.awake.fm/api"

content:
  root: "content/"

features:
  auth: true

security:
  allow_scraping: false

Purpose:
- Defines node identity for the Awake network.
- Allows deployment as a cluster behind a load balancer.
- Controls infrastructure-level features (auth, security).
- Points to the content directory.

Does not define:
- Artists
- Imprints
- Releases
- Store setup
- Rendering/layout logic

Those belong in the content graph under content/.

--------------------------------------------------------------------
4. Content Graph Config (content/_meta.yaml)
--------------------------------------------------------------------

Defines metadata about the content graph itself.

Example:

theme: crt
root_content: server

theme:
  Selects the visual theme for the node.

root_content:
  Determines how routing behaves.
  "server" means "/" maps to content/server/index.yaml
  "artists/zol" means "/" maps to content/artists/zol/index.yaml
  Can point to any folder containing an index.yaml.

This removes the need for a "mode: single_artist | multi_artist" flag.

--------------------------------------------------------------------
5. Server-Level Metadata (content/server/_meta.yaml)
--------------------------------------------------------------------

Defines the identity and behavior of the server/label within the content graph.

Example:

slug: awake-fm-node-001
display_name: "Awake FM Node 001"

layout: server

features:
  imprints: true
  releases: true
  store: true

imprints:
  - id: nocturne
    slug: nocturne
    label: "Nocturne Division"

roster:
  - artist_id: zol
  - artist_id: dissolvr

Purpose:
- Identifies the label or multi-artist node.
- Determines how the server root should render (layout: server).
- Declares content-level features (store, releases, imprints).
- Provides imprint and roster definitions for UI and filtering.

--------------------------------------------------------------------
6. Artist Metadata (content/artists/<artist>/_meta.yaml)
--------------------------------------------------------------------

Defines metadata for a specific artist.

Example:

id: zol
person_id: chris-d
display_name: ZØL
status: active

imprints:
  - id: nocturne
    role: resident
    primary: true

Supports:
- Artist aliases
- Artist collectives
- Multi-artist albums and collaborations
- Imprint membership and filtering

--------------------------------------------------------------------
7. Pages, Layouts, and Subpages
--------------------------------------------------------------------

Any folder with index.yaml is a page node.

Pages contain:
- layout: <string>
- content: array of blocks

Example subpage reference:

- type: subpage
  ref: items/zol-logo-tee
  view: card

Parent layout determines how subpage previews are rendered (table, grid, card, row).
Child layout determines how the full page renders at its own route.

--------------------------------------------------------------------
8. Music Entities (Tracks, Albums, Sets)
--------------------------------------------------------------------

Tracks, albums, and sets are regular content nodes.

Typical locations:
- artists/<artist>/music/albums/<album-slug>/index.yaml
- artists/<artist>/music/tracks/<track-slug>/index.yaml
- artists/<artist>/music/sets/<set-slug>/index.yaml

Each may include:
- id
- title
- artists
- audio metadata
- store block (optional)
- tracklist (for sets)

--------------------------------------------------------------------
9. Store and Merch
--------------------------------------------------------------------

Any content node can be sellable via a "store" block:

store:
  enabled: true
  type: digital | physical | bundle
  scope: artist | server
  price:
    amount: 12
    currency: USD
  stripe:
    product_id: prod_xyz
    price_id: price_abc

Store pages list merch items as subpages.

--------------------------------------------------------------------
10. Horizontal Scaling Considerations
--------------------------------------------------------------------

- config/node.yaml references a shared content directory.
- All instances in a cluster mount the same content directory or deploy with identical baked-in content.
- Node registration is logical: one node_id, many container instances.
- Behind an ALB, each instance loads config/node.yaml and the same content graph.
- Auth subsystem should use JWT or a shared session store.
- Blackveil security features may run per-instance or as an edge proxy.

No modifications to the content architecture are required for scaling.

--------------------------------------------------------------------
11. Rendering Engine Flow (Updated)
--------------------------------------------------------------------

1. Load config/node.yaml
   Node identity, endpoints, network behavior, auth.

2. Load content/_meta.yaml
   Theme and root_content.

3. Index the content graph
   Scan for index.yaml files.
   Load metadata from local _meta.yaml files.
   Build relationships for subpages, tracks, sets, etc.

4. Resolve the root node
   root_content points at a folder containing index.yaml.

5. Render pages using:
   Node’s declared layout
   Per-node layout fields in index.yaml
   Subpage rendering styles

6. Expose store capabilities when store.enabled is true.

--------------------------------------------------------------------
12. Key Benefits
--------------------------------------------------------------------

- Clean separation of node infrastructure vs. site content.
- Automatically supports horizontal scaling.
- Portable content graph for easy deployment, cloning, and migration.
- Routing derived from content graph via root_content.
- Layout-driven rendering system.
- Works for single-artist or multi-artist nodes without separate modes.
- Foundation for future GUI CMS tools.
- Future-safe for encrypted mesh audio engine and Blackveil integration.

--------------------------------------------------------------------
END OF DOCUMENT
--------------------------------------------------------------------

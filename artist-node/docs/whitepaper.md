Awake.fm: The Artist-Owned Internet
======================================
Whitepaper v0.1 – Initial Manifesto Draft
November 2025


Preface
-------
This document describes the philosophical and technical foundation of Awake.fm:
a decentralized, artist-run music network built to outlive every corporate
platform that came before it.

This is not a startup pitch.
This is not a VC deck.
This is not a token sale.
Awake.fm is a rebellion—against the corporate chokehold on online music,
against the platform landlord class, against the endless cycle of services
that begin “friendly to artists” and end owned by shareholders.

Awake.fm is built on a simple truth:

    The future of digital culture belongs to the people who create it,
    not the corporations that exploit it.


1. The Problem
--------------
Every modern “creator platform” is built on a lie.

They promise freedom.
They promise discovery.
They promise empowerment.

But behind each promise sits the same machinery:
  - centralized control,
  - algorithmic manipulation,
  - data extraction,
  - shareholder pressure,
  - and an inevitable pivot toward squeezing creators for more revenue.

SoundCloud. Bandcamp. Spotify. TikTok. YouTube. Twitch.
The names change; the outcome doesn’t.

As soon as a platform grows, it bends to the logic of shareholders.
That logic is incompatible with art, culture, and human expression.

Creators don’t need another app.
Creators need sovereignty.


2. The Awake.fm Thesis
----------------------
Awake.fm exists to flip the modern internet on its head.

Instead of:
    “Artists publish on platforms.”

We propose:
    “Artists *are* the platform.”

Awake.fm is not a corporation.
Awake.fm is not a service provider.
Awake.fm is not a public company.

Awake.fm is a **protocol** and a **network topology** that empowers artists
to run their own infrastructure—individually, collectively, or as labels—
and connect to each other voluntarily.

There are no shareholders.
There is no VC ownership.
There is no corporate governance.

There is only the network.


3. Core Principles
------------------

(1) Sovereignty  
Artists must own:
  - their data,
  - their servers,
  - their identity,
  - their store,
  - their destiny.

(2) Autonomy  
No algorithm decides what fans see.
No recommendation engine manipulates culture.
Each artist node defines its own world.

(3) Federation Without Fragility  
Nodes interconnect freely.
Collaborate freely.
Cache data mesh-style.
But each node remains independent.

If one server disappears, the network continues.
If one server thrives, the network grows stronger.

(4) Zero-Extraction Economics  
Awake.fm takes 0% of revenue.
There is no “platform fee.”
Payments go directly to artists.

(5) No Tokens. No Hype. No Bullshit.  
Blockchain—where used—is leveraged strictly for:
  - transparent accounting,
  - verifiable royalties,
  - multi-artist revenue splits,
  - trustless audit trails.

Not for speculation.
Not for pump-and-dumps.
Not for get-rich-quick schemes.

(6) A Future Beyond the Mothership  
Awake.fm will begin with a centralized index (“the mothership”) to bootstrap
discovery. But its long-term purpose is to disappear.

A mature Awake.fm network should be able to:
  - route without a central authority,
  - discover nodes peer-to-peer,
  - share metadata and content through a mesh,
  - operate indefinitely even if the original founders vanish.

In the end, Awake.fm becomes “ownerless.”
A permanent digital commons.
A cultural organism.


4. Architecture Overview
------------------------
Awake.fm is composed of two major layers:

A) The Artist Node  
Each artist (or label/collective) runs their own server:
  - content stored as flat-file YAML,
  - local store with direct Stripe payouts,
  - their own metadata, pages, albums, and tracks,
  - encrypted audio shards (future),
  - distributed caching,
  - optional Blackveil anti-scraper technology.

Artist nodes are standalone websites—beautiful, fast, sovereign.

B) The Mothership (Temporary)  
A centralized service providing:
  - network index,
  - search,
  - temporary content cache,
  - peer verification,
  - onboarding assistance.

This service exists only for early growth.
Its long-term mission is obsolescence.

C) The Mesh (Long-Term)
The final form of Awake.fm:
  - artist nodes discover each other directly,
  - metadata syncs without a hub,
  - audio is streamed from the mesh itself,
  - no corporation owns the backbone.

Survival of the network depends on the artists, not on Awake.fm HQ.


5. Node Design (Technical Summary)
----------------------------------
Each Artist Node is defined by two layers:

1) config/node.yaml – The Node OS
   Contains:
     - node_id
     - network settings
     - endpoints
     - content root
     - auth flags
     - security (Blackveil)
   This file determines *how the node lives on the network*.

2) content/ – The Content Graph
   A fully modular, flat-file structure defining:
     - server identity
     - roster and imprints
     - artist profiles
     - albums, tracks, sets
     - merch and store products
     - page layouts and routing
     - theming
   Any folder with an index.yaml is a page.
   Routing is derived from root_content in content/_meta.yaml.

Nodes can scale horizontally.
Nodes can be clustered behind an ALB.
Nodes can be forked, cloned, exported, moved, or backed up.
Nodes belong entirely to their owner.


6. Economics and Fairness
-------------------------
Awake.fm’s economic model is brutally simple:

    100% of revenue goes to the artist.

No middlemen.
No platform tax.
No artificial scarcity.
No “premium tiers.”
No pay-to-promote.
No algorithmic manipulation.

Artists may choose to:
  - sell their tracks,
  - sell albums or sets,
  - sell merch,
  - enable direct support,
  - run a store jointly as a collective,
  - or give everything away.

Awake.fm enforces nothing.
Artists define their own economy.


7. Security and Blackveil
-------------------------
Awake.fm’s stance on scraping is aggressive:
AI platforms are not entitled to harvest independent artists’ work.

Blackveil (future):
  - media poisoning,
  - bot fingerprinting,
  - rate-shaping,
  - honeypots,
  - distributed blocklists.

Artists should control how their art is used.
The default is opt-out, not opt-in.


8. Long-Term Vision: The Ownerless Network
------------------------------------------
Awake.fm is not a product.
It is not a startup.
It is not a company.

It is a design for a future:
  - where culture belongs to creators,
  - where the web is no longer corporate property,
  - where infrastructure is shared but not centralized,
  - where music can survive without gatekeepers,
  - where digital art exists on human terms.

In its mature form:
  - The mothership dissolves.
  - Nodes run independently.
  - Metadata is decentralized.
  - Mesh routing replaces central indexing.
  - Awake.fm becomes a public utility: a living, breathing digital organism.

No owner.
No board.
No corporation.

Only the network.


9. Closing Statement
--------------------
The modern internet has betrayed its creators.
It’s time to build something better.

Not another platform.
Not another corporation.
Not another walled garden.

A network.
A movement.
A sovereign space for music to live on its own terms.

Awake.fm is not a brand.
Awake.fm is not a business.
Awake.fm is a declaration:

    The era of corporate control over culture is ending.
    The future belongs to the creators.
    We are building the escape hatch.

Victory or Death.
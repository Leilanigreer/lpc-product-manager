## Shopify metaobject mapping and Postgres deprecation plan

This document tracks how we map Shopify collections/metafields/metaobjects into our Prisma/Postgres models, and which parts of our legacy Postgres schema we can eventually replace with Shopify metaobjects.

---

## 1. Current Shopify collection metafields → Prisma mapping

- **Namespace**: `custom` (Shopify collection metafields)

- **Thread and style flags**
  - **`custom.thread_type`** → `ShopifyCollection.threadType : ThreadType`
    - Enum values: `EMBROIDERY | STITCHING | NONE` (see `ThreadType` in `schema.prisma`).
  - **`custom.needs_secondary_leather` (boolean)** → `ShopifyCollection.needsSecondaryLeather : Boolean`
  - **`custom.needs_stitching_color` (boolean)** → `ShopifyCollection.needsStitchingColor : Boolean`
  - **`custom.needs_color_designation` (boolean)** → `ShopifyCollection.needsColorDesignation : Boolean`
  - **`custom.needs_style` (boolean)** → `ShopifyCollection.needsStyle : Boolean`
  - **`custom.style_per_collection` (boolean)** → `ShopifyCollection.stylePerCollection : Boolean`

- **Naming and SKU patterns**
  - **`custom.sku_pattern` (single line)** → `ShopifyCollection.skuPattern : String?`
    - Example patterns and placeholders:
      - `Quilted-{leatherColors.primary.abbreviation}-{globalEmbroideryThread.abbreviation}`
      - `Classic-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}`
      - `Argyle-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}-{stitchingThreads.[0].abbreviation}`
      - `Exotic-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}`
      - `QClassic-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}`
      - `EQuilted-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}`
  - **`custom.default_style_name_pattern` (single line / enum-like)** → `ShopifyCollection.defaultStyleNamePattern : StyleNamePattern`
    - Maps to `StyleNamePattern` enum:
      - `STANDARD` – `"{leather.label} {style.leatherPhrase} {style.label}"`
      - `STYLE_FIRST` – `"{style.label} with {leather.label} {style.leatherPhrase}"`
      - `CUSTOM` – Uses `customNamePattern`.

- **Drive / asset integration**
  - **`custom.google_driver_folder_id` (single line, nullable)** → `ShopifyCollection.googleDriveFolderId : String?`
    - Nullable; loaders must handle `null` or missing metafields gracefully.

- **Pricing**
  - **`custom.pricing_tier` (metaobject)** → `PriceTier` + relation from `ShopifyCollection`
    - Shopify metaobject fields:
      - `name` → `PriceTier.name : String`
      - `shopify_price` → `PriceTier.shopifyPrice : Decimal`
      - `marketplace_price` → `PriceTier.marketplacePrice : Decimal`
    - Relationship:
      - `ShopifyCollection.priceTierId : String?` (FK) → `PriceTier.id : String`
      - `ShopifyCollection.PriceTier?` (Prisma relation)
      - `PriceTier.collection? : ShopifyCollection?`

- **Shape-specific pricing adjustments**
  - **Metaobject type**: `shape_type_adjustment` (linked to `pricing_tier`)
  - Shopify metaobject fields → Prisma `ShapeTypeAdjustment`:
    - `shape_type` → `shapeType : ShapeType`
      - Enum values: `DRIVER`, `WOOD`, `HYBRID`, `PUTTER`, `ZERO_MALLET`, `OTHER`.
    - `price_tier` (reference) → `tierId : String` / `tier : PriceTier`
    - `shopify_adjustment` → `shopifyAdjustment : Decimal`
    - `marketplace_adjustments` → `marketAdjustment : Decimal`
    - `is_base_price` → `isBasePrice : Boolean`

---

## 2. Existing hybrid models (Postgres + Shopify IDs already present)

These models are already partially migrated to Shopify; they should guide how we phase out legacy Postgres tables over time.

- **`ProductSetDataLPC`**
  - **Current fields** (relevant to migration):
    - `fontId : String?` + `font : Font?` – legacy Postgres fonts.
    - `fontShopifyId : String?` – Shopify `custom.font` metaobject GID.
    - `leatherColor1Id : String?` / `leatherColor1 : LeatherColor?` – legacy primary leather.
    - `leatherColor1ShopifyId : String?` – Shopify `leather_color` metaobject GID.
    - `leatherColor2Id : String?` / `leatherColor2 : LeatherColor?` – legacy secondary leather.
    - `leatherColor2ShopifyId : String?` – Shopify `leather_color` metaobject GID.
  - **Direction of travel**:
    - Use Shopify metaobjects (`fontShopifyId`, `leatherColor*ShopifyId`) as source of truth.
    - Gradually stop writing / depending on `fontId`, `leatherColor1Id`, `leatherColor2Id` except for backward compatibility and reporting.

- **`ShopifyCollection`**
  - Already the central bridge between Shopify collections and local config:
    - Holds IDs (`shopifyId`, `admin_graphql_api_id`).
    - Holds config flags that are backed by collection metafields (see section 1).
    - Holds `priceTierId` which is backed by a Shopify pricing-tier metaobject.
  - Over time, we can treat this model as a normalized cache/lookup layer for Shopify data, rather than the primary source of truth for configuration.

---

## 3. Candidates to migrate from Postgres to Shopify metaobjects

This section lists models that could reasonably move to Shopify metaobjects, plus what would remain in Postgres.

### 3.1 Leather colors

- **Current Postgres model**: `LeatherColor`
  - Fields: `name`, `abbreviation`, `isLimitedEditionLeather`, `isActive`, plus many-to-many `ColorTag` relations.
- **Existing Shopify hooks**:
  - `ProductSetDataLPC.leatherColor1ShopifyId` / `leatherColor2ShopifyId` already reference a Shopify `leather_color` metaobject.
- **Proposed state**:
  - Use Shopify `leather_color` metaobject as the canonical record of:
    - Display name.
    - Abbreviation.
    - `collection_name` (stock collections) and `blended_collection_name` (single line: `"[Collection] Name"`, e.g. `[Phoenix] Pebbled Royal`; name-only when there is no collection).
    - Limited vs stock designation.
    - Active/inactive status.
    - Optional color tags (if modeled on Shopify).
  - **Postgres role**:
    - Option A: Deprecate `LeatherColor` entirely once all flows read from Shopify.
    - Option B: Keep a thin cache/table keyed by Shopify metaobject GID (for query performance and reporting), but no longer manually edited in the app.

### 3.2 Thread colors (embroidery + stitching)

- **Current Postgres models**:
  - `EmbroideryThread` + `IsacordNumber` (Isacord-specific metadata).
  - `StitchingThread` + `AmannNumber` (Amann-specific metadata).
  - `ColorTag` (shared tagging across leather, stitching, embroidery).
- **Proposed Shopify metaobjects**:
  - `embroidery_thread` metaobject:
    - Fields mirroring `EmbroideryThread` and `IsacordNumber`:
      - Display name, abbreviation.
      - One-to-many or list field of Isacord numbers (number, Wawak info).
  - `stitching_thread` metaobject:
    - Fields mirroring `StitchingThread` and `AmannNumber`:
      - Display name, abbreviation.
      - One-to-many or list field of Amann numbers (number, Wawak info).
  - Optional: a tag metaobject (or metafield list) if we want to move `ColorTag` into Shopify as well.
- **Postgres role**:
  - As with leather:
    - Short term: keep current tables; add Shopify GID fields for each thread metaobject.
    - Long term: treat Shopify metaobjects as truth, with Postgres as an index/cache or removed entirely if not needed.

### 3.3 Fonts

- **Current state**:
  - `Font` model in Postgres.
  - `ProductSetDataLPC.fontId` (legacy) and `fontShopifyId` (Shopify metaobject GID).
- **Proposed state**:
  - Standardize on a Shopify `font` (or `custom.font`) metaobject.
  - Only store the Shopify metaobject GID in `ProductSetDataLPC.fontShopifyId`.
  - Optionally drop `Font` and `fontId` once all flows use metaobjects and themes read directly from Shopify.

### 3.4 Styles and collection-style overrides

- **Current Postgres models**:
  - `Style`:
    - Fields: `name`, `abbreviation`, `url_id`, `useOppositeLeather`, `leatherPhrase`, `namePattern`, `customNamePattern`.
  - `StyleCollection`:
    - Fields: override flags and templates per `(style, collection)` pair, including:
      - `skuPattern`, `titleTemplate`, `seoTemplate`, `handleTemplate`.
      - Validation JSON and name-pattern overrides.
- **Metaobject opportunity**:
  - `style` metaobject:
    - Could encapsulate the `Style` model’s configuration and naming behavior.
  - `collection_style_override` metaobject:
    - Could replace `StyleCollection` by encoding overrides per collection/style pair in Shopify (if we want theme-level awareness and external editing).
- **Postgres role**:
  - Likely to remain as a fast, strongly-typed cache / join table even after introducing metaobjects, given the tight coupling to variant generation logic.

### 3.5 Option sets and configuration rules

- **Conceptual model** (see `OptionSet` in data-models rule, implemented across multiple tables and loader logic):
  - Defines which options (leather, thread, styles, shapes) are available for each product/collection.
- **Metaobject opportunity**:
  - A higher-level `option_set` or `configuration_profile` metaobject per collection or product type that:
    - References collections and/or shapes.
    - Encodes which leathers, threads, and styles are allowed.
    - Stores booleans like `needsSecondaryLeather`, `needsStitchingColor`, etc., where appropriate.
  - This would move more of the configuration brain into Shopify and keep Postgres focused on caching, pricing, and variant materialization.

---

## 4. Suggested migration priorities

- **Priority 1: Collections and pricing (in progress)**
  - Fully wire `custom.*` collection metafields and pricing/metaobjects:
    - Ensure all collection config booleans and patterns are sourced from Shopify.
    - Treat `PriceTier` and `ShapeTypeAdjustment` as reflections of Shopify metaobjects.

- **Priority 2: Leather and fonts**
  - Standardize `ProductSetDataLPC` read paths to prefer Shopify metaobjects (`fontShopifyId`, `leatherColor*ShopifyId`).
  - Freeze creation/updating of `LeatherColor` and `Font` records in favor of Shopify.

- **Priority 3: Thread colors**
  - Introduce `embroidery_thread` and `stitching_thread` metaobjects.
  - Add Shopify GID fields to relevant models, then phase out direct dependence on `EmbroideryThread` / `StitchingThread` rows.

- **Priority 4: Styles and option sets**
  - Evaluate how much style logic and collection-specific overrides we want to surface in Shopify.
  - If we introduce `style` / `collection_style_override` / `option_set` metaobjects, keep Postgres primarily as a denormalized, query-friendly projection of those objects.


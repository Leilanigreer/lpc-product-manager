# `needsStitchingColor` — usage map

This document describes how **`needsStitchingColor`** and the related **`overrideStitchingColor`** field are wired through the app.

**Repository snapshot:** mapped against commit **`a5fd81b`** (*Use Shopify leather_color metaobjects for leather colors*). If you move to a newer branch, re-run search for `needsStitchingColor` and `overrideStitchingColor`; resolution logic may have changed (e.g. `threadType`-based rules).

---

## 1. Three related concepts (do not confuse)

| Concept | Where it lives | Meaning |
|--------|----------------|---------|
| **`ShopifyCollection.needsStitchingColor`** | Prisma / Postgres `ShopifyCollections` | Per-collection default: “this collection’s products should collect stitching thread color when true.” |
| **`StyleCollection.overrideStitchingColor`** | Prisma / Postgres `StyleCollection` | Optional per `(style, collection)` override. `null` = inherit from collection. |
| **`formState.finalRequirements.needsStitchingColor`** | Computed in memory | Resolved flag used in **`finalRequirements`** (with templates). Set from collection + global style via `resolveRequirements`. |

There is **no** separate `needsStitchingColor` field on the **`Style`** model at this commit; it was **removed** from `Style` and moved to **`ShopifyCollection`** in migration `20241231174954_modify_collection_style_logic`.

---

## 2. How `finalRequirements.needsStitchingColor` is computed

**File:** `app/lib/utils/requirementsUtils.js`

```text
needsStitchingColor =
  selectedStyle?.overrideStitchingColor ?? collection.needsStitchingColor ?? false
```

- **`selectedStyle`** is only used when **`formState.styleMode === 'global'`** and **`formState.globalStyle`** is set (`getEffectiveRequirements`).
- Otherwise **`selectedStyle`** is **`null`**, so the value comes from **`collection.needsStitchingColor`** only.

**Related:** `calculateFinalRequirements` merges these booleans with title/SKU templates and other fields into `formState.finalRequirements`.

---

## 3. Data loading: where the flags enter the UI 

**File:** `app/lib/utils/dataFetchers.js`

| Location | What happens |
|----------|----------------|
| **`getShopifyCollections`** | Reads `needsStitchingColor` from each `ShopifyCollection` row and maps it onto the **collection** object passed to the client (`mapShopifyCollectionRowToFormShape`). Each embedded **style** includes **`overrideStitchingColor`** from `StyleCollection`. |
| **`getStyles`** (optional / legacy) | For each style’s linked collections, exposes a derived **`needsStitchingColor`**: `sc.overrideStitchingColor ?? sc.collection.needsStitchingColor`. |

The Create Product flow primarily uses **`getShopifyCollections`** via the shared loader.

---

## 4. Form state and recomputation

**Files:** `app/lib/forms/formState.js`, `app/hooks/useFormState.js`

- Initial **`finalRequirements.needsStitchingColor`** defaults to **`false`** in `initialFormState`.
- When the user selects a collection (and when style mode / global style changes), **`calculateFinalRequirements`** runs and refreshes **`finalRequirements`**, including **`needsStitchingColor`**.

---

## 5. Validation (does not branch on the value)

**Files:**

- `app/lib/utils/validations/collectionValidations.js` — requires **`collection.needsStitchingColor`** to be a **boolean** (shape check for loaded collection objects).
- `app/lib/utils/validations/requirementValidations.js` — requires **`finalRequirements.needsStitchingColor`** to be a **boolean** (part of “final requirements object is well-formed”).

Neither file uses **`needsStitchingColor === true`** to skip or require other validations.

**Thread validation** (`app/lib/utils/validations/threadValidations.js`) does **not** reference **`needsStitchingColor`**. It validates **`stitchingThreads`** / embroidery based on structure and **`threadMode`**, not this flag.

---

## 6. UI: what actually drives thread pickers

**File:** `app/components/ThreadColorSelector.jsx`

- Uses **`formState.collection.threadType`** (e.g. **`STITCHING`** for single Amann selection) and **`needsStyle`** for the “independent embroidery per shape” option.
- Does **not** read **`needsStitchingColor`** or **`finalRequirements.needsStitchingColor`**.

**Comparison:** `app/components/LeatherColorSelector.jsx` **does** use **`formState.finalRequirements.needsSecondaryLeather`** to drive UI. There is **no** parallel use of **`finalRequirements.needsStitchingColor`** for showing or hiding thread sections.

So: **`needsStitchingColor` is resolved and stored on `finalRequirements`, but the thread color UI at this commit is driven mainly by `threadType` / style flags, not by this boolean.**

---

## 7. Generators and downstream

**Files:** `app/lib/generators/*`, `app/lib/utils/versionUtils.js`

- Generators consume **`finalRequirements`** for templates (e.g. title, SKU pattern).
- A repo-wide search at this commit shows **no** direct reads of **`finalRequirements.needsStitchingColor`** in generator code for branching logic (unlike templates that use **`titleTemplate`**, **`skuPattern`**, etc.).

If you need “stitching required” semantics in generated copy, confirm whether they are implied by **SKU/title placeholders** and **`threadType`** rather than by this boolean.

---

## 8. Database history (short)

| Migration | Change |
|-----------|--------|
| `20241231085224_style_mapping_to_visual_layer` | Introduced **`needsStitchingColor`** on **`Style`**. |
| `20241231174954_modify_collection_style_logic` | Dropped **`Style.needsStitchingColor`**; added **`ShopifyCollection.needsStitchingColor`** and **`StyleCollection.overrideStitchingColor`**. |

So the **current** model is **collection default + per-collection-style override**, not a flag on **`Style`** alone.

---

## 9. Is it “old code”?

**Partially.**

| Aspect | Verdict |
|--------|--------|
| **Prisma columns + loaders** | **Active** — data is loaded and used in **`resolveRequirements`**. |
| **`finalRequirements.needsStitchingColor`** | **Active** — computed and validated as part of **`finalRequirements`**. |
| **Thread UI + thread validators** | **Do not use this flag** — they rely on **`threadType`** and thread state; behavior can **diverge** from the boolean (e.g. collection **`threadType`** vs **`needsStitchingColor`**). |
| **Parity with `needsSecondaryLeather`** | **No** — secondary leather uses **`finalRequirements`** for UI; stitching color does **not** at this commit. |

**Conclusion:** The field is **not** dead schema—it **feeds resolved requirements**—but it is **underused in the product-creation UI** compared to other signals. Treat **`threadType`** and actual **`stitchingThreads`** as the source of truth for “what the user must pick,” and use **`needsStitchingColor`** for **business rules / templates / documentation** unless you wire it into the thread selectors explicitly.

---

## 10. File index (grep-friendly)

| Path | Role |
|------|------|
| `prisma/schema.prisma` | `ShopifyCollection.needsStitchingColor`, `StyleCollection.overrideStitchingColor` |
| `prisma/migrations/20241231085224_*.sql`, `20241231174954_*.sql` | Historical column moves |
| `app/lib/utils/requirementsUtils.js` | Resolution for **`finalRequirements.needsStitchingColor`** |
| `app/lib/utils/dataFetchers.js` | Collection + style mapping; optional **`getStyles`** aggregation |
| `app/lib/forms/formState.js` | Default **`finalRequirements.needsStitchingColor`** |
| `app/hooks/useFormState.js` | Recalculates **`finalRequirements`** on relevant updates |
| `app/lib/utils/validations/collectionValidations.js` | Boolean presence on **collection** |
| `app/lib/utils/validations/requirementValidations.js` | Boolean presence on **`finalRequirements`** |
| `docs/form-state.md` | Documents defaults (may drift; prefer this file + code) |

---

*Last updated for commit `a5fd81b`.*

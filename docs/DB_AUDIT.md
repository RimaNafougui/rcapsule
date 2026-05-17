# Database Architecture Audit — rcapsule

**Prepared by**: Senior Software Architect  
**Date**: 2026-05-14  
**Schema tables**: 22  
**API routes audited**: 30+

---

## SECTION 1 — Executive Summary

### Biggest Architectural Problems

1. **Dual wear-tracking creates two sources of truth.** `Clothes.timesworn`/`lastwornat` are denormalized counters that must stay in sync with `WearLog`, but nothing enforces this. `ClothesAnalytics` adds a third layer. The app queries all three places for wear data.

2. **`Activity` table is completely dead.** Zero API routes query or insert into it. It occupies schema space, was presumably seeded with a CHECK constraint for 7 event types, and has never been connected to any product feature.

3. **Polymorphic `targetType/targetId` used across 5 tables with no FK enforcement.** `Like`, `Save`, `Comment`, `Report`, `Notification`, and `FeaturedContent` all use this pattern. It is impossible to do a join, impossible to enforce referential integrity, and guaranteed to produce orphan rows when content is deleted.

4. **Denormalized social counters on every content table.** `Outfit.likeCount`, `Outfit.saveCount`, `Outfit.shareCount`, `Outfit.viewCount`, `Wardrobe.likeCount`, `Wardrobe.saveCount`, `Wardrobe.shareCount`, `Wardrobe.viewCount`, `User.followerCount`, `User.followingCount`, `Comment.likeCount` — 11 integer counters that must be manually kept in sync. None have triggers. All will drift.

5. **`styleTags` stored as `text[]` ARRAY in 3 places.** `User.styleTags`, `Outfit.styleTags`, and `Wardrobe.styleTags` are all raw text arrays disconnected from the `StyleTag` table, which has `name`, `slug`, `category`, and `usageCount`. The `usageCount` on `StyleTag` will never be accurate.

6. **Naming case inconsistency throughout.** `Clothes` uses `timesworn`/`lastwornat` (snake_case lowercase), while `Outfit` uses `timesWorn`/`lastWornAt` (camelCase), `ClothesAnalytics` uses `lastWornAt` (camelCase), and `OutfitRecommendations` uses `userid`/`createdat` (lowercase). This is not stylistic preference — it causes actual bugs at the ORM/query layer.

7. **`OutfitRecommendations.items` is a JSONB blob** containing what should be foreign keys to `Clothes`. There is no way to know which clothes are referenced, no cascade behaviour, and no way to query "which recommendations include item X."

8. **`WearLog` is item-level, not outfit-level.** A WearLog entry has a `clothesId` (required) but `outfitId` is optional. If a user wore an outfit of 5 items, you get 5 WearLog rows. There is no way to reconstruct "this outfit was worn on this date as a unit" without all 5 clothesId entries matching the same outfitId in the same time window.

### Biggest Optimization Opportunities

1. Replace all polymorphic junction tables with typed junction tables.
2. Drop `ClothesAnalytics` entirely; compute analytics from `WearLog`.
3. Drop `Activity` entirely; it is dead weight.
4. Replace `styleTags text[]` with proper junction tables to `StyleTag`.
5. Add UNIQUE constraints on `Follow(followerId, followingId)`, `Like(userId, targetType, targetId)`, and `Block(blockerId, blockedId)` — currently a user can follow the same person twice.
6. Move all social counters to computed/cached values rather than stored integers.

### Technical Debt Severity: **HIGH**

### Scalability Concerns

- At 10k users, counter drift on `likeCount`/`followerCount` becomes user-visible (race conditions under concurrent requests).
- At 100k users, `WearLog` full table scans for analytics become slow. There are no indexes on `wornAt` or `userId+clothesId`.
- `Outfit.viewCount` incremented on every page view will serialize writes at scale.

---

## SECTION 2 — Table-by-Table Audit

---

### `User`

**Purpose**: Core identity, subscription state, public profile.  
**Used by**: Every authenticated route. Session carries `id` and `role`.

| Column                                               | Status           | Notes                                                                                              |
| ---------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `id`                                                 | Essential        | UUID sourced from `auth.users`. Correct.                                                           |
| `name`                                               | Essential        | Display name.                                                                                      |
| `email`                                              | Essential        | Unique.                                                                                            |
| `image`                                              | Essential        | Avatar.                                                                                            |
| `username`                                           | Essential        | Public profile slug. Should have an index.                                                         |
| `role`                                               | Essential        | `user`/`admin` CHECK constraint. Fine for 2 roles.                                                 |
| `subscription_status`                                | Essential        | Should be an ENUM type.                                                                            |
| `stripe_customer_id`                                 | Essential        | Billing identity.                                                                                  |
| `stripe_subscription_id`                             | Essential        | Billing state.                                                                                     |
| `subscription_period_end`                            | Essential        | For feature gating.                                                                                |
| `bio`, `location`, `website`                         | Essential        | Profile fields.                                                                                    |
| `instagramHandle`, `tiktokHandle`, `pinterestHandle` | Marginal         | Low-value. Probably rarely filled. Fine to keep but unlikely to drive product decisions.           |
| `styleTags text[]`                                   | **Redundant**    | Disconnected from `StyleTag` table. Should be a junction table `UserStyleTag(userId, styleTagId)`. |
| `coverImage`                                         | Marginal         | Rarely used in most wardrobe apps.                                                                 |
| `isVerified`                                         | Marginal         | No verification flow exists in the codebase. Premature.                                            |
| `isFeatured`                                         | **Denormalized** | `FeaturedContent` already handles featuring. This duplicates it.                                   |
| `profileViews`                                       | **Dangerous**    | Integer counter with no increment mechanism. Will be stale immediately.                            |
| `followerCount`                                      | **Dangerous**    | Must match `COUNT(*) FROM Follow WHERE followingId = id`. No trigger. Will drift.                  |
| `followingCount`                                     | **Dangerous**    | Same problem.                                                                                      |
| `showClosetValue`, `showItemPrices`, `allowMessages` | Privacy prefs    | These belong in `UserPreferences`, not `User`. Bloating the core identity record.                  |
| `lastActiveAt`                                       | Marginal         | Not written anywhere in the API. Likely dead.                                                      |
| `profilePublic`                                      | Essential        | Gating for public profile routes.                                                                  |

**Recommendations**:

- Move `showClosetValue`, `showItemPrices`, `allowMessages` into `UserPreferences`.
- Replace `styleTags text[]` with a junction table.
- Drop `profileViews`, `followerCount`, `followingCount` as stored columns. Compute or cache them.
- Drop `isFeatured` (redundant with `FeaturedContent`).
- `isVerified` should not exist until there is a verification flow.

---

### `Account`

**Purpose**: NextAuth OAuth account linkage (provider tokens).  
**Used by**: `auth.ts` NextAuth callbacks only. Never queried by product code.

| Column                                      | Status    | Notes                                        |
| ------------------------------------------- | --------- | -------------------------------------------- |
| `refresh_token`, `access_token`, `id_token` | Essential | OAuth tokens — sensitive.                    |
| `expires_at`                                | Essential | Token expiry.                                |
| `session_state`                             | Marginal  | Used by some OAuth providers, null for most. |
| `token_type`, `scope`                       | Marginal  | Rarely queried by product code.              |

**No issues.** Standard NextAuth schema. Do not touch.

---

### `UserPreferences`

**Purpose**: Per-user configuration for AI recommendations, notifications, privacy.  
**Used by**: `/api/recommendations` (weather/AI context), `/api/settings/*`

| Column                                                              | Status       | Notes                                                 |
| ------------------------------------------------------------------- | ------------ | ----------------------------------------------------- |
| `userId`                                                            | Essential    | 1:1 with User.                                        |
| `budgetGoal`                                                        | Essential    | Used by AI service.                                   |
| `sustainabilityGoals jsonb`                                         | Questionable | JSON blob for unstructured goals. Fine at this scale. |
| `styleGoals text[]`                                                 | Redundant    | Also stored as `User.styleTags`. Pick one place.      |
| `notifications jsonb`                                               | Essential    | Notification preferences. JSONB is fine here.         |
| `analyticsPrivacy`                                                  | Marginal     | Not enforced anywhere in the API.                     |
| `location_city`, `location_country`, `location_lat`, `location_lon` | Essential    | Used for weather.                                     |
| `temperature_unit`                                                  | Essential    | Celsius/Fahrenheit preference.                        |

**Note**: `User.location` is a free-text string. `UserPreferences` has structured location fields. These serve different purposes (display vs. weather) but look duplicated to any new developer.

**Recommendations**:

- Move `showClosetValue`, `showItemPrices`, `allowMessages` here from `User`.
- Clarify that `User.location` is display-only, `UserPreferences.location_*` is functional.
- `styleGoals` vs `User.styleTags` — consolidate to one place.

---

### `Clothes`

**Purpose**: A single clothing item owned by or wishlisted by a user.  
**Used by**: Closet, Wishlist, Outfit builder, Studio, Analytics, AI Recommendations, Extension import.

This is the most important table in the product. It is also one of the most bloated.

| Column                                                        | Status                   | Notes                                                                                                                                                                                     |
| ------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `userId`, `name`, `category`                            | Essential                | Core identity.                                                                                                                                                                            |
| `brand`                                                       | Essential                |                                                                                                                                                                                           |
| `price`, `originalPrice`, `purchaseCurrency`                  | Essential                | Cost tracking.                                                                                                                                                                            |
| `imageUrl`                                                    | Essential                | Primary display image.                                                                                                                                                                    |
| `processed_image_url`                                         | **Questionable**         | Background-removed version. Only used in `ClothesAnalytics`. Consider making this a derived field or storing as a variant in the same `imageUrl` logic.                                   |
| `status`                                                      | Essential                | `owned`/`wishlist`. The correct way to handle this.                                                                                                                                       |
| `condition`                                                   | Essential                | `new`/`excellent`/`good`/`fair`/`poor`.                                                                                                                                                   |
| `size`                                                        | Essential                |                                                                                                                                                                                           |
| `colors text[]`                                               | Essential                | Multi-value, ARRAY is fine.                                                                                                                                                               |
| `season text[]`                                               | Essential                | Multi-value.                                                                                                                                                                              |
| `placesToWear text[]`                                         | Marginal                 | "Occasions" for this item. Overlaps with `Outfit.occasion`.                                                                                                                               |
| `materials`, `careInstructions`, `sustainability`             | Essential                | Product detail fields.                                                                                                                                                                    |
| `silhouette`, `style`, `neckline`, `pattern`, `length`, `fit` | **Over-normalized risk** | Six nullable style descriptor columns. Most items will have most of these null. These are fine as sparse nullable columns for now, but collectively they add a lot of cognitive overhead. |
| `tags text[]`                                                 | Marginal                 | Free-form user tags. `StyleTag` table exists but these are disconnected.                                                                                                                  |
| `link`                                                        | Essential                | External product URL.                                                                                                                                                                     |
| `purchaseDate`, `purchaseLocation`, `purchaseType`            | Essential                | Purchase provenance.                                                                                                                                                                      |
| `retiredAt`, `retirementReason`                               | **Dead**                 | Nothing in the API writes or reads these. No retirement flow exists.                                                                                                                      |
| `timesworn`                                                   | **Dangerous/Redundant**  | Denormalized counter. The actual source of truth is `WearLog`. Counter will drift.                                                                                                        |
| `lastwornat`                                                  | **Dangerous/Redundant**  | Same problem. Note: lowercase naming inconsistency vs `Outfit.lastWornAt`.                                                                                                                |
| `description`                                                 | Essential                |                                                                                                                                                                                           |
| `globalproductid`                                             | **Aspirational**         | FK to `GlobalProduct`. Almost never set. Extension import links them, but the catalogue feature is embryonic.                                                                             |

**Recommendations**:

- **Drop `retiredAt` and `retirementReason`** — completely unused. Add back when you build the feature.
- **Drop `timesworn` and `lastwornat`** — derive them from `WearLog` queries. Cache the result in Redis if performance matters.
- `processed_image_url` — consider moving to a separate `ClothesImages(clothesId, type, url)` table or just making it a field on `Clothes` with clear naming (`bgRemovedImageUrl`).
- Add indexes: `(userId, status)`, `(userId, category)`, `(globalproductid)`.

---

### `WearLog`

**Purpose**: Immutable event log of when a clothing item was worn.  
**Used by**: `/api/wear-log`, `/api/calendar`, `/api/analytics`

| Column                                                    | Status                 | Notes                                                                                                                                         |
| --------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `userId`, `clothesId`                               | Essential              |                                                                                                                                               |
| `outfitId`                                                | Essential but nullable | Optional — not every wear is tracked to an outfit.                                                                                            |
| `wornAt`                                                  | Essential              | The timestamp of wear. **Missing index.**                                                                                                     |
| `occasion`, `weather`, `temperature`, `location`, `notes` | Marginal               | Context fields. Rarely queried. Useful for AI.                                                                                                |
| `createdAt`                                               | **Redundant**          | `wornAt` already captures when the wear happened. `createdAt` is when the row was inserted, which is almost always the same day. Dead weight. |

**Critical issue**: `WearLog` is per clothing item. If an outfit has 5 items and the user logs wearing that outfit, 5 rows are inserted with the same `outfitId`. This makes "how many times was this outfit worn" an aggregation query rather than a direct read. That's why `Outfit.timesWorn` exists as a denormalized counter — but now you have two sources of truth again.

**Recommendation**:

- Add an `OutfitWearLog` concept: log at the outfit level, with `WearLog` being the item-level detail. Or keep WearLog per-item but accept `Outfit.timesWorn` as the canonical count and update it transactionally when a wear is logged.
- Add indexes: `(userId, wornAt DESC)`, `(clothesId, wornAt DESC)`, `(outfitId)`.
- Drop `createdAt` — it duplicates `wornAt`.

---

### `ClothesAnalytics`

**Purpose**: Precomputed analytics per clothing item.  
**Used by**: Only `/api/calendar/route.ts`. One query.

| Column                                             | Status          | Notes                                                                                                     |
| -------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| `clothesId`                                        | Essential       | PK and FK.                                                                                                |
| `userId`                                           | **Redundant**   | `clothesId` → `Clothes.userId` already provides this. Storing it here is denormalization without benefit. |
| `totalWears`                                       | **Redundant**   | `COUNT(*) FROM WearLog WHERE clothesId = ?`                                                               |
| `lastWornAt`, `firstWornAt`                        | **Redundant**   | `MAX/MIN(wornAt) FROM WearLog WHERE clothesId = ?`                                                        |
| `costPerWear`                                      | **Computed**    | `price / totalWears`. Should never be stored.                                                             |
| `averageDaysBetweenWears`                          | **Computed**    | Derived from WearLog.                                                                                     |
| `wearFrequencyScore`, `versatilityScore`           | **Speculative** | Written nowhere in the codebase. Never populated.                                                         |
| `seasonalWearDistribution`, `occasionDistribution` | **Speculative** | JSONB blobs. Never populated.                                                                             |
| `lastCalculatedAt`                                 | **Dead**        | Nothing recalculates this table.                                                                          |

**Verdict**: This table was designed speculatively and is almost entirely dead. The only real use is in the calendar route, which reads `totalWears` and `lastWornAt` — both of which can be computed from `WearLog` directly with two simple queries.

**Recommendation**: **Drop `ClothesAnalytics` entirely.** Compute analytics from `WearLog` + `Clothes`. Cache with Redis if needed. The table was never wired up and never will be at the current trajectory.

---

### `Outfit`

**Purpose**: A saved outfit (combination of clothes items) belonging to a user.  
**Used by**: Outfits page, Outfit detail, Studio, OutfitClothes junction, public outfit page.

| Column                                              | Status                  | Notes                                                                                                                              |
| --------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `userId`, `name`                              | Essential               |                                                                                                                                    |
| `description`, `season`, `occasion`                 | Essential               | Metadata.                                                                                                                          |
| `imageUrl`                                          | Essential               | Collage or cover image from Studio.                                                                                                |
| `isFavorite`                                        | Essential               | User-level bookmark.                                                                                                               |
| `timesWorn`, `lastWornAt`                           | **Dangerous/Redundant** | Same problem as `Clothes`. Source of truth is `WearLog`.                                                                           |
| `weatherWorn`, `temperatureWorn`, `locationWorn`    | **Denormalized**        | This is the last wear's context. If worn 5 times, only the last context is stored. These fields belong in `WearLog`, not `Outfit`. |
| `rating`                                            | Marginal                | 1-5 self-rating. Never exposed in the UI from what I can see.                                                                      |
| `colorPalette text[]`                               | Marginal                | Derived from constituent `Clothes.colors`. Premature optimization.                                                                 |
| `isPublic`                                          | Essential               | Gating for community features.                                                                                                     |
| `slug`                                              | Essential               | Used for public URLs.                                                                                                              |
| `viewCount`, `likeCount`, `saveCount`, `shareCount` | **Dangerous**           | Denormalized counters. `viewCount` is especially dangerous — incrementing on every page view will serialize writes.                |
| `isFeatured`, `featuredAt`                          | **Redundant**           | `FeaturedContent` already handles this.                                                                                            |
| `styleTags text[]`                                  | **Redundant**           | Should be a junction to `StyleTag`.                                                                                                |
| `allowComments`                                     | Essential               | Per-outfit comment gating.                                                                                                         |

**Recommendations**:

- Drop `weatherWorn`, `temperatureWorn`, `locationWorn` — move to `WearLog`.
- Drop `timesWorn`, `lastWornAt` — derive from `WearLog`.
- Drop `isFeatured`, `featuredAt` — use `FeaturedContent`.
- Drop `colorPalette` — compute from constituent items.
- Drop `viewCount` as a stored column. Track views in a separate events table or use an analytics service.
- Replace `styleTags text[]` with junction table.
- Add indexes: `(userId)`, `(slug)`, `(isPublic, createdAt DESC)`.

---

### `OutfitClothes`

**Purpose**: Many-to-many junction between `Outfit` and `Clothes`.  
**Used by**: Outfit creation, outfit detail, studio.

| Column                  | Status          | Notes                                                                          |
| ----------------------- | --------------- | ------------------------------------------------------------------------------ |
| `id`                    | **Unnecessary** | Surrogate PK on a junction table. Use `(outfitId, clothesId)` as composite PK. |
| `outfitId`, `clothesId` | Essential       |                                                                                |
| `layer`                 | Marginal        | Intended for layering order. Never appears to be used in queries.              |
| `createdAt`             | Marginal        | Rarely useful on a junction table.                                             |

**Missing**: UNIQUE constraint on `(outfitId, clothesId)`. A clothes item can currently be added to the same outfit twice.

**Recommendations**:

- Replace surrogate PK with composite `PRIMARY KEY (outfitId, clothesId)`.
- Add a `UNIQUE(outfitId, clothesId)` constraint if keeping surrogate PK.
- Drop `layer` if not used.

---

### `Wardrobe` (branded as "Collections" in UI)

**Purpose**: A curated grouping of clothes items created by a user. Public-shareable.  
**Used by**: Collections page, public collection pages, WardrobeClothes junction.

The table is named `Wardrobe` but the entire UI and API calls it "Collections". This is a naming debt that will confuse every new engineer.

| Column                                              | Status        | Notes                                                     |
| --------------------------------------------------- | ------------- | --------------------------------------------------------- |
| `id`, `userId`, `title`                             | Essential     |                                                           |
| `description`, `isPublic`, `coverImage`, `slug`     | Essential     |                                                           |
| `viewCount`, `likeCount`, `saveCount`, `shareCount` | **Dangerous** | Same counter drift problem as `Outfit`.                   |
| `isFeatured`, `featuredAt`                          | **Redundant** | Duplicates `FeaturedContent`.                             |
| `styleTags text[]`                                  | **Redundant** | Disconnected from `StyleTag` table.                       |
| `season`, `occasion`                                | Marginal      | Metadata fields. Probably useful for discovery filtering. |
| `allowComments`                                     | Essential     |                                                           |

**Recommendations**:

- **Rename table to `Collection`** to match the product.
- Drop `isFeatured`, `featuredAt`.
- Drop counter columns or enforce via triggers.
- Replace `styleTags` with junction table.

---

### `WardrobeClothes`

**Purpose**: Junction between `Wardrobe`/Collection and `Clothes`.  
**Used by**: Collections detail, `/api/collections/[id]/clothes`

| Column                    | Status          | Notes                                                 |
| ------------------------- | --------------- | ----------------------------------------------------- |
| `id`                      | **Unnecessary** | Surrogate PK on junction. Use composite.              |
| `wardrobeId`, `clothesId` | Essential       |                                                       |
| `addedAt`                 | Useful          | Ordering items by when they were added is reasonable. |
| `notes`                   | Marginal        | Probably never set.                                   |

**Missing**: UNIQUE constraint on `(wardrobeId, clothesId)`.

---

### `WardrobeOutfit`

**Purpose**: Junction between `Wardrobe`/Collection and `Outfit`.  
**Used by**: Appears in migrations/schema but not in any active API route.

This table exists but is not queried anywhere in the current product. Collections currently only contain clothes, not outfits.

**Verdict**: Likely dead. Either the feature was planned and abandoned, or it was built but never wired to the frontend. Confirm and drop if unused.

---

### `OutfitRecommendations`

**Purpose**: Stores AI-generated outfit suggestions for a user.  
**Used by**: `/api/recommendations`

| Column                                             | Status           | Notes                                                                                                                                                      |
| -------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `userid`                                     | Essential        | Note lowercase `userid` — naming inconsistency.                                                                                                            |
| `items jsonb`                                      | **Anti-pattern** | Should be a junction table `RecommendationItems(recommendationId, clothesId)` so you can query "which recommendations include item X" and handle cascades. |
| `reasoning`, `stylenotes`, `weatherconsiderations` | Essential        | AI-generated explanation text. JSONB would be fine here too.                                                                                               |
| `occasion`                                         | Essential        | Context for the recommendation.                                                                                                                            |
| `weatherdata jsonb`                                | Essential        | Snapshot of weather at time of recommendation. JSONB is appropriate here (point-in-time snapshot).                                                         |
| `status`                                           | Essential        | `suggested`/`worn`/`dismissed`/`saved`.                                                                                                                    |
| `expiresat`                                        | Essential        | TTL for stale recommendations.                                                                                                                             |
| `createdat`                                        | Essential        | Note lowercase — naming inconsistency.                                                                                                                     |

**Recommendations**:

- Replace `items jsonb` with `RecommendationItem(recommendationId, clothesId, position)`.
- Fix naming: `userid` → `userId`, `createdat` → `createdAt`, `expiresat` → `expiresAt`.
- Add index on `(userid, status, createdat DESC)`.

---

### `Activity`

**Purpose**: Event log of user actions (created outfit, liked wardrobe, followed user, etc.).  
**Used by**: **Nothing.** Zero API routes query or insert into this table.

The CHECK constraint defines 7 event types. The table has a `metadata jsonb` field and an `isPublic` flag suggesting it was intended to power a social activity feed.

**Verdict**: **Dead table. Drop it.** If you build an activity feed in the future, create it then with the correct design for the features you actually need. Dead tables impose ongoing cognitive overhead on every new developer who reads the schema.

---

### `Follow`

**Purpose**: User-to-user follow relationships.  
**Used by**: `/api/users/[username]/follow`, follow count queries.

| Column                      | Status          | Notes                                                              |
| --------------------------- | --------------- | ------------------------------------------------------------------ |
| `id`                        | **Unnecessary** | Surrogate PK on a junction. Use `(followerId, followingId)` as PK. |
| `followerId`, `followingId` | Essential       |                                                                    |
| `createdAt`                 | Useful          | "Following since" display.                                         |

**Critical missing**: No UNIQUE constraint on `(followerId, followingId)`. A user can follow the same person multiple times. Each duplicate inflates `followerCount`.

---

### `Block`

**Purpose**: User-to-user block relationships for content moderation.  
**Used by**: Follow and profile routes to gate blocked users.

| Column                   | Status          | Notes                                             |
| ------------------------ | --------------- | ------------------------------------------------- |
| `id`                     | **Unnecessary** | Surrogate PK. Use `(blockerId, blockedId)` as PK. |
| `blockerId`, `blockedId` | Essential       |                                                   |
| `createdAt`              | Marginal        |                                                   |

**Missing**: UNIQUE constraint on `(blockerId, blockedId)`.

---

### `Like`

**Purpose**: A user liking an outfit, wardrobe/collection, or clothes item.  
**Used by**: `/api/likes`, like state in public pages.

| Column       | Status           | Notes                                                                                           |
| ------------ | ---------------- | ----------------------------------------------------------------------------------------------- |
| `id`         | **Unnecessary**  | Surrogate PK.                                                                                   |
| `userId`     | Essential        |                                                                                                 |
| `targetType` | **Anti-pattern** | `'wardrobe'`, `'outfit'`, `'clothes'` — no FK, no referential integrity. Orphan rows on delete. |
| `targetId`   | **Anti-pattern** | Same.                                                                                           |
| `createdAt`  | Useful           |                                                                                                 |

**Missing**: UNIQUE constraint on `(userId, targetType, targetId)`. A user can like something multiple times.

**Recommendation**: Replace with typed junction tables: `OutfitLike(userId, outfitId)`, `CollectionLike(userId, wardrobeId)`. The polymorphic pattern is only worth it if you have 10+ entity types. You have 3.

---

### `Save`

**Purpose**: A user saving content to a named collection for inspiration.  
**Used by**: `/api/saves`, public outfit/collection pages.

| Column           | Status           | Notes                                                                                                                                                                                     |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | Essential (here) |                                                                                                                                                                                           |
| `userId`         | Essential        |                                                                                                                                                                                           |
| `targetType`     | **Anti-pattern** | Same polymorphic problem as `Like`.                                                                                                                                                       |
| `targetId`       | **Anti-pattern** | Same.                                                                                                                                                                                     |
| `collectionName` | **Anti-pattern** | Free text for a "collection" name. This should be a FK to `Wardrobe`/`Collection` if you want saves to live inside named collections. Right now it's a loose string that can be anything. |
| `notes`          | Marginal         | Rarely set.                                                                                                                                                                               |
| `createdAt`      | Essential        |                                                                                                                                                                                           |

---

### `Comment`

**Purpose**: Comments on outfits and wardrobes/collections, with threading.  
**Used by**: `/api/comments`, public pages.

| Column                    | Status           | Notes                                                                                                                                                |
| ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `userId`, `content` | Essential        |                                                                                                                                                      |
| `targetType`              | **Anti-pattern** | Polymorphic — `'wardrobe'` or `'outfit'`. Same FK enforcement problem.                                                                               |
| `targetId`                | **Anti-pattern** | Same.                                                                                                                                                |
| `parentId`                | Essential        | Self-referencing FK for threading. Correct approach.                                                                                                 |
| `likeCount`               | **Dangerous**    | Denormalized counter. Will drift. `Like` table doesn't reference comments — there's actually no way to like a comment despite this counter existing. |
| `isEdited`                | Essential        | Transparency flag.                                                                                                                                   |
| `isHidden`                | Essential        | Moderation soft-delete.                                                                                                                              |

**Verdict**: `likeCount` is particularly problematic — `Like.targetType` has no `'comment'` value in its CHECK constraint. So comment likes cannot be stored in `Like`, yet `Comment.likeCount` exists. This counter will always be 0 or manually set. It's dead.

---

### `Notification`

**Purpose**: In-app notifications for social events.  
**Used by**: `/api/notifications`

| Column                   | Status           | Notes                                                                       |
| ------------------------ | ---------------- | --------------------------------------------------------------------------- |
| `id`, `userId`           | Essential        |                                                                             |
| `type`                   | Essential        | 8-value CHECK.                                                              |
| `actorId`                | Essential        | Who triggered the notification.                                             |
| `targetType`, `targetId` | **Anti-pattern** | Polymorphic again.                                                          |
| `message`                | Marginal         | Pre-rendered string. Can be constructed from `type`+`actorId` at read time. |
| `isRead`                 | Essential        |                                                                             |
| `createdAt`              | Essential        |                                                                             |

**Missing index**: `(userId, isRead, createdAt DESC)` — this is the exact query pattern the notification bell uses.

---

### `Report`

**Purpose**: User reports of content for moderation.  
**Used by**: `/api/admin/reports`

| Column       | Status           | Notes                                                                |
| ------------ | ---------------- | -------------------------------------------------------------------- |
| All columns  | Essential        | Standard moderation table. Well-designed.                            |
| `targetType` | **Anti-pattern** | Polymorphic. `'wardrobe'` not `'collection'` — naming inconsistency. |
| `reviewedBy` | Essential        | Admin who handled it.                                                |

---

### `FeaturedContent`

**Purpose**: Admin-curated featured content for the discovery page.  
**Used by**: Admin panel only (from grep results, no product-facing API uses it).

| Column               | Status       | Notes                                           |
| -------------------- | ------------ | ----------------------------------------------- |
| All columns          | Marginal     | The feature barely exists in the product.       |
| `contentType`        | Anti-pattern | Polymorphic again.                              |
| `section`            | Essential    | `hero`/`trending`/`staff_picks`/`new_arrivals`. |
| `startsAt`, `endsAt` | Useful       | Scheduled featuring.                            |
| `position`           | Useful       | Manual ordering.                                |

**Note**: `Outfit.isFeatured` and `Wardrobe.isFeatured` duplicate this table's purpose. Pick one mechanism.

---

### `StyleTag`

**Purpose**: Taxonomy of style descriptors shared across users, outfits, and collections.  
**Used by**: `/api/style-tags`, onboarding, user suggested matching.

| Column               | Status        | Notes                                                                                                                                                                          |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`, `name`, `slug` | Essential     |                                                                                                                                                                                |
| `category`           | Essential     | Groups tags into style/occasion/season/aesthetic/trend.                                                                                                                        |
| `usageCount`         | **Dangerous** | Denormalized counter. `User.styleTags`, `Outfit.styleTags`, `Wardrobe.styleTags` are all `text[]` ARRAYs disconnected from this table — so `usageCount` can never be accurate. |
| `isFeatured`         | Marginal      | For discovery promotion.                                                                                                                                                       |

**Critical problem**: Three tables store tags as `text[]` containing tag names (not IDs). The `StyleTag` table exists as a reference catalogue but is never joined to content. `usageCount` is permanently wrong.

---

### `GlobalProduct`

**Purpose**: Shared product catalogue — canonical items that multiple users' clothes can reference.  
**Used by**: `/api/catalogue`, `/api/extension/import`, admin catalogue routes.

| Column                                       | Status    | Notes                |
| -------------------------------------------- | --------- | -------------------- |
| `id`, `name`, `brand`, `category`            | Essential |                      |
| `slug`, `sku`                                | Essential | Unique identifiers.  |
| `retaillink`                                 | Essential | External URL.        |
| `imageurl`, `processed_image_url`            | Essential |                      |
| `colors`, `materials`, `sustainability`      | Essential | Catalogue metadata.  |
| `originalprice`, `currency`                  | Essential |                      |
| `source`, `externalId`                       | Essential | Scraping provenance. |
| `sizes`                                      | Essential | Available sizes.     |
| `inStock`, `lastScrapedAt`, `scrapingStatus` | Essential | Scraping lifecycle.  |

**No serious issues.** This table is well-scoped. The naming inconsistency (`imageurl`/`createdat`/`updatedat` in lowercase vs PascalCase elsewhere) is the main problem.

---

### `ContactMessages`

**Purpose**: Contact form submissions.  
**Used by**: Marketing contact form only.

**No FK to `User`** — anonymous submissions are intentional. Fine as-is. Keep it simple.

---

## SECTION 3 — Unused or Suspicious Schema

### Dead Tables

| Table              | Evidence                                                     | Action                         |
| ------------------ | ------------------------------------------------------------ | ------------------------------ |
| `Activity`         | Zero queries in entire codebase                              | **Drop**                       |
| `WardrobeOutfit`   | No active API route reads or writes it                       | **Confirm and drop**           |
| `ClothesAnalytics` | Only used in one calendar route; columns are never populated | **Drop; compute from WearLog** |

### Dead Columns

| Table              | Column                                                                                       | Reason                                               |
| ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `Clothes`          | `retiredAt`, `retirementReason`                                                              | No retirement flow exists anywhere                   |
| `Clothes`          | `timesworn`, `lastwornat`                                                                    | Redundant with WearLog                               |
| `Outfit`           | `timesWorn`, `lastWornAt`                                                                    | Redundant with WearLog                               |
| `Outfit`           | `weatherWorn`, `temperatureWorn`, `locationWorn`                                             | Belongs in WearLog; only captures last wear          |
| `Outfit`           | `colorPalette`                                                                               | Derived; never populated                             |
| `Outfit`           | `isFeatured`, `featuredAt`                                                                   | FeaturedContent handles this                         |
| `Wardrobe`         | `isFeatured`, `featuredAt`                                                                   | FeaturedContent handles this                         |
| `User`             | `profileViews`, `followerCount`, `followingCount`                                            | Denormalized; never reliably updated                 |
| `User`             | `lastActiveAt`                                                                               | Never written anywhere                               |
| `User`             | `isVerified`                                                                                 | No verification flow                                 |
| `User`             | `isFeatured`                                                                                 | FeaturedContent handles this                         |
| `Comment`          | `likeCount`                                                                                  | `Like` table has no `'comment'` targetType; always 0 |
| `ClothesAnalytics` | `wearFrequencyScore`, `versatilityScore`, `seasonalWearDistribution`, `occasionDistribution` | Never populated                                      |
| `WearLog`          | `createdAt`                                                                                  | Duplicates `wornAt`                                  |

### Duplicated Concepts

| Concept               | Duplicated In                                                                         | Action                          |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------- |
| Wear count per item   | `Clothes.timesworn` + `WearLog` + `ClothesAnalytics.totalWears`                       | Keep only `WearLog`             |
| Wear count per outfit | `Outfit.timesWorn` + `WearLog`                                                        | Keep only `WearLog`             |
| Featured content      | `FeaturedContent` + `Outfit.isFeatured` + `Wardrobe.isFeatured` + `User.isFeatured`   | Keep only `FeaturedContent`     |
| Style tags            | `StyleTag` table + `User.styleTags[]` + `Outfit.styleTags[]` + `Wardrobe.styleTags[]` | Junction tables to `StyleTag`   |
| Location              | `User.location` (display text) + `UserPreferences.location_*` (structured)            | Document clearly or consolidate |

### Inconsistent Naming

| Issue                                     | Examples                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| camelCase vs lowercase                    | `Clothes.timesworn` vs `Outfit.timesWorn` vs `ClothesAnalytics.lastWornAt` |
| `GlobalProduct` lowercase columns         | `imageurl`, `createdat`, `updatedat`, `originalprice`                      |
| `OutfitRecommendations` lowercase columns | `userid`, `createdat`, `expiresat`, `stylenotes`                           |
| Table name vs product name                | `Wardrobe` → product calls it "Collections"                                |
| targetType values                         | `Report` uses `'wardrobe'` but UI calls it "collection"                    |

### Missing Unique Constraints (Data Integrity Holes)

```sql
-- Users can follow each other multiple times
ALTER TABLE "Follow" ADD CONSTRAINT follow_unique UNIQUE ("followerId", "followingId");

-- Users can block each other multiple times
ALTER TABLE "Block" ADD CONSTRAINT block_unique UNIQUE ("blockerId", "blockedId");

-- Users can like the same thing multiple times
ALTER TABLE "Like" ADD CONSTRAINT like_unique UNIQUE ("userId", "targetType", "targetId");

-- Same clothes item can appear twice in same outfit
ALTER TABLE "OutfitClothes" ADD CONSTRAINT outfit_clothes_unique UNIQUE ("outfitId", "clothesId");

-- Same clothes item can appear twice in same collection
ALTER TABLE "WardrobeClothes" ADD CONSTRAINT wardrobe_clothes_unique UNIQUE ("wardrobeId", "clothesId");
```

### Missing Indexes (Performance Holes)

```sql
-- Most common query pattern across entire app
CREATE INDEX idx_clothes_userid_status ON "Clothes"("userId", status);
CREATE INDEX idx_clothes_userid_category ON "Clothes"("userId", category);

-- WearLog analytics
CREATE INDEX idx_wearlog_userid_wornat ON "WearLog"("userId", "wornAt" DESC);
CREATE INDEX idx_wearlog_clothesid_wornat ON "WearLog"("clothesId", "wornAt" DESC);
CREATE INDEX idx_wearlog_outfitid ON "WearLog"("outfitId");

-- Notification bell query
CREATE INDEX idx_notification_userid_read ON "Notification"("userId", "isRead", "createdAt" DESC);

-- Outfit discovery feed
CREATE INDEX idx_outfit_public_created ON "Outfit"("isPublic", "createdAt" DESC) WHERE "isPublic" = true;

-- Username lookup (used on every profile page load)
CREATE INDEX idx_user_username ON "User"(username);

-- OutfitRecommendations
CREATE INDEX idx_recommendations_userid_status ON "OutfitRecommendations"("userid", status, "createdat" DESC);
```

---

## SECTION 4 — Optimization Plan

### Quick Wins (1–3 days)

1. **Add all missing UNIQUE constraints** — prevents duplicate follows, likes, and outfit-clothes associations. Zero API changes required.
2. **Add all missing indexes** — no schema changes, just `CREATE INDEX CONCURRENTLY`. Immediate query performance improvement.
3. **Drop `retiredAt`, `retirementReason`** — completely unused, no code to update.
4. **Drop `WearLog.createdAt`** — rename `wornAt` to be the canonical timestamp, remove the duplicate.
5. **Fix naming consistency in `OutfitRecommendations` and `GlobalProduct`** — add a migration that renames columns to camelCase to match the rest of the schema.

### Medium-Term Refactors (1–2 weeks)

1. **Drop `ClothesAnalytics`** — replace the one calendar query that uses it with a direct `WearLog` aggregation. Update Redis caching to cover the result.
2. **Drop `Activity`** — remove from schema documentation and type definitions.
3. **Remove denormalized wear counters** — drop `Clothes.timesworn`, `Clothes.lastwornat`, `Outfit.timesWorn`, `Outfit.lastWornAt`. Add a Redis-cached computed value backed by `WearLog` aggregations.
4. **Remove `Outfit.weatherWorn/temperatureWorn/locationWorn`** — these should live in `WearLog`. The last-wear context should be queried from `WearLog` when needed.
5. **Confirm and drop `WardrobeOutfit`** — or build the feature it was designed for.

### Long-Term Architecture Improvements (1–2 months)

1. **Replace polymorphic tables with typed junctions** — `OutfitLike`, `CollectionLike`, `OutfitComment`, `CollectionComment`. This enables real FK cascades and clean joins.
2. **Replace `styleTags text[]` with junction tables** — `UserStyleTag(userId, styleTagId)`, `OutfitStyleTag(outfitId, styleTagId)`, `CollectionStyleTag(wardrobeId, styleTagId)`. This makes `StyleTag.usageCount` computable and enables real tag-based discovery.
3. **Rename `Wardrobe` to `Collection`** in the DB to match the product.
4. **Replace `OutfitRecommendations.items jsonb`** with `RecommendationItem(recommendationId, clothesId, position)`.
5. **Move privacy prefs from `User` to `UserPreferences`** — `showClosetValue`, `showItemPrices`, `allowMessages`.

---

## SECTION 5 — Ideal Future Architecture

### Recommended Schema Conventions

- **All table names**: PascalCase singular (`User`, `Outfit`, `Collection`)
- **All column names**: camelCase (`createdAt`, `userId`, `imageUrl`)
- **All surrogate PKs**: `id uuid DEFAULT gen_random_uuid()`
- **All junction tables**: composite PK on the two FK columns, no surrogate `id`
- **All timestamps**: `timestamptz` (with timezone) — currently mixing `timestamp without time zone` and `timestamp with time zone`
- **All enums**: PostgreSQL native `ENUM` types or DB-level CHECK constraints consistently applied

### Ideal Domain Boundaries

```
[Auth Domain]
  User, Account
  → Never modified directly by product code after creation

[Profile Domain]
  UserPreferences
  → Modified only by user settings

[Wardrobe Domain]
  Clothes, Collection, WardrobeClothes (→ CollectionClothes)
  → Core product feature, highest query volume

[Outfit Domain]
  Outfit, OutfitClothes, WearLog
  → Wear tracking, analytics source of truth

[AI Domain]
  OutfitRecommendations, RecommendationItem
  → Written by AI service, read by client; never mutated by user

[Discovery Domain]
  StyleTag, UserStyleTag, OutfitStyleTag, CollectionStyleTag
  → Read-heavy, cache aggressively

[Social Domain]
  Follow, Block, Like, Save, Comment, Notification, Report
  → Event-heavy, consider queue-backed writes for counters

[Billing Domain]
  (Stripe columns on User)
  → Written only by Stripe webhook handler

[Moderation Domain]
  Report, Block
  → Admin read, user write

[Catalogue Domain]
  GlobalProduct
  → Admin/scraper write, user read-only

[CMS Domain]
  FeaturedContent, ContactMessages
  → Admin write, public read
```

### Ideal Future Schema (simplified)

```sql
-- Remove dead tables
DROP TABLE Activity;
DROP TABLE ClothesAnalytics;
DROP TABLE WardrobeOutfit; -- if unused

-- Rename for consistency
ALTER TABLE Wardrobe RENAME TO Collection;

-- Fix junction tables
ALTER TABLE OutfitClothes DROP COLUMN id;
ALTER TABLE OutfitClothes ADD PRIMARY KEY (outfitId, clothesId);

ALTER TABLE WardrobeClothes RENAME TO CollectionClothes;
ALTER TABLE CollectionClothes DROP COLUMN id;
ALTER TABLE CollectionClothes ADD PRIMARY KEY (collectionId, clothesId);

-- Replace polymorphic likes with typed junctions
CREATE TABLE OutfitLike (userId uuid REFERENCES User, outfitId uuid REFERENCES Outfit, createdAt timestamptz DEFAULT now(), PRIMARY KEY (userId, outfitId));
CREATE TABLE CollectionLike (userId uuid REFERENCES User, collectionId uuid REFERENCES Collection, createdAt timestamptz DEFAULT now(), PRIMARY KEY (userId, collectionId));

-- Replace styleTags arrays with junction tables
CREATE TABLE UserStyleTag (userId uuid REFERENCES User, styleTagId uuid REFERENCES StyleTag, PRIMARY KEY (userId, styleTagId));
CREATE TABLE OutfitStyleTag (outfitId uuid REFERENCES Outfit, styleTagId uuid REFERENCES StyleTag, PRIMARY KEY (outfitId, styleTagId));
CREATE TABLE CollectionStyleTag (collectionId uuid REFERENCES Collection, styleTagId uuid REFERENCES StyleTag, PRIMARY KEY (collectionId, styleTagId));

-- Replace RecommendationItems JSONB
CREATE TABLE RecommendationItem (recommendationId uuid REFERENCES OutfitRecommendations, clothesId uuid REFERENCES Clothes, position integer, PRIMARY KEY (recommendationId, clothesId));
```

---

## SECTION 6 — Performance Review

### Probable Slow Queries

| Query                                 | Problem                                                                            | Fix                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Fetch all clothes for a user          | Full scan on `Clothes` filtered by `userId`. Missing composite index.              | `CREATE INDEX idx_clothes_userid_status ON Clothes(userId, status)`                         |
| Analytics page                        | Fetches all clothes then computes in-app                                           | Add `(userId, category)` index; push aggregations to DB                                     |
| Notification bell unread count        | Scans all notifications for user                                                   | `CREATE INDEX idx_notification_userid_read ON Notification(userId, isRead, createdAt DESC)` |
| Discovery feed with `isPublic = true` | Full table scan on `Outfit`                                                        | Partial index on `(isPublic, createdAt DESC) WHERE isPublic = true`                         |
| Profile page follow counts            | `COUNT(*) FROM Follow WHERE followingId = ?` — fine at <10k followers, slow beyond | Redis cache or materialized view                                                            |
| WearLog calendar aggregation          | No index on `(userId, wornAt)` — monthly calendar scans whole log                  | `CREATE INDEX idx_wearlog_userid_wornat ON WearLog(userId, wornAt DESC)`                    |

### Pagination Risks

- `Outfit`, `Clothes`, `WearLog` are all paginated by `createdAt` or `wornAt`. Without an index on these columns combined with `userId`, pagination queries do sequential scans.
- `viewCount`-ordered queries (trending feed) will be increasingly slow as `Outfit` grows. Trending should be precomputed and cached.

### Cache Candidates

| Query                     | Current Caching | Recommended TTL           |
| ------------------------- | --------------- | ------------------------- |
| User analytics dashboard  | Redis 600s ✓    | Keep                      |
| User preferences          | Redis 300s ✓    | Keep                      |
| Owned clothes for AI      | Redis 180s ✓    | Keep                      |
| Discover feed             | Redis 60s ✓     | Keep                      |
| Follow/follower counts    | None            | 300s                      |
| Notification unread count | None            | 30s (invalidate on write) |
| User profile public page  | None            | 120s                      |
| GlobalProduct catalogue   | None            | 3600s                     |

### Aggregation Problems

- `Analytics` route fetches ALL clothes for a user and computes everything in JavaScript. At 500+ items per user, this is slow and memory-intensive. Push to DB with proper GROUP BY queries.
- `Comment.likeCount` cannot be accurate since `Like` has no `'comment'` targetType.
- `StyleTag.usageCount` cannot be accurate since tags are stored as disconnected `text[]` arrays.

---

## SECTION 7 — Developer Experience Review

### Confusing Table Names

- **`Wardrobe`** is called "Collections" in every UI label, URL, and API route. A new developer will spend 30 minutes figuring out which table powers `/collections`.
- **`ClothesAnalytics`** sounds like a reporting table but is actually a precomputed cache that's never populated. It's a trap.
- **`Activity`** exists with a rich schema but is completely dead. Every new developer will try to use it, discover it's empty, and wonder why.

### Confusing Relationships

- The polymorphic `targetType/targetId` pattern across 6 tables makes it impossible to understand "what links to what" by reading the schema. Every query requires knowing the magic string values.
- `WearLog` is per-item but conceptually tied to per-outfit wear events. The dual granularity is confusing.
- `Save.collectionName` is a text string that looks like a FK to `Wardrobe` but isn't.

### Bad Abstractions

- `ClothesAnalytics` was designed to be a precomputed analytics cache but was never wired to any computation process. It's an abstraction with no implementation.
- Denormalized counters everywhere (`likeCount`, `saveCount`, `viewCount`, `followerCount`) promise easy reads but impose hidden write complexity that is currently unmet.

### Areas That Will Slow Future Development

1. **Adding a new likeable entity type** requires updating the CHECK constraint on `Like.targetType`, updating every query that checks targetType, and hoping nothing else breaks. With typed junction tables, it's just a new table.
2. **Building a real tag-based discovery system** is blocked until `styleTags` arrays are replaced with proper junction tables to `StyleTag`.
3. **Building wear analytics** is blocked until `ClothesAnalytics` vs `WearLog` vs `Clothes.timesworn` is resolved into one source of truth.
4. **Any feature that depends on accurate social counts** (trending, popular, leaderboards) is impossible without fixing counter drift or switching to computed values.

---

## Final Scorecard

| Dimension                | Score | Notes                                                                     |
| ------------------------ | ----- | ------------------------------------------------------------------------- |
| **Schema Simplicity**    | 5/10  | Polymorphic anti-patterns, dead tables, dual sources of truth             |
| **Scalability**          | 6/10  | Missing indexes and drifting counters are the main risks                  |
| **Maintainability**      | 5/10  | Naming inconsistency, dead code in schema, confusing table names          |
| **Performance**          | 6/10  | Missing indexes are the immediate gap; analytics are in-app instead of DB |
| **SaaS Readiness**       | 6/10  | Billing, auth, RLS boundaries are solid; social layer is fragile          |
| **Developer Experience** | 5/10  | Wardrobe/Collection rename alone would save hours per new engineer        |

---

## Bottom Line

### What I Would Refactor First If This Were My Startup

Drop `Activity` and `ClothesAnalytics`. Add the 5 missing UNIQUE constraints. Add the critical indexes on `Clothes(userId, status)`, `WearLog(userId, wornAt)`, and `Notification(userId, isRead, createdAt)`. These four things take one day, prevent real data bugs, and deliver the biggest performance improvement per hour of work.

### What Will Become Painful at 10,000 Users

Denormalized counters. `followerCount`, `likeCount`, and `viewCount` will drift noticeably under concurrent writes. Two users liking the same outfit simultaneously will produce a race condition that increments the count once instead of twice. Users will notice their like counts look wrong. The fix requires either DB-level triggers, application-level locks, or moving to computed values.

### What Will Become Painful at 100,000 Users

Three things in combination: (1) The analytics route fetching all clothes in JavaScript will start timing out for power users with 300+ items. (2) `WearLog` with no composite index on `(userId, wornAt)` will produce full table scans for calendar and analytics queries as logs accumulate. (3) The discovery feed's `viewCount`-based trending query hits an unindexed integer column on the `Outfit` table and scans everything. All three require dedicated work before hitting that scale.

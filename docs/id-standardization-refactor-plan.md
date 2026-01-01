# OpenAlex ID Standardization Refactor Plan

## Executive Summary

Standardize all internal OpenAlex IDs to a **namespaced format** (`authors/a123`, `sdgs/1`, `types/article`) as soon as they enter the application. This is analogous to converting all times to UTC at the boundary.

---

## Current State Analysis

### ID Formats Currently in Use

| Format | Example | Used Where |
|--------|---------|------------|
| Fully-qualified | `https://openalex.org/W123` | API responses |
| Fully-qualified with entity | `https://openalex.org/works/W123` | Some API responses |
| Namespaced | `works/w123`, `sdgs/1` | Some internal code |
| Short (native) | `w123`, `a456`, `g789` | URL params, filters |
| Legacy SDG | `https://metadata.un.org/sdg/3` | Old SDG format |

### Current ID-Related Functions (The Mess)

**`@/util.js`:**
- `shortenOpenAlexId(id)` - strips URL prefixes, lowercases
- `entityTypeFromId(id)` - combines native + external detection
- `isOpenAlexId(str)` - regex check for native IDs only
- `idsAreEqual(id1, id2)` - compares shortened IDs
- `entityTypes.fromId(id)` - **duplicate** of native detection

**`@/entityConfigs.js`:**
- `nativeEntityTypeFromId(id)` - detects W/A/I/S/P/F/C/T/G entities
- `externalEntityTypeFromId(id)` - detects namespaced entities (sdgs/, types/, etc.)
- `parseEntityId(id)` - newer function that normalizes to namespaced format
- `urlPartsFromId(id)` - extracts entityType and entityId

**`@/entity.js`:**
- `getType(id, config)` - yet another entity type detection
- `getId(id, config)` - extracts ID from full URL
- `fullId(id, entityType)` - constructs full ID

### Entry Points Where IDs Enter the App

1. **API Responses** (`api.js`) - `entity.id` fields contain `https://openalex.org/...`
2. **Route Parameters** (`router/index.js`) - `/works/w123` or `/w123` shortcuts
3. **Filter URL Strings** (`filterConfigs.js`, `url.js`) - filter values like `a123`
4. **User Input** (autocomplete responses, `oql.js`)
5. **Stored Data** (saved searches, collections in `user.store.js`)

---

## Target State

### Canonical Internal Format: **Namespaced**

```
authors/a123      (native entities)
sdgs/1            (external entities)
types/article     (external entities)
countries/us      (external entities)
```

**Rules:**
- All native entity IDs: `{entityType}/{shortId}` (e.g., `works/w123`)
- All external entity IDs: `{entityType}/{value}` (e.g., `sdgs/1`, `types/article`)
- Always lowercase
- No URL prefixes internally

### New Utility Module: `@/openalexId.js`

A single source of truth for all ID operations:

```javascript
// openalexId.js - Canonical ID utilities

/**
 * Normalize any OpenAlex ID format to canonical namespaced format.
 * This is THE function to call when IDs enter the app.
 * 
 * Examples:
 *   "https://openalex.org/W123" → "works/w123"
 *   "https://openalex.org/works/W123" → "works/w123"
 *   "W123" → "works/w123"
 *   "w123" → "works/w123"
 *   "sdgs/1" → "sdgs/1"
 *   "https://metadata.un.org/sdg/3" → "sdgs/3"
 *   "types/article" → "types/article"
 */
export function normalizeId(id) { ... }

/**
 * Extract entity type from a normalized ID.
 * @param {string} id - Must be in normalized format
 * @returns {string} Entity type (e.g., "works", "authors", "sdgs")
 */
export function getEntityType(id) { ... }

/**
 * Extract the short/value part from a normalized ID.
 * @param {string} id - Must be in normalized format  
 * @returns {string} Short ID or value (e.g., "w123", "1", "article")
 */
export function getShortId(id) { ... }

/**
 * Check if two IDs refer to the same entity.
 */
export function idsAreEqual(id1, id2) { ... }

/**
 * Convert normalized ID to display format for users.
 */
export function toDisplayFormat(id, format = 'short') { ... }

/**
 * Convert normalized ID to API URL format.
 */
export function toApiUrl(id) { ... }

/**
 * Check if a string is a valid OpenAlex ID (any format).
 */
export function isValidId(str) { ... }

/**
 * Parse an ID into components.
 * @returns {{ entityType: string, shortId: string, isNative: boolean }}
 */
export function parseId(id) { ... }
```

---

## Refactoring Phases

### Phase 1: Create New ID Module (`@/openalexId.js`)

**Tasks:**
1. Create `src/openalexId.js` with all canonical ID functions
2. Add comprehensive unit tests
3. Handle all known ID formats:
   - `https://openalex.org/W123`
   - `https://openalex.org/works/W123`
   - `openalex:W123`
   - `W123`, `w123`
   - `works/w123`
   - `sdgs/1`, `https://metadata.un.org/sdg/3`
   - `types/article`, `countries/us`, etc.

**Files to create:**
- `src/openalexId.js`
- `src/__tests__/openalexId.test.js`

### Phase 2: Update Entry Points to Normalize IDs

**2.1 API Layer (`api.js`)**
- Create a response transformer that normalizes all `.id` fields
- Intercept `getEntity()`, `getResultsList()`, etc.

**2.2 Router (`router/index.js`)**
- Normalize `entityId` route params on entry
- Update `EntityPageShortcut` redirect logic

**2.3 Filter System (`filterConfigs.js`, `url.js`)**
- `createFilterValue()` should normalize IDs
- `filtersFromUrlStr()` should normalize filter values
- `optionsFromString()` should normalize values

**2.4 OQL Parser (`oql.js`, `oqlParser.js`)**
- Normalize IDs when parsing OQL
- Update `formatSelectValueToOql()` to use normalized IDs

**Files to modify:**
- `src/api.js`
- `src/router/index.js`  
- `src/filterConfigs.js`
- `src/url.js`
- `src/oql.js`
- `src/oqlParser.js`

### Phase 3: Migrate Consumers to New Module

**3.1 Replace `shortenOpenAlexId()` calls**
~15 files import this. Replace with appropriate `openalexId` function.

**3.2 Replace `entityTypeFromId()` calls**
~12 files import this. Replace with `openalexId.getEntityType()`.

**3.3 Replace `urlPartsFromId()` calls**
Used in `filters.js`. Replace with `openalexId.parseId()`.

**3.4 Update Components**
Key components to update:
- `EntityHeader.vue` - uses `shortenOpenAlexId`, `entityTypeFromId`
- `EntityDrawer.vue` - uses `entityTypeFromId`
- `EntityNew.vue` - uses `entityTypeFromId`
- `FilterSelectOption.vue` - uses `entityTypeFromId`
- `SerpResultsListItem.vue` - uses `entityTypeFromId`
- `WorksGraph.vue` - uses `entityTypeFromId`, `shortenOpenAlexId`
- `CitationsGraph.vue` - uses `shortenOpenAlexId`
- `GroupByTableRow.vue` - creates filters with IDs

**Files to modify (estimated 30+ files):**
- All files that import from `@/util.js`: `shortenOpenAlexId`, `entityTypeFromId`, `idsAreEqual`, `isOpenAlexId`
- All files that import from `@/entityConfigs.js`: `urlPartsFromId`, `parseEntityId`, `nativeEntityTypeFromId`, `externalEntityTypeFromId`

### Phase 4: Clean Up Legacy Code

**4.1 Remove deprecated functions from `util.js`:**
- `shortenOpenAlexId()`
- `entityTypeFromId()`
- `isOpenAlexId()`
- `idsAreEqual()`
- `entityTypes` object

**4.2 Remove from `entityConfigs.js`:**
- `nativeEntityTypeFromId()`
- `externalEntityTypeFromId()`
- `urlPartsFromId()`
- `parseEntityId()`

**4.3 Remove `entity.js`:**
- Entire file appears unused or duplicative

**4.4 Remove SDG hacks:**
- In `api.js`: `url.replace("sdgs/", "")`
- In `entityConfigs.js`: `replaceAll("https://metadata.un.org/sdg/", "sdgs/")`

### Phase 5: Update Tests & Documentation

- Update existing tests to use new ID format
- Add regression tests for ID normalization
- Update any documentation

---

## Detailed File Impact Analysis

| File | Changes Needed |
|------|----------------|
| `src/openalexId.js` | **NEW** - Core ID utilities |
| `src/__tests__/openalexId.test.js` | **NEW** - Tests |
| `src/util.js` | Remove ID functions, add deprecation warnings |
| `src/entityConfigs.js` | Remove ID functions, keep entity configs |
| `src/entity.js` | **DELETE** - unused |
| `src/api.js` | Add response transformer for ID normalization |
| `src/router/index.js` | Normalize route params |
| `src/filterConfigs.js` | Normalize filter values |
| `src/url.js` | Use new ID module |
| `src/filters.js` | Use new ID module |
| `src/oql.js` | Use new ID module |
| `src/oqlParser.js` | Use new ID module |
| `src/store/user.store.js` | Update `hasPendingCorrection` getter |
| `src/components/**/*.vue` | ~20 components need updates |
| `src/views/**/*.vue` | ~10 views need updates |

---

## Migration Strategy

1. **Non-breaking approach**: New module works alongside old code
2. **Gradual migration**: Update files one at a time, test as we go
3. **Entry point focus**: Prioritize normalizing at boundaries first
4. **Deprecation warnings**: Add console warnings to old functions before removal

---

## Risk Mitigation

- **Backwards compatibility**: Old ID formats in URLs will still work (we normalize them)
- **External links**: Links shared externally continue to work
- **API compatibility**: We transform to API format when making requests
- **Testing**: Comprehensive test suite before changes

---

## Success Criteria

1. ✅ Single `openalexId.js` module for all ID operations
2. ✅ All IDs normalized to namespaced format at entry points
3. ✅ No scattered ID manipulation logic in components
4. ✅ Entity type always derivable from ID without inference
5. ✅ Clean, testable, maintainable code

/**
 * OpenAlex ID Utilities
 * 
 * This module is the single source of truth for all OpenAlex ID operations.
 * All IDs should be normalized to the canonical "namespaced" format as soon
 * as they enter the application.
 * 
 * Canonical format: {entityType}/{shortId}
 * Examples:
 *   - works/w123456789
 *   - authors/a987654321
 *   - sdgs/1
 *   - types/article
 *   - countries/us
 */

/**
 * Maps single-letter prefixes to entity types for native OpenAlex entities.
 * Native entities have IDs like W123, A456, etc.
 */
const NATIVE_PREFIX_TO_ENTITY = {
    w: 'works',
    a: 'authors',
    i: 'institutions',
    s: 'sources',
    p: 'publishers',
    f: 'funders',
    c: 'concepts',
    t: 'topics',
    g: 'awards',
};

/**
 * Reverse mapping: entity type to single-letter prefix
 */
const ENTITY_TO_NATIVE_PREFIX = Object.fromEntries(
    Object.entries(NATIVE_PREFIX_TO_ENTITY).map(([k, v]) => [v, k])
);

/**
 * All valid entity types (both native and external)
 */
const ALL_ENTITY_TYPES = [
    // Native entities (have single-letter ID prefixes)
    'works',
    'authors',
    'institutions',
    'sources',
    'publishers',
    'funders',
    'concepts',
    'topics',
    'awards',
    // External entities (no single-letter prefix)
    'keywords',
    'subfields',
    'fields',
    'domains',
    'sdgs',
    'countries',
    'continents',
    'languages',
    'types',
    'source-types',
    'institution-types',
    'licenses',
    'oa-statuses',
    'locations',
];

/**
 * Native entity types (those with single-letter ID prefixes)
 */
const NATIVE_ENTITY_TYPES = Object.values(NATIVE_PREFIX_TO_ENTITY);

/**
 * Normalize any OpenAlex ID format to the canonical namespaced format.
 * This is THE function to call when IDs enter the application.
 * 
 * @param {string} id - ID in any format
 * @returns {string|null} Normalized ID in format "entityType/shortId", or null if invalid
 * 
 * @example
 * normalizeId("https://openalex.org/W123") // => "works/w123"
 * normalizeId("https://openalex.org/works/W123") // => "works/w123"
 * normalizeId("W123") // => "works/w123"
 * normalizeId("w123") // => "works/w123"
 * normalizeId("works/w123") // => "works/w123"
 * normalizeId("sdgs/1") // => "sdgs/1"
 * normalizeId("https://metadata.un.org/sdg/3") // => "sdgs/3"
 * normalizeId("types/article") // => "types/article"
 * normalizeId("openalex:W123") // => "works/w123"
 */
function normalizeId(id) {
    if (!id || typeof id !== 'string') {
        return null;
    }

    // Work with lowercase and trimmed
    let normalized = id.trim().toLowerCase();

    // Handle legacy SDG format: https://metadata.un.org/sdg/3 => sdgs/3
    if (normalized.includes('metadata.un.org/sdg/')) {
        normalized = normalized.replace(/.*metadata\.un\.org\/sdg\//, 'sdgs/');
    }

    // Strip common URL prefixes
    normalized = normalized
        .replace(/^https?:\/\/openalex\.org\//, '')
        .replace(/^https?:\/\/api\.openalex\.org\//, '')
        .replace(/^openalex:/, '');

    // Check if already in namespaced format (entityType/value)
    if (normalized.includes('/')) {
        const [entityType, ...rest] = normalized.split('/');
        const shortId = rest.join('/'); // Handle cases like source-types/journal
        
        if (ALL_ENTITY_TYPES.includes(entityType) && shortId) {
            return `${entityType}/${shortId}`;
        }
        // Invalid namespaced format
        return null;
    }

    // Try to parse as a native short ID (e.g., "w123", "a456")
    const nativeMatch = normalized.match(/^([a-z])(\d+)$/);
    if (nativeMatch) {
        const [, prefix, numericPart] = nativeMatch;
        const entityType = NATIVE_PREFIX_TO_ENTITY[prefix];
        if (entityType) {
            return `${entityType}/${prefix}${numericPart}`;
        }
    }

    // Could not normalize
    return null;
}

/**
 * Extract the entity type from an ID.
 * Accepts IDs in any format - will normalize first.
 * 
 * @param {string} id - ID in any format
 * @returns {string|null} Entity type (e.g., "works", "authors", "sdgs") or null
 * 
 * @example
 * getEntityType("works/w123") // => "works"
 * getEntityType("W123") // => "works"
 * getEntityType("sdgs/1") // => "sdgs"
 */
function getEntityType(id) {
    const normalized = normalizeId(id);
    if (!normalized) return null;
    return normalized.split('/')[0];
}

/**
 * Extract the short ID (the part after the entity type) from an ID.
 * Accepts IDs in any format - will normalize first.
 * 
 * @param {string} id - ID in any format
 * @returns {string|null} Short ID (e.g., "w123", "1", "article") or null
 * 
 * @example
 * getShortId("works/w123") // => "w123"
 * getShortId("https://openalex.org/W123") // => "w123"
 * getShortId("sdgs/1") // => "1"
 * getShortId("types/article") // => "article"
 */
function getShortId(id) {
    const normalized = normalizeId(id);
    if (!normalized) return null;
    const parts = normalized.split('/');
    return parts.slice(1).join('/');
}

/**
 * Parse an ID into its components.
 * Accepts IDs in any format - will normalize first.
 * 
 * @param {string} id - ID in any format
 * @returns {{ entityType: string, shortId: string, isNative: boolean, normalized: string }|null}
 * 
 * @example
 * parseId("W123")
 * // => { entityType: "works", shortId: "w123", isNative: true, normalized: "works/w123" }
 * 
 * parseId("sdgs/1")
 * // => { entityType: "sdgs", shortId: "1", isNative: false, normalized: "sdgs/1" }
 */
function parseId(id) {
    const normalized = normalizeId(id);
    if (!normalized) return null;

    const entityType = normalized.split('/')[0];
    const shortId = normalized.split('/').slice(1).join('/');
    const isNative = NATIVE_ENTITY_TYPES.includes(entityType);

    return {
        entityType,
        shortId,
        isNative,
        normalized,
    };
}

/**
 * Check if two IDs refer to the same entity.
 * Accepts IDs in any format - will normalize both before comparing.
 * 
 * @param {string} id1 - First ID
 * @param {string} id2 - Second ID
 * @returns {boolean} True if the IDs refer to the same entity
 * 
 * @example
 * idsAreEqual("W123", "https://openalex.org/W123") // => true
 * idsAreEqual("works/w123", "W123") // => true
 * idsAreEqual("W123", "A123") // => false
 */
function idsAreEqual(id1, id2) {
    const normalized1 = normalizeId(id1);
    const normalized2 = normalizeId(id2);
    
    if (!normalized1 || !normalized2) return false;
    return normalized1 === normalized2;
}

/**
 * Check if a string is a valid OpenAlex ID (in any format).
 * 
 * @param {string} str - String to check
 * @returns {boolean} True if the string is a valid OpenAlex ID
 * 
 * @example
 * isValidId("W123") // => true
 * isValidId("works/w123") // => true
 * isValidId("sdgs/1") // => true
 * isValidId("random-string") // => false
 */
function isValidId(str) {
    return normalizeId(str) !== null;
}

/**
 * Check if an entity type is a native OpenAlex entity (has single-letter ID prefix).
 * 
 * @param {string} entityType - Entity type to check
 * @returns {boolean} True if native entity
 * 
 * @example
 * isNativeEntityType("works") // => true
 * isNativeEntityType("sdgs") // => false
 */
function isNativeEntityType(entityType) {
    return NATIVE_ENTITY_TYPES.includes(entityType);
}

/**
 * Convert a normalized ID to a full API URL.
 * 
 * @param {string} id - ID (will be normalized first)
 * @returns {string|null} Full API URL or null if invalid
 * 
 * @example
 * toApiUrl("works/w123") // => "https://api.openalex.org/works/w123"
 * toApiUrl("W123") // => "https://api.openalex.org/works/w123"
 * toApiUrl("sdgs/1") // => "https://api.openalex.org/sdgs/1"
 */
function toApiUrl(id) {
    const normalized = normalizeId(id);
    if (!normalized) return null;
    return `https://api.openalex.org/${normalized}`;
}

/**
 * Convert a normalized ID to a full OpenAlex.org URL.
 * 
 * @param {string} id - ID (will be normalized first)
 * @returns {string|null} Full openalex.org URL or null if invalid
 * 
 * @example
 * toOpenAlexUrl("works/w123") // => "https://openalex.org/works/w123"
 * toOpenAlexUrl("W123") // => "https://openalex.org/works/w123"
 */
function toOpenAlexUrl(id) {
    const normalized = normalizeId(id);
    if (!normalized) return null;
    return `https://openalex.org/${normalized}`;
}

/**
 * Convert to display format for showing to users.
 * 
 * @param {string} id - ID (will be normalized first)
 * @param {'short'|'namespaced'|'full'} format - Desired output format
 * @returns {string|null} Formatted ID or null if invalid
 * 
 * @example
 * toDisplayFormat("works/w123", "short") // => "W123"
 * toDisplayFormat("works/w123", "namespaced") // => "works/W123"
 * toDisplayFormat("works/w123", "full") // => "https://openalex.org/W123"
 * toDisplayFormat("sdgs/1", "short") // => "sdgs/1" (external entities always show namespaced)
 */
function toDisplayFormat(id, format = 'short') {
    const parsed = parseId(id);
    if (!parsed) return null;

    const { entityType, shortId, isNative } = parsed;

    // For native entities, uppercase the short ID for display (W123 not w123)
    const displayShortId = isNative ? shortId.toUpperCase() : shortId;

    switch (format) {
        case 'short':
            // Native entities can use just the short ID (W123)
            // External entities need the namespace (sdgs/1)
            return isNative ? displayShortId : `${entityType}/${displayShortId}`;
        
        case 'namespaced':
            return `${entityType}/${displayShortId}`;
        
        case 'full':
            return `https://openalex.org/${isNative ? displayShortId : entityType + '/' + displayShortId}`;
        
        default:
            return isNative ? displayShortId : `${entityType}/${displayShortId}`;
    }
}

/**
 * Get the single-letter prefix for a native entity type.
 * 
 * @param {string} entityType - Entity type
 * @returns {string|null} Single-letter prefix or null if not a native entity
 * 
 * @example
 * getNativePrefix("works") // => "w"
 * getNativePrefix("sdgs") // => null
 */
function getNativePrefix(entityType) {
    return ENTITY_TO_NATIVE_PREFIX[entityType] || null;
}

/**
 * Construct a normalized ID from entity type and short ID.
 * 
 * @param {string} entityType - Entity type
 * @param {string} shortId - Short ID or value
 * @returns {string|null} Normalized ID or null if invalid entity type
 * 
 * @example
 * makeId("works", "w123") // => "works/w123"
 * makeId("sdgs", "1") // => "sdgs/1"
 */
function makeId(entityType, shortId) {
    if (!ALL_ENTITY_TYPES.includes(entityType)) return null;
    if (!shortId) return null;
    return `${entityType}/${String(shortId).toLowerCase()}`;
}

export {
    // Core functions
    normalizeId,
    getEntityType,
    getShortId,
    parseId,
    idsAreEqual,
    isValidId,
    
    // Type checking
    isNativeEntityType,
    getNativePrefix,
    
    // Format conversion
    toApiUrl,
    toOpenAlexUrl,
    toDisplayFormat,
    
    // Construction
    makeId,
    
    // Constants (for advanced use cases)
    NATIVE_PREFIX_TO_ENTITY,
    ENTITY_TO_NATIVE_PREFIX,
    ALL_ENTITY_TYPES,
    NATIVE_ENTITY_TYPES,
};

import { getFacetConfig } from "@/facetConfigUtils";
import { facetConfigs } from "@/facetConfigs";
import { getEntityConfig, getEntityConfigs } from "@/entityConfigs";
import { filtersFromUrlStr, createSimpleFilter } from "@/filterConfigs";
import { api } from "@/api";
import { shortenOpenAlexId } from "@/util";
import { parseOql, parseOqlSync } from "@/oqlParser";

const defined = (x) => x !== undefined && x !== null;

const isNativeEntityType = (entityToSelect) => {
    if (!entityToSelect) return false;
    const config = getEntityConfig(entityToSelect);
    return config?.isNative ?? false;
};

const getDisplayNameForFacet = (facetConfig) => {
    return facetConfig?.displayName || facetConfig?.key;
};

const findFacetConfigByDisplayName = (entityType, displayName) => {
    const configs = facetConfigs(entityType);
    const lowerName = displayName.toLowerCase().trim();
    
    return configs.find(c => 
        c.displayName?.toLowerCase() === lowerName ||
        c.key?.toLowerCase() === lowerName
    );
};

const formatRangeValue = (value) => {
    if (!value || typeof value !== 'string') return { type: 'exact', value };
    
    const rangeMatch = value.match(/^(\d*)-(\d*)$/);
    if (!rangeMatch) {
        return { type: 'exact', value };
    }
    
    const [, min, max] = rangeMatch;
    
    if (min && max) {
        return { type: 'range', min, max };
    } else if (min && !max) {
        return { type: 'gte', value: min };
    } else if (!min && max) {
        return { type: 'lte', value: max };
    }
    
    return { type: 'exact', value };
};

const formatRangeToOql = (displayName, value) => {
    const parsed = formatRangeValue(value);
    
    switch (parsed.type) {
        case 'exact':
            return `${displayName} = ${parsed.value}`;
        case 'gte':
            return `${displayName} ≥ ${parsed.value}`;
        case 'lte':
            return `${displayName} ≤ ${parsed.value}`;
        case 'range':
            return `${displayName} is ${parsed.min}–${parsed.max}`;
        default:
            return `${displayName} = ${value}`;
    }
};

const parseRangeFromOql = (clause) => {
    let match;
    
    // Match: field = value OR field is value (exact)
    match = clause.match(/^(.+?)\s*=\s*(\d+)$/);
    if (match) return { field: match[1].trim(), value: match[2] };
    
    match = clause.match(/^(.+?)\s+is\s+(\d+)$/);
    if (match) return { field: match[1].trim(), value: match[2] };
    
    match = clause.match(/^(.+?)\s*[≥>=]\s*(\d+)$/);
    if (match) return { field: match[1].trim(), value: `${match[2]}-` };
    
    match = clause.match(/^(.+?)\s*[≤<=]\s*(\d+)$/);
    if (match) return { field: match[1].trim(), value: `-${match[2]}` };
    
    // Match: field is min–max (range)
    match = clause.match(/^(.+?)\s+is\s+(\d+)[–-](\d+)$/);
    if (match) return { field: match[1].trim(), value: `${match[2]}-${match[3]}` };
    
    return null;
};

const extractBracketedId = (valueStr) => {
    const match = valueStr.match(/\[([a-z]\d+)\]/i);
    return match ? match[1].toLowerCase() : null;
};

const extractDisplayNameBeforeBracket = (valueStr) => {
    const match = valueStr.match(/^(.+?)\s*\[[a-z]\d+\]/i);
    return match ? match[1].trim() : null;
};

const parseSelectValues = (valueStr) => {
    const isOr = valueStr.includes(' or ');
    const isAnd = valueStr.includes(' and ');
    
    let separator, joinType;
    if (isOr) {
        separator = / or /i;
        joinType = 'or';
    } else if (isAnd) {
        separator = / and /i;
        joinType = 'and';
    } else {
        return { values: [valueStr.trim()], joinType: 'single' };
    }
    
    let cleanValue = valueStr.replace(/^\(/, '').replace(/\)$/, '');
    const values = cleanValue.split(separator).map(v => v.trim());
    
    return { values, joinType };
};

const formatSelectValueToOql = async (value, entityToSelect, isNative) => {
    let shortId = shortenOpenAlexId(value);
    
    if (value === 'null' || value === 'unknown' || value === null) {
        return 'unknown';
    }
    
    // For SDGs, extract just the number from formats like "sdgs/3" or "https://metadata.un.org/sdg/3"
    if (entityToSelect === 'sdgs') {
        shortId = value.replace(/.*\//, '');
    }
    
    if (isNative) {
        // Native entities: use API to get display name, format as "Display Name [id]"
        try {
            const displayName = await api.getEntityDisplayName(entityToSelect, shortId);
            return `${displayName} [${shortId}]`;
        } catch (e) {
            return `[${shortId}]`;
        }
    } else {
        // Non-native entities (types, countries, sdgs, etc.): format as "Display Name [id]"
        try {
            const filterKey = getEntityConfig(entityToSelect)?.filterKey || entityToSelect;
            const displayName = await api.getFilterValueDisplayName(filterKey, shortId);
            // Use the short ID (e.g., "article", "de", "3")
            if (displayName && displayName !== shortId) {
                return `${displayName} [${shortId}]`;
            }
            return `[${shortId}]`;
        } catch (e) {
            return `[${shortId}]`;
        }
    }
};

const formatBooleanToOql = (facetConfig, value, isNegated) => {
    const displayName = getDisplayNameForFacet(facetConfig);
    const boolValue = value === 'true' || value === true;
    
    const effectiveValue = isNegated ? !boolValue : boolValue;
    
    if (facetConfig.booleanValues) {
        return effectiveValue ? facetConfig.booleanValues[1] : facetConfig.booleanValues[0];
    }
    
    return effectiveValue ? `is ${displayName}` : `is not ${displayName}`;
};

const formatSearchToOql = (facetConfig, value) => {
    const displayName = getDisplayNameForFacet(facetConfig);
    return `${displayName} includes "${value}"`;
};

const formatSelectToOql = async (facetConfig, value, isNegated) => {
    const displayName = getDisplayNameForFacet(facetConfig);
    const entityToSelect = facetConfig.entityToSelect;
    const isNative = isNativeEntityType(entityToSelect);
    
    const values = value.split(/[|+]/).map(v => v.trim());
    const isOr = value.includes('|');
    const isAnd = value.includes('+');
    
    // Sort values alphabetically by ID before formatting
    const sortedValues = [...values].sort((a, b) => a.localeCompare(b));
    
    const formattedValues = await Promise.all(
        sortedValues.map(v => formatSelectValueToOql(v, entityToSelect, isNative))
    );
    
    if (isNegated) {
        // Use "is not X and not Y" syntax
        if (formattedValues.length === 1) {
            return `${displayName} is not ${formattedValues[0]}`;
        } else {
            const notValues = formattedValues.map((v, i) => i === 0 ? `not ${v}` : `not ${v}`);
            return `${displayName} is ${notValues.join(' and ')}`;
        }
    }
    
    let valueStr;
    if (formattedValues.length === 1) {
        valueStr = formattedValues[0];
    } else if (isOr) {
        valueStr = formattedValues.join(' or ');
    } else if (isAnd) {
        valueStr = formattedValues.join(' and ');
    } else {
        valueStr = formattedValues.join(' or ');
    }
    
    return `${displayName} is ${valueStr}`;
};

const filterToOqlClause = async (filter) => {
    const facetConfig = filter;
    const value = filter.value;
    const isNegated = filter.isNegated;
    
    switch (facetConfig.type) {
        case 'boolean':
            return formatBooleanToOql(facetConfig, value, isNegated);
        
        case 'range':
            const rangeOql = formatRangeToOql(getDisplayNameForFacet(facetConfig), value);
            return isNegated ? `not (${rangeOql})` : rangeOql;
        
        case 'search':
            return formatSearchToOql(facetConfig, value);
        
        case 'selectEntity':
            return await formatSelectToOql(facetConfig, value, isNegated);
        
        default:
            return `${facetConfig.key}:${isNegated ? '!' : ''}${value}`;
    }
};

export const filtersToOql = async (entityType, filters, options = {}) => {
    if (!filters || filters.length === 0) {
        const entityConfig = getEntityConfig(entityType);
        const entityName = entityConfig?.displayName || entityType;
        return `${capitalize(entityName)}`;
    }
    
    const entityConfig = getEntityConfig(entityType);
    const entityName = entityConfig?.displayName || entityType;
    
    // Sort filters alphabetically by display name
    const sortedFilters = [...filters].sort((a, b) => {
        const nameA = getDisplayNameForFacet(a).toLowerCase();
        const nameB = getDisplayNameForFacet(b).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    const clauses = await Promise.all(sortedFilters.map(f => filterToOqlClause(f)));
    
    let oql = `${capitalize(entityName)} where ${clauses.join(' and ')}`;
    
    if (options.sort) {
        const sortKey = options.sort.replace(':desc', '').replace(':asc', '');
        const sortConfig = getFacetConfig(entityType, sortKey);
        const sortName = sortConfig ? getDisplayNameForFacet(sortConfig) : sortKey;
        oql += `; sort by ${sortName}`;
    }
    
    if (options.sample) {
        oql += `; sample ${options.sample}`;
    }
    
    if (options.groupBy) {
        const groupByConfig = getFacetConfig(entityType, options.groupBy);
        const groupByName = groupByConfig ? getDisplayNameForFacet(groupByConfig) : options.groupBy;
        oql += `; group by ${groupByName}`;
    }
    
    if (options.includeXpac) {
        oql += `; include xpac`;
    }
    
    return oql;
};

export const routeToOql = async (route) => {
    const entityType = route.params?.entityType || 'works';
    const filters = filtersFromUrlStr(entityType, route.query?.filter);
    
    const options = {
        sort: route.query?.sort,
        sample: route.query?.sample,
        groupBy: route.query?.group_by,
        includeXpac: route.query?.include_xpac === 'true',
    };
    
    return await filtersToOql(entityType, filters, options);
};

const capitalize = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const parseBooleanClause = (entityType, clause) => {
    const lowerClause = clause.toLowerCase().trim();
    
    const configs = facetConfigs(entityType).filter(c => c.type === 'boolean');
    
    for (const config of configs) {
        if (config.booleanValues) {
            const [falseVal, trueVal] = config.booleanValues.map(v => v.toLowerCase());
            
            // Match exact value
            if (lowerClause === trueVal) {
                return { key: config.key, value: true, isNegated: false };
            }
            if (lowerClause === falseVal) {
                return { key: config.key, value: false, isNegated: false };
            }
            
            // Match "it's X" pattern
            if (lowerClause === `it's ${trueVal}`) {
                return { key: config.key, value: true, isNegated: false };
            }
            if (lowerClause === `it's ${falseVal}`) {
                return { key: config.key, value: false, isNegated: false };
            }
        }
        
        const displayName = config.displayName?.toLowerCase();
        if (lowerClause === `is ${displayName}`) {
            return { key: config.key, value: true, isNegated: false };
        }
        if (lowerClause === `is not ${displayName}`) {
            return { key: config.key, value: false, isNegated: false };
        }
        // Match "it's X" pattern for displayName
        if (lowerClause === `it's ${displayName}`) {
            return { key: config.key, value: true, isNegated: false };
        }
    }
    
    return null;
};

const parseSearchClause = (entityType, clause) => {
    const match = clause.match(/^(.+?)\s+includes\s+"([^"]+)"$/i);
    if (!match) return null;
    
    const [, fieldName, searchValue] = match;
    const config = findFacetConfigByDisplayName(entityType, fieldName);
    
    if (config && config.type === 'search') {
        return { key: config.key, value: searchValue, isNegated: false };
    }
    
    return null;
};

const parseSelectClause = (entityType, clause) => {
    let match;
    
    // Match: field is [not] value [and [not] value]*
    match = clause.match(/^(.+?)\s+is\s+(.+)$/i);
    if (match) {
        const [, fieldName, valuesStr] = match;
        return parseSelectValuesWithNegation(entityType, fieldName, valuesStr);
    }
    
    return null;
};

const parseSelectValuesWithNegation = (entityType, fieldName, valuesStr) => {
    const config = findFacetConfigByDisplayName(entityType, fieldName.trim());
    if (!config) return null;
    
    const isNative = isNativeEntityType(config.entityToSelect);
    
    // For native entities, use bracketed IDs as anchors
    // This allows display names to contain "and" without being split
    if (isNative) {
        return parseNativeEntityValues(config, valuesStr);
    }
    
    // For non-native entities, split by "and" to get individual value segments
    return parseNonNativeEntityValues(config, valuesStr);
};

const parseNativeEntityValues = (config, valuesStr) => {
    // Simple approach: just find all bracketed IDs [x123456]
    const idPattern = /\[([a-z]\d+)\]/gi;
    const allIds = [];
    
    let match;
    while ((match = idPattern.exec(valuesStr)) !== null) {
        allIds.push(match[1].toLowerCase());
    }
    
    // Check for 'unknown' value
    if (allIds.length === 0) {
        if (valuesStr.toLowerCase().trim() === 'unknown') {
            return { key: config.key, value: 'null', isNegated: false };
        }
        if (valuesStr.toLowerCase().trim() === 'not unknown') {
            return { key: config.key, value: 'null', isNegated: true };
        }
        throw new Error(`Native entity values require bracketed IDs. No IDs found in: ${valuesStr}`);
    }
    
    // Now determine which IDs are negated by checking what precedes each [id]
    // Look for "not" before the display name that precedes each ID
    const positiveIds = [];
    const negatedIds = [];
    
    for (const id of allIds) {
        // Find the position of this ID in the string
        const idRegex = new RegExp(`\\[${id}\\]`, 'i');
        const idMatch = valuesStr.match(idRegex);
        if (!idMatch) continue;
        
        const idPos = valuesStr.indexOf(idMatch[0]);
        const textBefore = valuesStr.substring(0, idPos);
        
        // Check if there's a "not" before this ID (after any previous ID or start)
        // Find the last ] before this position, or start of string
        const lastBracketPos = textBefore.lastIndexOf(']');
        const relevantText = textBefore.substring(lastBracketPos + 1);
        
        // Check if "not " appears in the relevant text
        if (/\bnot\s+/i.test(relevantText)) {
            negatedIds.push(id);
        } else {
            positiveIds.push(id);
        }
    }
    
    // Build filter(s)
    const results = [];
    
    if (positiveIds.length > 0) {
        results.push({
            key: config.key,
            value: positiveIds.join('|'),
            isNegated: false,
        });
    }
    
    if (negatedIds.length > 0) {
        results.push({
            key: config.key,
            value: negatedIds.join('|'),
            isNegated: true,
        });
    }
    
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];
    return results;
};

const parseNonNativeEntityValues = (config, valuesStr) => {
    // Split by " and " to get individual value segments
    const segments = valuesStr.split(/\s+and\s+/i).map(s => s.trim());
    
    const positiveValues = [];
    const negatedValues = [];
    
    for (const segment of segments) {
        // Check if segment starts with "not "
        const notMatch = segment.match(/^not\s+(.+)$/i);
        if (notMatch) {
            negatedValues.push(notMatch[1].trim());
        } else {
            // Check for " or " within positive values
            if (segment.toLowerCase().includes(' or ')) {
                const orValues = segment.split(/\s+or\s+/i).map(v => v.trim());
                positiveValues.push(...orValues);
            } else {
                positiveValues.push(segment);
            }
        }
    }
    
    // Parse all values
    const parseValue = (v) => {
        if (v.toLowerCase() === 'unknown') return 'null';
        return v;
    };
    
    const parsedPositive = positiveValues.map(parseValue);
    const parsedNegated = negatedValues.map(parseValue);
    
    // Build filter(s)
    const results = [];
    
    if (parsedPositive.length > 0) {
        const positiveValue = parsedPositive.join('|');
        results.push({
            key: config.key,
            value: positiveValue,
            isNegated: false,
        });
    }
    
    if (parsedNegated.length > 0) {
        const negatedValue = parsedNegated.filter(v => v !== null).join('|');
        results.push({
            key: config.key,
            value: negatedValue,
            isNegated: true,
        });
    }
    
    // Return combined result or single result
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];
    
    // Return multiple filters for mixed positive/negated
    return results;
};

const parseSelectField = (entityType, fieldName, values, joinType, isNegated) => {
    const config = findFacetConfigByDisplayName(entityType, fieldName.trim());
    if (!config) return null;
    
    const isNative = isNativeEntityType(config.entityToSelect);
    
    const parsedValues = values.map(v => {
        if (v.toLowerCase() === 'unknown') return 'null';
        
        const bracketId = extractBracketedId(v);
        if (bracketId) {
            return bracketId;
        }
        
        if (isNative) {
            return null;
        }
        
        return v;
    });
    
    if (isNative && parsedValues.some(v => v === null)) {
        const missingIdValues = values.filter(v => !extractBracketedId(v) && v.toLowerCase() !== 'unknown');
        if (missingIdValues.length > 0) {
            throw new Error(`Native entity values require bracketed IDs. Missing ID for: ${missingIdValues.join(', ')}`);
        }
    }
    
    const separator = joinType === 'and' ? '+' : '|';
    const combinedValue = parsedValues.filter(v => v !== null).join(separator);
    
    return {
        key: config.key,
        value: combinedValue,
        isNegated,
    };
};

const parseClause = (entityType, clause) => {
    clause = clause.trim();
    
    const rangeResult = parseRangeFromOql(clause);
    if (rangeResult) {
        const config = findFacetConfigByDisplayName(entityType, rangeResult.field);
        if (config && config.type === 'range') {
            return { key: config.key, value: rangeResult.value, isNegated: false };
        }
    }
    
    const boolResult = parseBooleanClause(entityType, clause);
    if (boolResult) return boolResult;
    
    const searchResult = parseSearchClause(entityType, clause);
    if (searchResult) return searchResult;
    
    const selectResult = parseSelectClause(entityType, clause);
    if (selectResult) return selectResult;
    
    throw new Error(`Unable to parse clause: "${clause}"`);
};

// Async version with full validation
export const oqlToFilters = async (oqlString, options = {}) => {
    // Use Peggy parser for OQL parsing with async validation
    return await parseOql(oqlString, options);
};

// Sync version for quick syntax checks (no API validation)
export const oqlToFiltersSync = (oqlString) => {
    // Parse without async validation - just returns AST
    return parseOqlSync(oqlString);
};

const splitClauses = (str) => {
    const clauses = [];
    let current = '';
    let parenDepth = 0;
    let inQuotes = false;
    
    const words = str.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        for (const char of word) {
            if (char === '"') inQuotes = !inQuotes;
            if (char === '(' && !inQuotes) parenDepth++;
            if (char === ')' && !inQuotes) parenDepth--;
        }
        
        // Split on "and" only if:
        // 1. We're not inside parens or quotes
        // 2. The next word is NOT "not" (which means it's part of a value list)
        const nextWord = words[i + 1]?.toLowerCase();
        const isClauseSeparator = word.toLowerCase() === 'and' && 
            parenDepth === 0 && 
            !inQuotes && 
            nextWord !== 'not';
        
        if (isClauseSeparator) {
            if (current.trim()) {
                clauses.push(current.trim());
            }
            current = '';
        } else {
            current += (current ? ' ' : '') + word;
        }
    }
    
    if (current.trim()) {
        clauses.push(current.trim());
    }
    
    return clauses;
};

export const oqlToRoute = async (oqlString, currentRoute, parseOptions = {}) => {
    const { entityType, filters, options } = await oqlToFilters(oqlString, parseOptions);
    
    const query = { ...currentRoute?.query };
    
    delete query.filter;
    delete query.sort;
    delete query.sample;
    delete query.group_by;
    delete query.include_xpac;
    
    if (filters.length > 0) {
        query.filter = filters.map(f => f.asStr).join(',');
    }
    
    if (options.sort) {
        query.sort = options.sort;
    }
    
    if (options.sample) {
        query.sample = options.sample;
    }
    
    if (options.groupBy) {
        query.group_by = options.groupBy;
    }
    
    if (options.includeXpac) {
        query.include_xpac = 'true';
    }
    
    query.page = 1;
    
    return {
        name: 'Serp',
        params: { entityType },
        query,
    };
};

// Async validation with full API checks
export const validateOql = async (oqlString, options = {}) => {
    try {
        await oqlToFilters(oqlString, options);
        return { valid: true, error: null };
    } catch (e) {
        return { valid: false, error: e.message };
    }
};

// Sync validation for quick syntax checks only (no API validation)
export const validateOqlSync = (oqlString) => {
    try {
        oqlToFiltersSync(oqlString);
        return { valid: true, error: null };
    } catch (e) {
        return { valid: false, error: e.message };
    }
};

export const oql = {
    filtersToOql,
    routeToOql,
    oqlToFilters,
    oqlToFiltersSync,
    oqlToRoute,
    validateOql,
    validateOqlSync,
};

// OQL Parser using Peggy
// Parses OQL strings into structured AST for conversion to URL filters

import { facetConfigs, getEntityConfigs } from '@/facetConfigs';
import { createSimpleFilter } from '@/filterConfigs';
import { getEntityConfig } from '@/entityConfigs';
import { api } from '@/api';

// Import pre-compiled Peggy parser
import * as oqlGrammar from './oqlGrammar.js';

// Find facet config by display name
const findFacetConfigByDisplayName = (entityType, displayName) => {
    const configs = facetConfigs(entityType);
    const lowerName = displayName.toLowerCase().trim();
    
    return configs.find(c => {
        if (c.displayName?.toLowerCase() === lowerName) return true;
        if (c.key?.toLowerCase() === lowerName) return true;
        if (c.alternateNames?.some(alt => alt.toLowerCase() === lowerName)) return true;
        return false;
    });
};

// Check if an entity type is "native" (has its own endpoint)
const isNativeEntityType = (entityToSelect) => {
    if (!entityToSelect) return false;
    const config = getEntityConfig(entityToSelect);
    return config?.isNative ?? false;
};

// Validate entity ID exists and optionally check display name matches
const validateEntityId = async (entityToSelect, id, providedDisplayName) => {
    if (!id) return { valid: true };
    
    try {
        const displayName = await api.getEntityDisplayName(entityToSelect, id);
        
        // If display name was provided, check it matches
        if (providedDisplayName && providedDisplayName.toLowerCase().trim() !== displayName.toLowerCase().trim()) {
            return {
                valid: false,
                error: `Display name mismatch: "${providedDisplayName}" does not match "${displayName}" for ID [${id}]`
            };
        }
        
        return { valid: true, displayName };
    } catch (e) {
        return {
            valid: false,
            error: `Invalid ID: [${id}] does not exist in ${entityToSelect}`
        };
    }
};

// Convert parsed AST to filters (async for validation)
// Sorts clauses alphabetically by field name
const astToFilters = async (ast, options = {}) => {
    const entityType = ast.entityType;
    const filters = [];
    
    // Sort clauses alphabetically by field name before processing
    const sortedClauses = [...ast.clauses].sort((a, b) => {
        const fieldA = (a.field || a.value || '').toLowerCase();
        const fieldB = (b.field || b.value || '').toLowerCase();
        return fieldA.localeCompare(fieldB);
    });
    
    for (const clause of sortedClauses) {
        const clauseFilters = await clauseToFilters(entityType, clause, options);
        filters.push(...clauseFilters);
    }
    
    return {
        entityType,
        filters,
        options: ast.options || {}
    };
};

// Convert a single clause to filter(s)
const clauseToFilters = async (entityType, clause, options = {}) => {
    switch (clause.type) {
        case 'boolean':
            return booleanClauseToFilters(entityType, clause);
        case 'range':
            return rangeClauseToFilters(entityType, clause);
        case 'search':
            return searchClauseToFilters(entityType, clause);
        case 'select':
            return await selectClauseToFilters(entityType, clause, options);
        default:
            throw new Error(`Unknown clause type: ${clause.type}`);
    }
};

// Boolean clause: "it's Open Access"
const booleanClauseToFilters = (entityType, clause) => {
    // Match by displayName only (the value from "it's X")
    const config = findFacetConfigByDisplayName(entityType, clause.value);
    if (config && config.type === 'boolean') {
        return [createSimpleFilter(entityType, config.key, true, false)];
    }
    
    throw new Error(`Unknown boolean filter: "${clause.value}"`);
};

// Range clause: "year is 2023", "year ≥ 2023"
const rangeClauseToFilters = (entityType, clause) => {
    const config = findFacetConfigByDisplayName(entityType, clause.field);
    if (!config) {
        throw new Error(`Unknown range field: ${clause.field}`);
    }
    
    let value;
    if (clause.value.exact !== undefined) {
        value = String(clause.value.exact);
    } else if (clause.value.min !== undefined && clause.value.max !== undefined) {
        value = `${clause.value.min}-${clause.value.max}`;
    } else if (clause.operator === '>=' && clause.value.exact !== undefined) {
        value = `${clause.value.exact}-`;
    } else if (clause.operator === '<=' && clause.value.exact !== undefined) {
        value = `-${clause.value.exact}`;
    }
    
    return [createSimpleFilter(entityType, config.key, value, false)];
};

// Search clause: "title includes \"machine learning\""
const searchClauseToFilters = (entityType, clause) => {
    const config = findFacetConfigByDisplayName(entityType, clause.field);
    if (!config) {
        throw new Error(`Unknown search field: ${clause.field}`);
    }
    
    return [createSimpleFilter(entityType, config.key, clause.value, false)];
};

// Flatten values from AST, handling both simple values and parenthesized groups
const flattenValues = (values) => {
    const result = [];
    for (const val of values) {
        if (val.type === 'group' && val.values) {
            // Handle parenthesized group: { type: 'group', values: { items: [...], operator: 'or'/'and' } }
            const groupItems = val.values.items || [];
            for (const item of groupItems) {
                result.push({ ...item, groupOperator: val.values.operator, grouped: true });
            }
        } else {
            result.push(val);
        }
    }
    return result;
};

// Select clause: "type is article [article]", "institution is Harvard [i123]"
// Supports parenthesized groups and sorts values alphabetically by ID
const selectClauseToFilters = async (entityType, clause, options = {}) => {
    const config = findFacetConfigByDisplayName(entityType, clause.field);
    if (!config) {
        throw new Error(`Unknown field: "${clause.field}"`);
    }
    
    const entityToSelect = config.entityToSelect;
    const isNative = isNativeEntityType(entityToSelect);
    const skipValidation = options.skipValidation ?? false;
    
    // Flatten any parenthesized groups
    const flattenedValues = flattenValues(clause.values);
    
    const positiveValues = [];
    const negatedValues = [];
    
    for (const val of flattenedValues) {
        // Handle null/unknown values
        if (val.isNull) {
            if (val.negated) {
                negatedValues.push('null');
            } else {
                positiveValues.push('null');
            }
            continue;
        }
        
        // For entity select facets, ID in brackets is required
        if (!val.id && isNative) {
            throw new Error(`Entity select values require a bracketed ID. Use format: "display name [id]" or just "[id]" for field "${clause.field}"`);
        }
        
        // Validate ID exists and display name matches (if validation not skipped)
        if (val.id && !skipValidation && entityToSelect) {
            const validation = await validateEntityId(entityToSelect, val.id, val.displayName);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
        }
        
        // Use the ID as the filter value (or displayName for non-native entities without ID)
        const filterValue = val.id || val.displayName;
        
        if (val.negated) {
            negatedValues.push(filterValue);
        } else {
            positiveValues.push(filterValue);
        }
    }
    
    // Sort values alphabetically by ID
    positiveValues.sort((a, b) => a.localeCompare(b));
    negatedValues.sort((a, b) => a.localeCompare(b));
    
    const results = [];
    
    if (positiveValues.length > 0) {
        results.push(createSimpleFilter(entityType, config.key, positiveValues.join('|'), false));
    }
    
    if (negatedValues.length > 0) {
        results.push(createSimpleFilter(entityType, config.key, negatedValues.join('|'), true));
    }
    
    return results;
};

// Main parse function (async for API validation)
// Options:
//   - skipValidation: if true, skip API validation of IDs and display names
export const parseOql = async (oqlString, options = {}) => {
    if (!oqlString || typeof oqlString !== 'string') {
        throw new Error('OQL string is required');
    }
    
    try {
        const ast = oqlGrammar.parse(oqlString.trim());
        return await astToFilters(ast, options);
    } catch (e) {
        // Enhance error message with location info
        if (e.location) {
            const { line, column } = e.location.start;
            throw new Error(`Parse error at line ${line}, column ${column}: ${e.message}`);
        }
        throw e;
    }
};

// Synchronous parse without validation (for quick syntax checks)
export const parseOqlSync = (oqlString) => {
    if (!oqlString || typeof oqlString !== 'string') {
        throw new Error('OQL string is required');
    }
    
    // Just parse the grammar without async validation
    const ast = oqlGrammar.parse(oqlString.trim());
    return ast;
};

// Export for testing
export const parseOqlToAst = (oqlString) => {
    return oqlGrammar.parse(oqlString.trim());
};

// OQL Parser using Peggy
// Parses OQL strings into structured AST for conversion to URL filters

import { facetConfigs, getEntityConfigs } from '@/facetConfigs';
import { createSimpleFilter } from '@/filterConfigs';

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

// Convert parsed AST to filters
const astToFilters = (ast) => {
    const entityType = ast.entityType;
    const filters = [];
    
    for (const clause of ast.clauses) {
        const clauseFilters = clauseToFilters(entityType, clause);
        filters.push(...clauseFilters);
    }
    
    return {
        entityType,
        filters,
        options: ast.options || {}
    };
};

// Convert a single clause to filter(s)
const clauseToFilters = (entityType, clause) => {
    switch (clause.type) {
        case 'boolean':
            return booleanClauseToFilters(entityType, clause);
        case 'range':
            return rangeClauseToFilters(entityType, clause);
        case 'search':
            return searchClauseToFilters(entityType, clause);
        case 'select':
            return selectClauseToFilters(entityType, clause);
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

// Validate entity ID format: letter + digits (e.g., w123456, i33213144)
const isValidEntityId = (id) => {
    if (!id) return false;
    return /^[a-z]\d+$/i.test(id);
};

// Select clause: "type is article", "institution is Harvard [i123]"
const selectClauseToFilters = (entityType, clause) => {
    const config = findFacetConfigByDisplayName(entityType, clause.field);
    if (!config) {
        throw new Error(`Unknown field: "${clause.field}"`);
    }
    
    const positiveValues = [];
    const negatedValues = [];
    
    for (const val of clause.values) {
        // Validate entity ID format if present
        if (val.id && !isValidEntityId(val.id)) {
            throw new Error(`Invalid entity ID format: "${val.id}". Expected format: letter + digits (e.g., i33213144)`);
        }
        
        const filterValue = val.isNull ? 'null' : (val.id || val.displayName);
        
        if (val.negated) {
            negatedValues.push(filterValue);
        } else {
            positiveValues.push(filterValue);
        }
    }
    
    const results = [];
    
    if (positiveValues.length > 0) {
        results.push(createSimpleFilter(entityType, config.key, positiveValues.join('|'), false));
    }
    
    if (negatedValues.length > 0) {
        results.push(createSimpleFilter(entityType, config.key, negatedValues.join('|'), true));
    }
    
    return results;
};

// Main parse function
export const parseOql = (oqlString) => {
    if (!oqlString || typeof oqlString !== 'string') {
        throw new Error('OQL string is required');
    }
    
    try {
        const ast = oqlGrammar.parse(oqlString.trim());
        return astToFilters(ast);
    } catch (e) {
        // Enhance error message with location info
        if (e.location) {
            const { line, column } = e.location.start;
            throw new Error(`Parse error at line ${line}, column ${column}: ${e.message}`);
        }
        throw e;
    }
};

// Export for testing
export const parseOqlToAst = (oqlString) => {
    return oqlGrammar.parse(oqlString.trim());
};

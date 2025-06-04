/* global plausible */

const tracking = {
    trackSearch: (data) => {
        const countBooleanDepth = (filters) => {
            let maxDepth = 0;
            for (const filter of filters) {
                if (filter && filter.filters && Array.isArray(filter.filters)) {
                    // If this object has a filters array, recurse and add 1 to the depth
                    const childDepth = countBooleanDepth(filter.filters) + 1;
                    maxDepth = Math.max(maxDepth, childDepth);
                }
            }
            return maxDepth;
        };
        const flattenFilters = (filters) => {
            let flatFilters = [];
            for (const filter of filters) {
                if (filter && filter.filters && Array.isArray(filter.filters)) {
                    flatFilters = flatFilters.concat(flattenFilters(filter.filters));
                } else {
                    flatFilters.push(filter);
                }
            }
            return flatFilters;
        };
        const query = data.query;
        const entity = query.get_rows;
        
        const flatWorkFilters = flattenFilters(query.filter_works);
        const flatEntityFilters = flattenFilters(query.filter_aggs);
        const workFilterKeys = flatWorkFilters.map(f => f.column_id).sort();
        const entityFilterKeys = flatEntityFilters.map(f => f.column_id).sort();
        
        let filterKeys = `WORKS:${workFilterKeys.join("+")}`;
        if (entity !== "works") {
            const entityFilterKeysString = `${entity.toUpperCase()}:${entityFilterKeys.join("+")}`;
            if (workFilterKeys.length) {
                filterKeys = entityFilterKeysString + "|" + filterKeys;
            } else {
                filterKeys = entityFilterKeysString;
            }
        }
        const filterCountWorks = flatWorkFilters.length;
        const filterCountEntity = flatEntityFilters.length;
        const filterCount = filterCountWorks + filterCountEntity;

        const booleanDepth = Math.max(countBooleanDepth(query.filter_works), countBooleanDepth(query.filter_aggs));

        const queryJson = JSON.stringify(query);

        const props = {
            entity,
            filterKeys,
            filterCount,
            filterCountWorks,
            filterCountEntity,
            booleanDepth,
            queryJson,
            resultsCount: data.meta?.count,
            duration: data.timestamps?.duration,
            sql: data.redshift_sql,
        };
        //console.log("search.store plausible props", props);
        plausible('search', {props});
    },
    trackJavaScriptError(message, source, lineno, colno, error) {
        console.log("Tracking JavaScript error", message, source, lineno, colno, error);
        plausible('javascript-error', {
            props: {
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error ? error.stack : 'no stack'
            }
        });
        return false;
    },
    setupJavaScriptErrorTracking() {
        //console.log("Setting up JavaScript error tracking");
        window.onerror = (message, source, lineno, colno, error) => {
            this.trackJavaScriptError(message, source, lineno, colno, error);
        };
    },       
};

// For testing
window.generateError = function(message = "Test error") {
    console.log("Generating error...");
    setTimeout(() => {
        throw new Error(message);
    }, 0);
};

export default tracking;
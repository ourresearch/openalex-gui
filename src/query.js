import {api} from "@/api";
import {getConfigs, getColumnConfig} from "@/oaxConfigs";
import store from "@/store";

const baseQuery = (entity = 'works') => {
    let query;
    if (entity == "summary") {
        query = {
            get_rows: "summary",
            filter_works: [],
            filter_aggs: [],
            show_columns: ["sum(cited_by_count)", "mean(cited_by_count)", "mean(fwci)", "percent(is_oa)", "sum(is_oa)"],
            sort_by_column: "sum(cited_by_count)",
            sort_by_order: "desc",
        }; 
        return query;
    } 
    const config = getConfigs()[entity];    
    query = {
        get_rows: entity,
        filter_works: [],
        filter_aggs: [],
        show_columns: config.showOnTablePage,
        sort_by_column: config.sortByDefault,
        sort_by_order: config.sortDirDefault,
    };
    return query;
};

// Returns a human readable title representing `query`
const queryTitle = async (query) => {
    //console.log("making query title for", query);
    const entities = getEntitiesInQuery(query);
    //console.log("Found entities", entities);
    // Prepopulate entities cache
    await Promise.all(entities.map(async (entity) => await api.getEntity(entity)));

    const entity = query.get_rows === "summary" ? "Works Summary" : query.get_rows.titleCase();
    const worksFilterString = makeFilterGroupString(query.filter_works, "and", "works");
    const aggsFilterString = makeFilterGroupString(query.filter_aggs, "and", query.get_rows);

    if (query.get_rows == "works" || query.get_rows == "summary") {
        if (worksFilterString) {
            return `${entity} where ${worksFilterString}`;
        } else {
            if (query.get_rows == "summary") {
                return `Work Summary of all works`;
            } else {
                return `All Works`;
            }
        }        
    } else {
        if (aggsFilterString && worksFilterString) {
            return `${entity} where ${aggsFilterString} found in works where ${worksFilterString}`;
        } else if (aggsFilterString) {
            return `${entity} where ${aggsFilterString}`;
        } else if (worksFilterString) {
            return `${entity} found in works where ${worksFilterString}`;
        } else {
            return `All ${entity}`;
        }
    }
};


const makeFilterString = (filter, entity) => {
    const columnConfig = getColumnConfig(entity, filter.column_id);
    const value = getDisplayNameForValue(filter, columnConfig);
    return `${columnConfig.displayName} ${filter.operator} '${value}'`;
};


const makeFilterGroupString = (filters, joinOperator, entity) => {
    if (!filters.length) { return null; }
    const filterStrings = filters.map((filter) => {
        if (filter.filters) {
            return  `(${makeFilterGroupString(filter.filters, filter.join, entity)})`;
        } else {
            return makeFilterString(filter, entity)
        }
    });
    return filterStrings.join(` ${joinOperator} `);
};


// Returns an array of all entity IDs in `query`
const getEntitiesInQuery = (query) => {
    const entities = [];
    const walkFilters = (filters, entity) => {
        filters.forEach(filter => {
            if (filter.filters) {
                walkFilters(filter.filters, entity);
            } else {
                let columnConfig = getColumnConfig(entity, filter.column_id);
                if (columnConfig.objectEntity && !isCollectionFilter(filter)) {
                    entities.push(filter.value);
                }
            }
        });
    }
    walkFilters(query.filter_works, 'works');
    if (query.filter_aggs.length) {
        walkFilters(query.filter_aggs, query.get_rows);
    }
    return [...new Set(entities)];
};

// Helper function to determine if a filter is for a collection
const isCollectionFilter = (filter) => {
    return filter.operator === "matches any item in label" || 
           filter.operator === "matches all items in label";
};


// Get display name for a value (either from entity cache or collection)
const getDisplayNameForValue = (filter, columnConfig) => {
    if (columnConfig.objectEntity) {
        if (isCollectionFilter(filter)) {
            // Get collection name directly from the store state
            try {
                const collections = store.state.user.collections;
                const collection = collections.find(coll => coll.id === filter.value);
                return collection ? collection.name : filter.value;
            } catch (e) {
                console.error("Error getting collection:", e);
                return filter.value;
            }
        } else {
            // Get entity name from API cache
            const entity = api.getEntityFromCache(filter.value);
            return entity ? entity.display_name : filter.value;
        }
    }
    return filter.value;
};



export {
    baseQuery,
    queryTitle,
};
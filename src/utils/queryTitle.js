import {api} from "@/api";
import store from "@/store";
import filters from "@/filters";
import {getColumnConfig} from "@/oaxConfigs";
import {isCollectionFilter} from "@/query";

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

const makeFilterString = (filter, entity) => {
    const columnConfig = getColumnConfig(entity, filter.column_id);
    const value = getDisplayNameForValue(filter, columnConfig);
    return `${columnConfig.displayName} ${filter.operator || columnConfig.defaultOperator} '${value}'`;
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


// Returns a human readable title representing `query`
const queryTitle = async (query) => {
    //console.log("making query title for", query);
    const entities = getEntitiesInQuery(query);
    //console.log("Found entities", entities);
    // Prepopulate entities cache
    await Promise.all(entities.map(async (entity) => await api.getEntity(entity)));

    const entity = query.get_rows === "summary" ? "Works Summary" : filters.titleCase(query.get_rows);
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

export {
    queryTitle,
};

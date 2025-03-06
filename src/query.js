import {api} from "@/api";
import {getConfigs, getColumnConfig} from "@/oaxConfigs";


const baseQuery = (entity = 'works') => {
    let query;
    if (entity == "summary") {
        query = {
            get_rows: "summary",
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
    const value = columnConfig.objectEntity ? api.getEntityFromCache(filter.value).display_name : filter.value;
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
                if (columnConfig.objectEntity) {
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

export {
    baseQuery,
    queryTitle,
};
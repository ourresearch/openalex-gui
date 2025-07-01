import _ from "lodash"
import {getConfigs, getColumnConfig} from "@/oaxConfigs";

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

const makeUnderlyingWorksQuery = (query) => {
    const worksQuery = {
        ...baseQuery("works"),
        get_rows: query.get_rows,
        filter_works: _.cloneDeep(query.filter_works),
        filter_aggs: _.cloneDeep(query.filter_aggs),
        show_underlying_works: true,
    };
    return worksQuery;
};

const areCoreQuriesEqual = (query1, query2) => {
    // Returns true if queries are equal in get_rows, filter_works, filter_aggs
    const [q1, q2] = [query1, query2].map(q => {
        return {
            get_rows: q.get_rows,
            filter_works: _.cloneDeep(q.filter_works),
            filter_aggs: _.cloneDeep(q.filter_aggs),
        };
    });
    const areEqual = _.isEqual(q1, q2);
    return areEqual;
};

const getLabelsInQuery = (query) => {
    const labels = [];
    const walkFilters = (filters, entity) => {
        filters.forEach(filter => {
            if (filter.filters) {
                walkFilters(filter.filters, entity);
            } else {
                let columnConfig = getColumnConfig(entity, filter.column_id);
                if (columnConfig.objectEntity && isCollectionFilter(filter)) {
                    labels.push(filter.value);
                }
            }
        });
    }
    walkFilters(query.filter_works, 'works');
    if (query.filter_aggs.length) {
        walkFilters(query.filter_aggs, query.get_rows);
    }
    return [...new Set(labels)];
};

// Helper function to determine if a filter is for a collection
const isCollectionFilter = (filter) => {
    return filter.operator === "matches any item in label" || 
           filter.operator === "matches all items in label";
};

export {
    baseQuery,
    makeUnderlyingWorksQuery,
    areCoreQuriesEqual,
    getLabelsInQuery,
    isCollectionFilter,
};
import { RouteLocationNormalizedLoaded, Router, useRouter, useRoute } from 'vue-router';
import {
  filtersAsUrlStr,
  filtersFromUrlStr,
  createSimpleFilter,
  deleteOptionFromFilterValue,
  optionsFromString,
  addOptionToFilterValue,
  toggleOptionIsNegated,
  getMatchModeFromSelectFilterValue,
  optionsToString
} from './filterConfigs';
import { getEntityConfig } from '@/entityConfigs';
import { shortenOpenAlexId } from './util';
import { getActionConfig, getActionDefaultsStr, getActionDefaultValues } from '@/actionConfigs';
import { getFacetConfig } from '@/facetConfigs';

const router = useRouter();
const route = useRoute();

interface UrlObject {
  name: string;
  params: Record<string, any>;
  query: Record<string, any>;
}

interface Filter {
  key: string;
  value: string;
  isNegated?: boolean;
}

type Filters = Filter[];

const urlObjectFromSearchUrl = (searchUrl: string): UrlObject => {
  const query = Object.fromEntries(new URL(searchUrl).searchParams);
  const entityType = 'works'; // hardcoded for now
  return {
    name: 'Serp',
    params: {
      entityType,
    },
    query,
  };
};

const pushToRoute = async (router: Router, newRoute: UrlObject) => {
  console.log('🚀 ~ pushToRoute ~ newRoute:', newRoute);
  try {
    await router.push(newRoute);
  } catch (e: any) {
    if (e.name !== 'NavigationDuplicated') {
      throw e;
    }
  }
};

const replaceToRoute = async (router: Router, newRoute: UrlObject) => {
  try {
    await router.replace(newRoute);
  } catch (e: any) {
    if (e.name !== 'NavigationDuplicated') {
      throw e;
    }
  }
};

const pushSearchUrlToRoute = async (router: Router, searchUrl: string) => {
  await pushToRoute(router, urlObjectFromSearchUrl(searchUrl));
};

const addToQuery = (oldQuery: Record<string, any>, k: string, v: any): Record<string, any> => {
  return { ...oldQuery, [k]: v };
};

const pushQueryParam = (key: string, value: any) => {
  const query = { ...route.query, [key]: value };
  pushToRoute(router, { name: 'Serp', query });
};

const replaceQueryParam = (key: string, value: any) => {
  const query = { ...route.query, [key]: value };
  replaceToRoute(router, { name: 'Serp', query });
};

const nameFromUrl = (myUrl: string): string => {
  const urlObj = new URL(myUrl);
  return urlObj.searchParams.get('name') ?? 'Unsaved search';
};

const setUrlName = (myUrl: string, name: string): string => {
  const urlObj = new URL(myUrl);
  urlObj.searchParams.set('name', name);
  return urlObj.toString();
};

const setPage = async (page: number) => {
  const query = { ...route.query, page };
  return await pushToRoute(router, { name: 'Serp', query });
};

const pushNewFilters = async (newFilters: Filters, entityType?: string) => {
  const filter = newFilters.length ? filtersAsUrlStr(newFilters) : undefined;
  entityType = entityType ?? (route.params.entityType as string) ?? 'works';

  const query = { ...route.query, page: 1, filter, sort: undefined };
  const newRoute = { name: 'Serp', params: { entityType }, query };
  return await pushToRoute(router, newRoute);
};

const createFilter = async (entityType: string, key: string, newValue: string) => {
  const newFilters = createFilterNoPush(entityType, key, newValue);
  return await pushNewFilters(newFilters, entityType);
};

const createFilterNoPush = (entityType: string, key: string, newValue: string): Filters => {
  const oldFilters = filtersFromUrlStr(entityType, route.query.filter as string);
  const newFilter = createSimpleFilter(entityType, key, newValue);
  return [...oldFilters, newFilter];
};

const readFilter = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, index: number) => {
  return filtersFromUrlStr(entityType, currentRoute.query.filter as string)[index];
};

const readFilters = (currentRoute: RouteLocationNormalizedLoaded, isNegatedOnly = false): Filters => {
  if (!currentRoute) return [];
  const filters = filtersFromUrlStr(currentRoute.params?.entityType as string, currentRoute.query?.filter as string);
  return isNegatedOnly ? filters.filter((f) => f.value[0] === '!') : filters;
};

const readFiltersLength = (): number => {
  const entityType = route.params.entityType as string;
  const filters = filtersFromUrlStr(entityType, route.query.filter as string);
  return filters.length;
};

const readFilterValue = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, index: number): string | undefined => {
  return readFilter(currentRoute, entityType, index)?.value;
};

const isFilterApplied = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, index: number): boolean => {
  const filterValue = readFilterValue(currentRoute, entityType, index);
  return filterValue !== '' && filterValue !== undefined && filterValue !== null;
};

const isFilterKeyApplied = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, filterKey: string): boolean => {
  const myFilters = readFilters(currentRoute);
  const myFilterKeys = myFilters.map(f => f.key);
  return myFilterKeys.includes(filterKey);
};

const isSearchFilterApplied = (currentRoute: RouteLocationNormalizedLoaded): boolean => {
  return currentRoute.query?.filter?.toString().split(',').some(f => {
    return f.split(':')[0]?.includes('.search');
  });
};

const isFilterKeyAvailableToCreate = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, filterKey: string): boolean => {
  const config = getFacetConfig(entityType, filterKey);
  return config.type === 'select' || !isFilterKeyApplied(currentRoute, entityType, filterKey);
};

const updateFilter = async (entityType: string, index: number, newValue: string, isNegated: boolean): Promise<void> => {
  const filters = filtersFromUrlStr(entityType, route.query.filter as string);
  filters[index] = createSimpleFilter(entityType, filters[index].key, newValue, isNegated);
  await pushNewFilters(filters);
};

const deleteFilterOption = async (entityType: string, index: number, optionToDelete: string): Promise<void> => {
  const filters = readFilters(route);
  const myFilter = readFilter(route, entityType, index);
  const isMyFilterNegated = readIsFilterNegated(route, entityType, index);

  const myFilterKey = myFilter.key;
  const myFilterValue = myFilter.value;

  const newValue = deleteOptionFromFilterValue(myFilterValue, optionToDelete);
  if (newValue) {
    filters[index] = createSimpleFilter(entityType, myFilterKey, newValue, isMyFilterNegated);
  } else {
    filters.splice(index, 1);
  }
  await pushNewFilters(filters);
};

const deleteFilterOptionByKey = async (entityType: string, filterKey: string, optionToDelete: string): Promise<void> => {
  const filters = readFilters(route);
  const newFilters = filters
    .map(f => {
      const newValue = deleteOptionFromFilterValue(f.value, optionToDelete);
      return createSimpleFilter(entityType, f.key, newValue);
    })
    .filter(f => f.value !== '' && f.value !== undefined);

  await pushNewFilters(newFilters);
};

const addFilterOption = async (entityType: string, index: number, optionToAdd: string): Promise<void> => {
  const newFilters = addFilterOptionNoPush(entityType, index, optionToAdd);
  await pushNewFilters(newFilters);
};

const addFilterOptionNoPush = (entityType: string, index: number, optionToAdd: string): any[] => {
  const filters = filtersFromUrlStr(entityType, route.query.filter as string);
  const myFilter = filters[index];
  filters[index] = createSimpleFilter(
    entityType,
    myFilter.key,
    addOptionToFilterValue(myFilter.value, optionToAdd),
    myFilter.isNegated
  );
  return filters;
};

const moveFilterOptionToOwnFilter = (entityType: string, index: number, option: string, isNegated: boolean): void => {
  const myFilter = readFilter(route, entityType, index);
  const myNewFilter = createSimpleFilter(entityType, myFilter.key, option, isNegated);
  const oldFilters = readFilters(route);
  oldFilters[index] = createSimpleFilter(
    entityType,
    oldFilters[index].key,
    deleteOptionFromFilterValue(oldFilters[index].value, option),
    oldFilters[index].isNegated
  );

  const newFilters = [...oldFilters, myNewFilter];
  pushNewFilters(newFilters);
};

const setIsFilterOptionNegated = (entityType: string, filterKey: string, option: string, isNegated: boolean): void => {
  const myFilterIndex = findFilterIndex(route, entityType, filterKey, option);
  const myFilter = readFilter(route, entityType, myFilterIndex);
  const myFilterOptionsCount = optionsFromString(myFilter.value).length;
  if (myFilterOptionsCount === 1) {
    setIsFilterNegated(entityType, myFilterIndex, isNegated);
  } else {
    moveFilterOptionToOwnFilter(entityType, myFilterIndex, option, isNegated);
  }
};

const setIsFilterNegated = (entityType: string, index: number, isNegated: boolean): void => {
  const myValue = readFilter(route, entityType, index)?.value;
  updateFilter(entityType, index, myValue, isNegated);
};

const readIsFilterNegated = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, index: number): boolean | undefined => {
  const myFilter = readFilter(currentRoute, entityType, index);
  return myFilter?.isNegated;
};

const findFilterIndex = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, filterKey: string, option: string): number => {
  const filters = readFilters(currentRoute);
  return filters.findIndex(f => f.key === filterKey && optionsFromString(f.value).includes(option));
};

const toggleFilterOptionIsNegated = async (entityType: string, key: string, option: string): Promise<void> => {
  const oldFilters = filtersFromUrlStr(entityType, route.query.filter as string);
  const newFilters = oldFilters.map(oldFilter => {
    const newValue = oldFilter.key === key ? toggleOptionIsNegated(oldFilter.value, option) : oldFilter.value;
    return createSimpleFilter(entityType, oldFilter.key, newValue);
  });
  await pushNewFilters(newFilters);
};
const createFilterOptions = (filter: { entityId: string; value: string }): string[] => {
  const entityConfig = getEntityConfig(filter.entityId);
  const filterNamespace = entityConfig && !entityConfig.isNative ? `${filter.entityId}/` : undefined;

  return optionsFromString(filter.value).map(o => {
    const appendToFilterOption = filterNamespace && !o.includes('/') ? filterNamespace : '';
    return appendToFilterOption + o;
  });
};

const readFilterOptions = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, index: number): string[] => {
  const filter = readFilter(currentRoute, entityType, index);
  return filter ? createFilterOptions(filter) : [];
};

const isFilterOptionApplied = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, filterKey: string, option: string): boolean => {
  return readFilterOptionsByKey(currentRoute, entityType, filterKey).includes(option);
};

const readFilterOptionsByKey = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, filterKey: string, isNegatedOnly = false): string[] => {
  const allFilters = readFilters(currentRoute, isNegatedOnly);
  const config = getFacetConfig(entityType, filterKey);
  if (config.type !== 'select') return [];

  const filtersWithKey = allFilters.filter(f => f.key === filterKey);
  return filtersWithKey.length ? filtersWithKey.flatMap(f => optionsFromString(f.value)) : [];
};

const readFilterMatchMode = (currentRoute: RouteLocationNormalizedLoaded, entityType: string, key: string): string | undefined => {
  const filter = readFilter(currentRoute, entityType, key);
  return filter ? getMatchModeFromSelectFilterValue(filter.value) : undefined;
};

const setFilterMatchMode = (entityType: string, key: string, mode: string): void => {
  const filter = readFilter(route, entityType, key);
  const options = optionsFromString(filter.value);
  const newValue = optionsToString(options, mode);
  upsertFilter(entityType, key, newValue);
};

const isGroupBy = (): boolean => {
  return !!route.query.group_by;
};

const updateOrDeleteFilter = (entityType: string, index: number, filterValue: string): void => {
  if (filterValue === '' || filterValue === '-') {
    deleteFilter(entityType, index);
  } else {
    updateFilter(entityType, index, filterValue);
  }
};

const upsertFilter = (entityType: string, index: number, filterValue: string): void => {
  if (isFilterApplied(route, entityType, index)) {
    updateOrDeleteFilter(entityType, index, filterValue);
  } else {
    createFilter(entityType, index, filterValue);
  }
};

const upsertFilterOption = (entityType: string, index: number, filterOption: string): void => {
  if (isFilterApplied(route, entityType, index)) {
    addFilterOption(entityType, index, filterOption);
  } else {
    upsertFilter(entityType, index, filterOption);
  }
};

const upsertFilterOptionNoPush = (entityType: string, index: number, filterOption: string): any[] => {
  const isExtant = isFilterApplied(route, entityType, index);
  return isExtant ? addFilterOptionNoPush(entityType, index, filterOption) : createFilterNoPush(entityType, index, filterOption);
};

const deleteFilter = async (entityType: string, index: number): Promise<void> => {
  const oldFilters = filtersFromUrlStr(entityType, route.query.filter as string);
  await pushNewFilters(oldFilters.toSpliced(index, 1));
};

const deleteAllFilters = async (): Promise<void> => {
  await pushNewFilters([]);
};

const makeFilterRoute = (entityType: string, key: string, value: string) => {
  const newFilter = createSimpleFilter(entityType, key, value);
  return {
    name: 'Serp',
    params: { entityType },
    query: {
      page: 1,
      sort: route.query.sort,
      search: route.query.search,
      filter: filtersAsUrlStr([newFilter]),
      is_list_view: route.query.is_list_view,
    }
  };
};

const setSearch = (entityType: string, searchString: string): void => {
  const newRoute = {
    name: 'Serp',
    params: { entityType },
    query: { search: searchString },
  };
  pushToRoute(router, newRoute);
};

const setDefaultActions = (): void => {
  pushToRoute(router, {
    name: 'Serp',
    query: {
      sort: getActionDefaultsStr('sort', route.query),
      column: getActionDefaultsStr('column', route.query),
    }
  });
};

const getActionValues = (action: string): string[] => {
  const val = route.query[action];
  return val ? val.split(',').filter(Boolean) : [];
};

const getActionValueKeys = (currentRoute: RouteLocationNormalizedLoaded, action: string): string[] => {
  const val = currentRoute.query[action];
  return val
    ? val.split(',').filter(Boolean).map(v => (v.includes(':') ? v.split(':')[0] : v))
    : [];
};

const getDefaultSortValueForRoute = (currentRoute: RouteLocationNormalizedLoaded): string => {
  return isSearchFilterApplied(currentRoute)
    ? 'relevance_score'
    : currentRoute.params.entityType === 'works'
    ? 'cited_by_count'
    : 'works_count';
};

const setSortNoPush = (sortByKey: string, route: RouteLocationNormalizedLoaded) => {
  const defaultValue = getDefaultSortValueForRoute(route);
  const appendVerb = sortByKey === 'display_name' ? '' : ':desc';
  const myNewKey = sortByKey === defaultValue ? undefined : `${sortByKey}${appendVerb}`;

  return {
    name: 'Serp',
    query: {
      ...route.query,
      sort: myNewKey,
      page: 1,
    }
  };
};

const setSort = (filterKey: string): void => {
  pushToRoute(router, setSortNoPush(filterKey, route));
};

const getSort = (currentRoute: RouteLocationNormalizedLoaded): string => {
  const defaultValue = getDefaultSortValueForRoute(route);
  return currentRoute.query.sort?.replace(':desc', '') ?? defaultValue;
};

const toggleSort = (filterKey: string): void => {
  const currentSort = getSort(route);
  if (currentSort === filterKey) {
    setSort(undefined);
  } else {
    setSort(filterKey);
  }
};

const perPageDefault = 10;

const setPerPage = (val: number): void => {
  const perPage = val === perPageDefault ? undefined : val;
  pushToRoute(router, {
    name: 'Serp',
    query: { ...route.query, page: 1, per_page: perPage }
  });
};

const getPerPage = (currentRoute: RouteLocationNormalizedLoaded): number => {
  return parseInt(currentRoute.query.per_page as string) || perPageDefault;
};

const setColumn = (filterKeys: string[]): void => {
  pushQueryParam('column', filterKeys.join(','));
};

const addColumn = (filterKey: string): void => {
  const extantKeys = getColumn(route);
  const newKeys = [...extantKeys, filterKey];
  pushQueryParam('column', newKeys.join(','));
};

const toggleColumn = (filterKey: string): void => {
  const extantKeys = getColumn(route);
  const newKeys = extantKeys.includes(filterKey)
    ? extantKeys.filter(k => k !== filterKey)
    : [...extantKeys, filterKey];
  pushQueryParam('column', newKeys.join(','));
};

const getColumn = (route: RouteLocationNormalizedLoaded): string[] => {
  return route.query.column ? route.query.column.split(',') : [];
};

const viewConfigs = [
  { id: 'list', icon: 'mdi-format-list-checkbox', displayName: 'Results list', isDefault: true },
  { id: 'report', icon: 'mdi-clipboard-outline', displayName: 'Stats', isDefault: true },
  { id: 'api', icon: 'mdi-api', displayName: 'Api query', isDefault: false },
];

const defaultViewIds = viewConfigs.filter(v => v.isDefault).map(v => v.id).sort();

const isViewDefault = (viewIds: string[]): boolean => {
  return viewIds.sort().join(',') === defaultViewIds.join(',');
};

const getView = (route: RouteLocationNormalizedLoaded): string[] => {
  return route.query.view ? route.query.view.split(',') : defaultViewIds;
};

const isViewSet = (route: RouteLocationNormalizedLoaded, viewId: string): boolean => {
  return getView(route).includes(viewId);
};

const setView = (viewIds: string[]): void => {
  const unsetViewParam = !viewIds.length || isViewDefault(viewIds);
  const newViewValue = unsetViewParam ? undefined : viewIds.join(',');
  pushQueryParam('view', newViewValue);
};


const toggleView = (viewId: string): void => {
  const selectedViewIds = getView(route);
  const newViewIds = selectedViewIds.includes(viewId)
    ? selectedViewIds.filter(id => id !== viewId) // remove it
    : [...selectedViewIds, viewId]; // add it
  setView(newViewIds);
};

const getGroupBy = (route: RouteLocationNormalizedLoaded): string[] => {
  const defaultValue = getEntityConfig(route.params.entityType as string)?.groupByDefaults || [];
  return route.query.group_by ? route.query.group_by.split(',') : defaultValue;
};

const setGroupBy = (filterKeys: string[]): void => {
  pushQueryParam('group_by', filterKeys.join(','));
};

const addGroupBy = (filterKey: string): void => {
  const extantKeys = getGroupBy(route);
  const newKeys = [...extantKeys, filterKey];
  pushQueryParam('group_by', newKeys.join(','));
};

const deleteGroupBy = (filterKey: string): void => {
  const extantKeys = getGroupBy(route);
  const newKeys = extantKeys.filter(k => k !== filterKey);
  pushQueryParam('group_by', newKeys.join(','));
};

const toggleGroupBy = (filterKey: string): void => {
  const extantKeys = getGroupBy(route);
  const newKeys = extantKeys.includes(filterKey)
    ? extantKeys.filter(k => k !== filterKey)
    : [...extantKeys, filterKey];
  pushQueryParam('group_by', newKeys.join(','));
};

const setActionValueKeys = (actionName: string, keys: string[]): void => {
  console.log('url.setActionValueKeys', actionName, keys);
  const actionConfig = getActionConfig(actionName);

  const keysArray = Array.isArray(keys) ? keys : [keys];

  let newValues = keysArray.map(k => k + (actionConfig?.appendToValues || ''));
  if (actionName === 'sort' && newValues.length === 0) {
    newValues = getActionDefaultValues(actionName, route.query).map(
      v => v + (actionConfig?.appendToValues || '')
    );
  }

  const query = {
    ...route.query,
    [actionName]: newValues.join(',')
  };
  console.log('url.setActionValueKeys query', query);

  pushToRoute(router, {
    name: 'Serp',
    query,
  });
};

const addActionKey = (actionName: string, actionKey: string): void => {
  const current = getActionValueKeys(route, actionName);
  console.log('addActionKey', current);
  setActionValueKeys(actionName, [...current, actionKey]);
};

const deleteActionKey = (actionName: string, actionKey: string): void => {
  const current = getActionValueKeys(route, actionName);
  console.log('deleteActionKey', actionName, actionKey);
  const newKeys = current.filter(k => k !== actionKey);
  setActionValueKeys(actionName, newKeys);
};

const setSidebar = (id: string): void => {
  const shortId = shortenOpenAlexId(id);
  console.log('setSidebar', shortId);
  pushToRoute(router, {
    name: 'Serp',
    query: {
      ...route.query,
      sidebar: shortId
    }
  });
};

const makeAutocompleteUrl = (entityId: string, searchString: string): string => {
  const url = new URL(`https://api.openalex.org`);
  url.pathname = entityId ? `autocomplete/${entityId}` : 'autocomplete';
  url.searchParams.set('q', searchString);
  url.searchParams.set('mailto', 'team@ourresearch.org');
  return url.toString();
};

const makeApiUrl = (
  currentRoute: RouteLocationNormalizedLoaded,
  formatCsv: boolean,
  groupBy: string | undefined
): string => {
  const entityType = currentRoute.params.entityType as string;
  const filtersFromUrl = filtersFromUrlStr(entityType, currentRoute.query.filter as string);
  const filterString = filtersAsUrlStr(filtersFromUrl);

  const query: Record<string, string | boolean | undefined> = {
    filter: filterString,
  };

  if (formatCsv) {
    query.format = 'csv';
  }
  if (groupBy) {
    query.group_by = groupBy;
  } else {
    query.page = currentRoute.query.page as string;
    query.sort = currentRoute.query.sort as string;
    query.per_page = currentRoute.query.per_page as string;
    query.apc_sum = currentRoute.query.group_by?.split(',').includes('apc_sum') || false;
    query.cited_by_count_sum = currentRoute.query.group_by?.split(',').includes('cited_by_count_sum') || false;
  }

  const apiUrl = new URL('https://api.openalex.org');
  apiUrl.pathname = entityType;

  const validQueryKeys = [
    'page', 'filter', 'group_by', 'sort', 'format', 'per_page', 'apc_sum', 'cited_by_count_sum'
  ];

  const searchParams = new URLSearchParams();
  validQueryKeys.forEach(key => {
    if (query[key] !== undefined && query[key] !== '') {
      searchParams.set(key, query[key].toString());
    }
  });

  apiUrl.search = decodeURIComponent(searchParams.toString());
  return apiUrl.toString();
};

const setShowApi = (val: boolean): void => {
  pushQueryParam("show_api", val ? "true" : undefined);
};

const setHideResults = (val: boolean): void => {
  const urlVal = val ? "true" : undefined;
  pushQueryParam("hide_results", urlVal);
};

const setSerpTabName = (val: string): void => {
  pushQueryParam("name", val);
};


const makeGroupByUrl = (
  entityType: string,
  groupByKey: string,
  options: {
    searchString?: string | null;
    perPage?: number;
    formatCsv?: boolean;
    includeEmail?: boolean;
    filters?: any[];
    isMultipleGroups?: boolean;
  } = {}
): string => {
  const defaults = {
    searchString: null,
    perPage: 200,
    formatCsv: false,
    includeEmail: true,
    filters: [],
    isMultipleGroups: false,
  };
  options = { ...defaults, ...options };

  const url = new URL(`https://api.openalex.org`);
  url.pathname = entityType;
  if (options.isMultipleGroups) {
    url.searchParams.set('group_bys', groupByKey);
  } else {
    url.searchParams.set('group_by', groupByKey);
  }

  url.searchParams.set('per_page', String(options.perPage));
  if (options.searchString) url.searchParams.set('q', options.searchString);
  if (options.formatCsv) url.searchParams.set('format', 'csv');
  if (options.includeEmail) url.searchParams.set('mailto', 'team@ourresearch.org');

  if (options.filters.length > 0) {
    url.search = url.search + '&filter=' + filtersAsUrlStr(options.filters);
  }

  return url.toString();
};

const setZoom = (val: string): void => {
  pushQueryParam("zoom", val);
};

const getZoom = (currentRoute: ReturnType<typeof useRoute>): string | undefined => {
  return currentRoute.query.zoom as string | undefined;
};


const url = {
    pushToRoute,
    pushSearchUrlToRoute,
    addToQuery,
    urlObjectFromSearchUrl,

    createFilter,
    createFilterNoPush,
    readFilter,
    readFilters,
    readFiltersLength,
    isSearchFilterApplied,
    isFilterOptionApplied,
    readFilterOptionsByKey,
    readFilterValue,
    readFilterOptions,
    readFilterMatchMode,

    isFilterApplied,
    isFilterKeyAvailableToCreate,
    updateFilter,
    updateOrDeleteFilter,
    deleteFilter,
    deleteAllFilters,
    upsertFilter,
    upsertFilterOption,
    upsertFilterOptionNoPush,
    setFilterMatchMode,
    makeFilterRoute,
    pushNewFilters,


    deleteFilterOption,
    deleteFilterOptionByKey,
    addFilterOption,
    toggleFilterOptionIsNegated,

    readIsFilterNegated,
    setIsFilterNegated,
    setIsFilterOptionNegated,
    findFilterIndex,

    setDefaultActions,
    getActionValues,
    getActionValueKeys,
    setActionValueKeys,
    addActionKey,
    deleteActionKey,

    setSort,
    setGroupBy,
    toggleGroupBy,
    deleteGroupBy,
    setColumn,
    addColumn,
    toggleColumn,

    getPerPage,
    setPerPage,

    getSort,
    toggleSort,
    getGroupBy,
    getColumn,
    addGroupBy,


    setSidebar,


    setSearch,
    setPage,

    isGroupBy,


    makeGroupByUrl,
    makeAutocompleteUrl,

    makeApiUrl,
    setShowApi,
    setHideResults,

    setSerpTabName,

    pushQueryParam,
    replaceQueryParam,

    nameFromUrl,
    setUrlName,

    viewConfigs,
    isViewSet,
    toggleView,

    setZoom,
    getZoom,
}


export {
    url,
}

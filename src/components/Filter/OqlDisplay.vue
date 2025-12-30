<template>
  <div class="oql-display">
    <!-- Display Mode -->
    <div v-if="!isEditing" class="oql-display-mode">
      <v-card variant="outlined" class="bg-white pa-3">
        <div class="oql-text">
          <!-- First line: entity where first-clause (+ semicolon if only clause and has params) -->
          <div class="oql-line">
            <span class="oql-value">{{ entityDisplayName }}</span>
            <template v-if="clauses.length > 0">
              <span class="oql-syntax"> where </span>
              <oql-clause :clause="clauses[0]" />
              <span v-if="clauses.length === 1 && params.length > 0" class="oql-syntax">;</span>
            </template>
          </div>
          
          <!-- Subsequent clauses, each on own line with "and" -->
          <div 
            v-for="(clause, idx) in clauses.slice(1)" 
            :key="idx" 
            class="oql-line oql-indent"
          >
            <span class="oql-syntax">and </span>
            <oql-clause :clause="clause" />
            <span v-if="idx === clauses.length - 2 && params.length > 0" class="oql-syntax">;</span>
          </div>
          
          <!-- Params, each on own line -->
          <div 
            v-for="(param, idx) in params" 
            :key="'param-' + idx" 
            class="oql-line"
          >
            <oql-param :param="param" /><span class="oql-syntax">;</span>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Edit Mode -->
    <div v-else class="oql-edit-mode">
      <v-card variant="outlined" class="bg-white pa-3">
        <v-textarea
          v-model="editText"
          :error="!!parseError"
          :error-messages="parseError"
          variant="outlined"
          rows="6"
          auto-grow
          placeholder="Enter OQL query..."
          class="oql-textarea"
          hide-details="auto"
          @keydown="handleEditKeydown"
        />
        <div class="d-flex justify-end mt-2 ga-2">
          <v-btn
            variant="text"
            @click="cancelEditing"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="applyOql"
            :disabled="!!parseError"
          >
            Apply
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { oqlToRoute, validateOql } from '@/oql';
import { url } from '@/url';
import { filtersFromUrlStr } from '@/filterConfigs';
import { shortenOpenAlexId } from '@/util';
import { getEntityConfig } from '@/entityConfigs';
import { api } from '@/api';
import OqlClause from '@/components/Filter/OqlClause.vue';
import OqlParam from '@/components/Filter/OqlParam.vue';

const route = useRoute();
const router = useRouter();

const isEditing = ref(false);
const editText = ref('');
const parseError = ref('');

// Cache for fetched display names
const displayNameCache = reactive({});

const entityType = computed(() => route.params?.entityType || 'works');

const entityDisplayName = computed(() => {
  const config = getEntityConfig(entityType.value);
  const name = config?.displayName || entityType.value;
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const filters = computed(() => {
  return filtersFromUrlStr(entityType.value, route.query?.filter) || [];
});

// Track cache version to force re-computation when display names are fetched
const cacheVersion = ref(0);

const clauses = computed(() => {
  // Depend on cacheVersion to re-compute when cache updates
  const _ = cacheVersion.value;
  
  // Group filters by key to combine same-key filters into single clauses
  const filtersByKey = {};
  for (const filter of filters.value) {
    const key = filter.key;
    if (!filtersByKey[key]) {
      filtersByKey[key] = [];
    }
    filtersByKey[key].push(filter);
  }
  
  // Build clauses, combining filters with same key
  const result = [];
  for (const key of Object.keys(filtersByKey)) {
    const filtersForKey = filtersByKey[key];
    if (filtersForKey.length === 1) {
      result.push(buildClause(filtersForKey[0]));
    } else {
      result.push(buildCombinedClause(filtersForKey));
    }
  }
  
  return result;
});

const params = computed(() => {
  const result = [];
  
  if (route.query?.sort) {
    const sortKey = route.query.sort.replace(':desc', '').replace(':asc', '');
    result.push({ type: 'sort', value: sortKey });
  }
  
  if (route.query?.sample) {
    result.push({ type: 'sample', value: route.query.sample });
  }
  
  if (route.query?.group_by) {
    result.push({ type: 'group_by', value: route.query.group_by });
  }
  
  if (route.query?.include_xpac === 'true') {
    result.push({ type: 'include_xpac' });
  }
  
  return result;
});

const getEntityTypeFromId = (id) => {
  const prefix = id.charAt(0).toLowerCase();
  const prefixMap = {
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
  return prefixMap[prefix] || 'works';
};

const buildClause = (filter) => {
  const clause = {
    type: filter.type,
    key: filter.key,
    displayName: filter.displayName || filter.key,
    value: filter.value,
  };
  
  switch (filter.type) {
    case 'boolean':
      return buildBooleanClause(filter, clause);
    case 'range':
      return buildRangeClause(filter, clause);
    case 'search':
      return buildSearchClause(filter, clause);
    case 'selectEntity':
      return buildSelectClause(filter, clause);
    default:
      clause.displayValue = filter.value;
      return clause;
  }
};

const buildBooleanClause = (filter, clause) => {
  const boolVal = filter.value === 'true' || filter.value === true;
  const displayName = filter.displayName || filter.key;
  clause.displayValue = boolVal ? displayName : `not ${displayName}`;
  return clause;
};

const buildRangeClause = (filter, clause) => {
  const value = filter.value;
  if (!value) {
    clause.operator = '=';
    clause.displayValue = '?';
    return clause;
  }
  
  const rangeMatch = String(value).match(/^(\d*)-(\d*)$/);
  if (rangeMatch) {
    const [, min, max] = rangeMatch;
    if (min && max) {
      clause.operator = 'is';
      clause.displayValue = `${min}–${max}`;
    } else if (min && !max) {
      clause.operator = '≥';
      clause.displayValue = min;
    } else if (!min && max) {
      clause.operator = '≤';
      clause.displayValue = max;
    }
  } else {
    clause.operator = 'is';
    clause.displayValue = value;
  }
  return clause;
};

const buildSearchClause = (filter, clause) => {
  clause.operator = 'includes';
  return clause;
};

const buildSelectClause = (filter, clause) => {
  const isNegated = filter.isNegated;
  const rawValues = String(filter.value).split(/[|+]/);
  const isOr = String(filter.value).includes('|');
  
  // Build values array with negation info
  clause.values = rawValues.map(v => {
    const val = buildSelectValue(v, filter);
    val.isNegated = isNegated;
    return val;
  });
  
  // Determine operator - first value determines initial operator
  clause.operator = isNegated ? 'is not' : 'is';
  
  // Connector is always 'and' for display, but we show 'not' before negated values
  // For OR within positive values, use 'or'
  if (!isNegated && isOr) {
    clause.connector = 'or';
  } else {
    clause.connector = 'and';
  }
  
  return clause;
};

const buildCombinedClause = (filtersForKey) => {
  // Combine multiple filters with same key into one clause
  // Separate positive and negated values
  const firstFilter = filtersForKey[0];
  
  const clause = {
    type: firstFilter.type,
    key: firstFilter.key,
    displayName: firstFilter.displayName || firstFilter.key,
  };
  
  const positiveValues = [];
  const negatedValues = [];
  
  for (const filter of filtersForKey) {
    const rawValues = String(filter.value).split(/[|+]/);
    for (const v of rawValues) {
      const val = buildSelectValue(v, filter);
      if (filter.isNegated) {
        val.isNegated = true;
        negatedValues.push(val);
      } else {
        val.isNegated = false;
        positiveValues.push(val);
      }
    }
  }
  
  // Combine: positive values first, then negated values
  clause.values = [...positiveValues, ...negatedValues];
  
  // Determine operator based on first value
  if (positiveValues.length > 0) {
    clause.operator = 'is';
  } else {
    clause.operator = 'is not';
  }
  
  clause.connector = 'and';
  clause.hasMixedNegation = positiveValues.length > 0 && negatedValues.length > 0;
  
  return clause;
};

const buildSelectValue = (value, filter) => {
  if (value === 'null' || value === 'unknown') {
    return { displayValue: 'unknown', shortId: null, entityType: null };
  }
  
  const shortId = shortenOpenAlexId(value);
  const isNative = filter.isNative !== false && shortId && /^[a-zA-Z]\d+$/.test(shortId);
  
  // Get display value from filter if available, or from cache
  const displayValue = filter.displayValue || filter.displayValues?.[value] || displayNameCache[value];
  
  if (isNative && shortId) {
    // Queue lookup if we don't have a display name yet
    if (!displayValue && !displayNameCache[value]) {
      fetchDisplayName(value, getEntityTypeFromId(shortId));
    }
    
    return {
      displayValue: displayValue || null,
      shortId: shortId,
      entityType: getEntityTypeFromId(shortId),
    };
  }
  
  // For non-native entities, strip the prefix (e.g., "types/article" -> "article")
  let cleanValue = displayValue || value;
  if (cleanValue.includes('/')) {
    cleanValue = cleanValue.split('/').pop();
  }
  
  return {
    displayValue: cleanValue,
    shortId: null,
    entityType: null,
  };
};

const fetchDisplayName = async (fullId, entityType) => {
  if (displayNameCache[fullId]) return; // Already fetched or in progress
  
  // Mark as loading to prevent duplicate requests
  displayNameCache[fullId] = '...';
  
  try {
    const displayName = await api.getEntityDisplayName(entityType, fullId);
    if (displayName) {
      displayNameCache[fullId] = displayName;
      cacheVersion.value++; // Trigger re-computation of clauses
    }
  } catch (e) {
    console.error('Error fetching display name:', e);
  }
};

const generateEditText = () => {
  const lines = [];
  
  // First line: entity where first-clause
  let firstLine = entityDisplayName.value;
  if (clauses.value.length > 0) {
    firstLine += ' where ' + clauseToText(clauses.value[0]);
  }
  lines.push(firstLine);
  
  // Subsequent clauses
  for (let i = 1; i < clauses.value.length; i++) {
    lines.push('  and ' + clauseToText(clauses.value[i]));
  }
  
  // Add semicolon after last clause if there are params
  if (clauses.value.length > 0 && params.value.length > 0) {
    lines[lines.length - 1] += ';';
  }
  
  // Params
  for (const param of params.value) {
    lines.push(paramToText(param) + ';');
  }
  
  return lines.join('\n');
};

const clauseToText = (clause) => {
  switch (clause.type) {
    case 'boolean':
      return `it's ${clause.displayValue}`;
    case 'range':
      return `${clause.displayName} ${clause.operator} ${clause.displayValue}`;
    case 'search':
      return `${clause.displayName} includes "${clause.value}"`;
    case 'selectEntity':
      return selectClauseToText(clause);
    default:
      return `${clause.displayName} = ${clause.value}`;
  }
};

const selectClauseToText = (clause) => {
  const valueTexts = clause.values.map((v, idx) => {
    let valueStr;
    if (v.shortId) {
      valueStr = v.displayValue ? `${v.displayValue} [${v.shortId}]` : `[${v.shortId}]`;
    } else {
      valueStr = v.displayValue;
    }
    
    // For values after the first, add 'not' prefix if negated
    if (idx > 0 && v.isNegated) {
      valueStr = `not ${valueStr}`;
    }
    
    return valueStr;
  });
  
  let valuesStr;
  if (valueTexts.length === 1) {
    valuesStr = valueTexts[0];
  } else {
    valuesStr = valueTexts.join(` ${clause.connector} `);
  }
  
  return `${clause.displayName} ${clause.operator} ${valuesStr}`;
};

const paramToText = (param) => {
  switch (param.type) {
    case 'sort':
      return `sort by ${param.value}`;
    case 'sample':
      return `sample ${param.value}`;
    case 'group_by':
      return `group by ${param.value}`;
    case 'include_xpac':
      return 'include xpac';
    default:
      return `${param.type} ${param.value || ''}`;
  }
};

const startEditing = () => {
  editText.value = generateEditText();
  parseError.value = '';
  isEditing.value = true;
};

defineExpose({ startEditing });

const cancelEditing = () => {
  isEditing.value = false;
  editText.value = '';
  parseError.value = '';
};

const handleEditKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (!parseError.value) {
      applyOql();
    }
  }
};

const applyOql = async () => {
  parseError.value = '';
  
  const validation = validateOql(editText.value);
  if (!validation.valid) {
    parseError.value = validation.error;
    return;
  }
  
  try {
    const newRoute = oqlToRoute(editText.value, route);
    await url.pushToRoute(router, newRoute);
    isEditing.value = false;
  } catch (e) {
    parseError.value = e.message;
  }
};

watch(() => editText.value, (newVal) => {
  if (!newVal) {
    parseError.value = '';
    return;
  }
  
  const validation = validateOql(newVal);
  parseError.value = validation.valid ? '' : validation.error;
});

</script>

<style lang="scss" scoped>
.oql-display {
  width: 100%;
}

.oql-text {
  font-size: 16px;
  line-height: 1.8;
}

.oql-line {
  display: block;
}

.oql-indent {
  padding-left: 1.5em;
}

.oql-value {
  font-weight: 600;
}

.oql-operator {
  font-weight: 600;
}

.oql-key {
  // Regular weight - inherits default
}

.oql-syntax {
  color: #888;
}

:deep(.oql-entity-link) {
  color: #888;
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}

.oql-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}
</style>

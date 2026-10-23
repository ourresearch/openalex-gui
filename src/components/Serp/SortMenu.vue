<template>
  <!-- The sort menu (oxjob #1658): one order, two ways to set it. Its label is the order
       the shown results came in (the echo's `order`, the default by its own name); its
       choices are the API's for this query (GET /query/orders). A pick emits the order's
       `sort_by`; the caller runs it, and the OQL comes back ending with its words. -->
  <v-menu v-if="current" v-model="open" location="bottom end">
    <template #activator="{ props: act }">
      <v-btn
        v-bind="act"
        variant="text"
        size="small"
        class="sort-menu-btn text-none text-medium-emphasis"
        :aria-label="`Order: ${currentLabel}. Change the order`"
      >
        <v-icon start size="18" color="grey-darken-1">mdi-sort</v-icon>
        <span class="sort-menu-label">{{ currentLabel }}</span>
      </v-btn>
    </template>
    <v-list density="compact" class="sort-menu-list" min-width="220">
      <v-list-item v-if="loading && !items.length" title="Loading the orders…" disabled />
      <v-list-item v-else-if="failed && !items.length" title="The orders couldn't load." disabled />
      <v-list-item
        v-for="it in items"
        :key="it.words || 'current'"
        :active="it.active"
        @click="choose(it)"
      >
        <v-list-item-title>{{ it.label }}</v-list-item-title>
        <template #append>
          <v-icon v-if="it.active" size="18">mdi-check</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed, ref, shallowRef, watch } from 'vue';
import { api } from '@/api';
import { pickOql } from '@/oqlForm';
import { currentOrder, menuItems, orderLabel } from '@/sortMenu';

defineOptions({ name: 'SortMenu' });

const props = defineProps({
  // The shown results' `meta.x_query`: the order they came in and the query to ask about.
  xQuery: { type: Object, default: null },
});
const emit = defineEmits(['pick']);

const open = ref(false);
const options = shallowRef([]);
const loading = ref(false);
const failed = ref(false);

const current = computed(() => currentOrder(props.xQuery));
const currentLabel = computed(() => orderLabel(current.value?.words));
const oql = computed(() => pickOql(props.xQuery, true));
const items = computed(() => menuItems(options.value, current.value));
// The choices depend on the query, not its order (the API lists them for the query with no
// order), so a pick doesn't reload them: key them on the echoed OQO without its sort_by.
const queryKey = computed(() => {
  const { sort_by, ...rest } = props.xQuery?.oqo || {}; // eslint-disable-line no-unused-vars
  return JSON.stringify(rest);
});

// The choices load when the menu first opens for a query (a free, parse-only call).
let loadedFor = null;
async function load() {
  if (!oql.value || loadedFor === queryKey.value) return;
  const asked = queryKey.value;
  loading.value = true;
  failed.value = false;
  try {
    const r = await api.getQueryOrders(oql.value);
    if (asked !== queryKey.value) return;
    options.value = r?.options || [];
    loadedFor = asked;
  } catch (e) {
    console.warn('[SortMenu]', e);
    if (asked === queryKey.value) failed.value = true;
  } finally {
    if (asked === queryKey.value) loading.value = false;
  }
}
watch(open, (v) => { if (v) load(); });
// Another query: the old choices may not fit.
watch(queryKey, () => { options.value = []; loadedFor = null; if (open.value) load(); });

function choose(it) {
  open.value = false;
  if (!it.active) emit('pick', it.sortBy);
}
</script>

<style scoped>
.sort-menu-btn {
  letter-spacing: normal;
}
.sort-menu-label {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

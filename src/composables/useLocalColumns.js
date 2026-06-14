import { ref, computed, unref, watch } from "vue";
import { entityConfigs } from "@/entityConfigs";

/**
 * URL-/localStorage-free sibling of useColumnsState, for the OQL builder's
 * `standalone` mode (oxjob #428). Same returned shape — { columnKeys,
 * defaultColumnKeys, removeColumn, setColumns } — but the ordered key list lives
 * in a local ref instead of the address bar, so an embedded builder (e.g. the
 * #440 side-by-side "view code" dialog) neither reads nor writes `?column=`.
 *
 * The builder drives this purely from the OQL `return` clause: seeding calls
 * setColumns, editing the return-line bricks calls setColumns/removeColumn, and
 * the column list re-renders the OQL. No persistence — a standalone builder is a
 * pure OQL-in / OQL-out projection.
 */
function defaultColumns(entityType) {
  return entityConfigs[entityType]?.defaultColumns ?? ["display_name"];
}

export function useLocalColumns(entityTypeRef) {
  const entityType = computed(() => unref(entityTypeRef));
  // null = "follow the entity default"; an array = an explicit set.
  const explicit = ref(null);

  // Reset to default when the entity changes (mirrors useColumnsState, where a
  // no-`column` navigation falls back to the new entity's defaults).
  watch(entityType, () => { explicit.value = null; });

  const defaultColumnKeys = computed(() => defaultColumns(entityType.value));
  const columnKeys = computed(() => explicit.value ?? defaultColumnKeys.value);

  const setColumns = (keys) => {
    explicit.value = Array.isArray(keys) && keys.length ? [...keys] : null;
  };
  const removeColumn = (key) => {
    const next = columnKeys.value.filter((k) => k !== key);
    explicit.value = next.length ? next : null;
  };

  return { columnKeys, defaultColumnKeys, removeColumn, setColumns };
}

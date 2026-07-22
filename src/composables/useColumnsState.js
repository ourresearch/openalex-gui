import { computed, reactive, unref } from "vue";
import { entityConfigs } from "@/entityConfigs";

/**
 * Source of truth for the table view's ordered column keys + their persistence.
 *
 * #661 column-model redesign: columns are a SILENT, STICKY, per-entity VIEW
 * preference — pure view-layer state that never touches the URL or the query.
 * Resolution order:
 *   1. localStorage `oax.columns.{entityType}` — the user's last customized set
 *   2. `entityConfigs[entityType].defaultColumns` — per-entity defaults
 * (The old `?column=` URL param is GONE — reading and writing it were both
 * removed; a column set can no longer be shared in a link. Logged-in users who
 * want durable named setups use SerpViews.)
 *
 * Keys are raw strings, possibly carrying a ":ids" suffix (the bare-ID variant
 * of an entity column). Resolution to renderable descriptors — and dropping of
 * any unknown/malformed key — happens in columnConfig.resolveColumns, which
 * never throws (QA-051 discipline). This composable only manages the ordered
 * key list and its persistence; it does no validation of its own.
 *
 * Mutations (add/remove/move/set) write a module-level reactive map (so every
 * component sharing an entity's columns updates together) and mirror to
 * localStorage for persistence across sessions.
 */

const storageKey = (entityType) => `oax.columns.${entityType}`;

// Module-level reactive cache: entityType → ordered keys (or null = "use the
// entity default"). localStorage itself isn't reactive, so this map is what
// components actually observe; it's lazily seeded from storage per entity.
const stickyColumns = reactive({});

function readStorage(entityType) {
    try {
        const raw = localStorage.getItem(storageKey(entityType));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (e) {
        console.warn(`useColumnsState: ignoring bad localStorage for "${entityType}"`, e);
        return null;
    }
}

function writeStorage(entityType, keys) {
    try {
        localStorage.setItem(storageKey(entityType), JSON.stringify(keys));
    } catch (e) {
        console.warn(`useColumnsState: failed to persist columns for "${entityType}"`, e);
    }
}

function defaultColumns(entityType) {
    return entityConfigs[entityType]?.defaultColumns ?? ["display_name"];
}

export function useColumnsState(entityTypeRef) {
    const entityType = computed(() => unref(entityTypeRef));

    const columnKeys = computed(() => {
        const et = entityType.value;
        if (!(et in stickyColumns)) stickyColumns[et] = readStorage(et);
        return stickyColumns[et] ?? defaultColumns(et);
    });

    // The per-entity default column set, IGNORING the sticky preference. This is
    // the "list view representation" — what the list item shows by default — used
    // to seed the export dialog when the user is NOT in table view (job #304).
    // Unlike `columnKeys`, it never inherits a previous table customization.
    const defaultColumnKeys = computed(() => defaultColumns(entityType.value));

    // ---- mutations: reactive map + localStorage mirror (never the URL) ----
    function commit(keys) {
        stickyColumns[entityType.value] = keys;
        writeStorage(entityType.value, keys);
    }

    function addColumn(key) {
        if (columnKeys.value.includes(key)) return;
        commit([...columnKeys.value, key]);
    }

    function removeColumn(key) {
        // ≥1-column floor: never let the table go empty. Defense-in-depth — the
        // header menu / chip [x] also disable on the last column. (Phase 5.5
        // replaced the old "always keep display_name" rule: Title is now an
        // ordinary, removable column; only the count floor remains.)
        if (columnKeys.value.length <= 1) return;
        commit(columnKeys.value.filter((k) => k !== key));
    }

    // dir: "left" | "right"
    function moveColumn(key, dir) {
        const keys = [...columnKeys.value];
        const i = keys.indexOf(key);
        if (i === -1) return;
        const j = dir === "left" ? i - 1 : i + 1;
        if (j < 0 || j >= keys.length) return;
        [keys[i], keys[j]] = [keys[j], keys[i]];
        commit(keys);
    }

    function setColumns(keys) {
        commit(keys);
    }

    return { columnKeys, defaultColumnKeys, addColumn, removeColumn, moveColumn, setColumns };
}

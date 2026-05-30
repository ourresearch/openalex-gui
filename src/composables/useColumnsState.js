import { computed, unref, watch } from "vue";
import { useRoute } from "vue-router";
import { url } from "@/url";
import { entityConfigs } from "@/entityConfigs";

/**
 * Source of truth for the table view's ordered column keys + their persistence.
 *
 * Resolution order (URL is authoritative):
 *   1. `?column=k1,k2,...` in the URL  — shared/bookmarked, reproducible
 *   2. localStorage `oax.columns.{entityType}` — the user's last customized set
 *   3. `entityConfigs[entityType].defaultColumns` — per-entity defaults
 *
 * Keys are raw strings, possibly carrying a ":ids" suffix (the bare-ID variant
 * of an entity column). Resolution to renderable descriptors — and dropping of
 * any unknown/malformed key — happens in columnConfig.resolveColumns, which
 * never throws (QA-051 discipline). This composable only manages the ordered
 * key list and its persistence; it does no validation of its own.
 *
 * Mutations (add/remove/move/set) write the URL (making it authoritative) and
 * mirror to localStorage. A watcher also mirrors any explicit URL column set to
 * localStorage so that a later no-`column` navigation on the same entity type
 * inherits it (ACCEPTANCE Test 10).
 */

const storageKey = (entityType) => `oax.columns.${entityType}`;

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
    const route = useRoute();
    const entityType = computed(() => unref(entityTypeRef));

    const columnKeys = computed(() => {
        const fromUrl = url.getColumn(route).filter((k) => !!k);
        if (fromUrl.length) return fromUrl;
        const fromStorage = readStorage(entityType.value);
        if (fromStorage) return fromStorage;
        return defaultColumns(entityType.value);
    });

    // Mirror an explicit URL column set to localStorage (covers shared-link
    // stickiness as well as the post-mutation case). No-op when the URL has no
    // column param, so defaults/localStorage are left untouched.
    watch(
        () => url.getColumn(route).join(","),
        (joined) => {
            if (joined) writeStorage(entityType.value, joined.split(","));
        },
        { immediate: true },
    );

    // ---- mutations: URL (authoritative) + localStorage mirror ----
    function commit(keys) {
        writeStorage(entityType.value, keys);
        url.setColumn(keys);
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

    return { columnKeys, addColumn, removeColumn, moveColumn, setColumns };
}

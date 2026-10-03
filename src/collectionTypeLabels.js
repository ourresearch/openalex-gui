// A collection's entity type as the website shows it: its icon and plural name from
// entityConfigs, which are keyed by GUI type names (identical to the collection
// entity_type except `work-types` -> `types`, oxjob #396). Shared by the settings list
// and the /collections search page (oxjob #1532).
import { entityConfigs } from "@/entityConfigs";
import { fromCollectionEntityType } from "@/openalexId";

export function collectionTypeIcon(type) {
    return entityConfigs?.[fromCollectionEntityType(type)]?.icon || "mdi-folder-outline";
}

export function collectionTypePlural(type) {
    return entityConfigs?.[fromCollectionEntityType(type)]?.displayName || type || "";
}

export function capitalizeFirst(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

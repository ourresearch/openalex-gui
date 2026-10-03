// Collection limits, mirroring openalex-users-api collection_validators.py and
// collections_api.py (oxjob #1527, charter plans/collections.md "Limits").
export const MAX_MEMBERS_PER_COLLECTION = 1_000_000;
export const MAX_DISPLAY_NAME_LENGTH = 100;
// IDs one add request takes; bigger sets go as an import (a query's results).
export const MAX_MEMBER_IDS_PER_REQUEST = 10_000;
// Rows unticked under "Select all" that an import can leave out.
export const MAX_EXCLUDE_IDS = 10_000;

// Live filter limits (openalex-elastic-api core/collection_resolver.py): a bigger
// collection still holds and exports its members, but a filter by it answers
// `collection_too_big_to_filter`.
export const LIVE_FILTER_LIMIT = 300_000;
export const LIVE_FILTER_LIMITS = { authors: 100_000 };
export function liveFilterLimit(collectionEntityType) {
  return LIVE_FILTER_LIMITS[collectionEntityType] ?? LIVE_FILTER_LIMIT;
}

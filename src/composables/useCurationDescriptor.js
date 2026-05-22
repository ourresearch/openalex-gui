import { ref } from 'vue';
import axios from 'axios';

const OX_PREFIX = 'https://openalex.org/';

export function shortId(url) {
  if (!url) return '';
  return String(url).replace(OX_PREFIX, '');
}

const ENDPOINT_BY_TYPE = {
  institution: 'institutions',
  author: 'authors',
  work: 'works',
};

export function oxEntityUrl(ref) {
  const endpoint = ENDPOINT_BY_TYPE[ref?.type];
  if (!endpoint || !ref.id) return null;
  return `${OX_PREFIX}${endpoint}/${shortId(ref.id)}`;
}

// works add-author property looks like:
//   authorships[raw_author_name="Jane Doe"].author.id
function parseRawAuthorName(property) {
  if (!property) return null;
  const m = String(property).match(/raw_author_name="([^"]*)"/);
  return m ? m[1] : null;
}

// Maps the composite (entity, action, property) → a render descriptor.
// Each *Ref is { type: 'institution'|'author'|'work'|'text', id|text }.
// `previousTargetRef` is the live OpenAlex value snapshotted at submit time
// (oxjob #241's `previous_value` column). Populated only for `replace`
// actions where the prior state is a meaningful scalar; null otherwise.
export function curationDescriptor(curation) {
  const { entity, action, property, entity_id: entityId, value, previous_value: previousValue } = curation || {};

  if (entity === 'ras') {
    return {
      kindLabel: 'Affiliation',
      headerRef: { type: 'text', text: entityId },
      actionLabel: action === 'add' ? 'Link' : 'Unlink',
      targetRef: { type: 'institution', id: value },
      previousTargetRef: null,
      rawAuthorName: null,
    };
  }

  if (entity === 'authors') {
    return {
      kindLabel: 'Author',
      headerRef: { type: 'author', id: entityId },
      actionLabel: 'Rename',
      targetRef: { type: 'text', text: value },
      previousTargetRef: previousValue ? { type: 'text', text: previousValue } : null,
      rawAuthorName: null,
    };
  }

  if (entity === 'works') {
    if (action === 'replace') {
      const rawName = parseRawAuthorName(property);
      return {
        kindLabel: 'Work',
        headerRef: { type: 'work', id: entityId },
        actionLabel: rawName ? `Add author "${rawName}"` : 'Add author',
        targetRef: { type: 'author', id: value },
        previousTargetRef: previousValue ? { type: 'author', id: previousValue } : null,
        rawAuthorName: rawName,
      };
    }
    return {
      kindLabel: 'Work',
      headerRef: { type: 'work', id: entityId },
      actionLabel: 'Remove author',
      targetRef: { type: 'author', id: value },
      previousTargetRef: null,
      rawAuthorName: null,
    };
  }

  return {
    kindLabel: entity || 'Curation',
    headerRef: { type: 'text', text: entityId },
    actionLabel: action || '',
    targetRef: { type: 'text', text: value },
    previousTargetRef: null,
    rawAuthorName: null,
  };
}

// Curation entity → badge label + icon (icons match entityConfigs.js canon).
const ENTITY_META = {
  ras: { label: 'Affiliation', icon: 'mdi-map-marker-outline' },
  authors: { label: 'Author', icon: 'mdi-account-outline' },
  works: { label: 'Work', icon: 'mdi-file-document-outline' },
  institution: { label: 'Institution', icon: 'mdi-town-hall' },
};
export function entityMeta(entity) {
  return ENTITY_META[entity] || { label: entity || 'Curation', icon: 'mdi-help-circle-outline' };
}

// Icon for a resolved-entity ref (used in front of the name in the Entity and
// New value columns). Text refs (free-text RAS strings, rename target) get none.
const REF_TYPE_ICON = {
  institution: ENTITY_META.institution.icon,
  author: ENTITY_META.authors.icon,
  work: ENTITY_META.works.icon,
};
export function refIcon(ref) {
  return REF_TYPE_ICON[ref?.type] || '';
}

// Raw curation verb → display label + icon. DB only ever has
// add/remove/replace. No color-coding (uniform default tone).
const ACTION_META = {
  add: { label: 'Add', icon: 'mdi-plus-thick' },
  remove: { label: 'Remove', icon: 'mdi-trash-can-outline' },
  replace: { label: 'Replace', icon: 'mdi-pen' },
};
export function actionMeta(action) {
  return ACTION_META[action] || { label: action || '—', icon: 'mdi-help-circle-outline' };
}

// Single source of truth for the 3-way curation lifecycle display
// (oxjob #198). Driven by `curation.status` ('pending'|'applied'|
// 'timed_out'); the backend keeps is_applied in sync but the gui no longer
// reads it. Anything unknown/missing falls back to the pending presentation.
const STATUS_META = {
  applied: { label: 'Applied', icon: 'mdi-check-circle', color: 'success' },
  timed_out: { label: 'Timed out', icon: 'mdi-close-circle', color: 'error' },
  pending: { label: 'Pending', icon: 'mdi-clock-outline', color: 'medium-emphasis' },
};
export function statusMeta(curation) {
  return STATUS_META[curation?.status] || STATUS_META.pending;
}

// Human-readable name for the curated property. Grows as new properties ship —
// extend PROPERTY_LABELS; the raw_author_name form needs the regex special-case.
const PROPERTY_LABELS = {
  institution_ids: 'institution',
  display_name: 'display name',
  'authorships.author.id': 'author',
};

function singularize(word) {
  if (/ies$/.test(word)) return word.replace(/ies$/, 'y');
  if (/ses$/.test(word)) return word.replace(/es$/, '');
  if (/s$/.test(word)) return word.replace(/s$/, '');
  return word;
}

// Human-readable summary of a (possibly gnarly) property path. Examples:
//   authorships[raw_author_name="Jane Doe"].author.id
//     → 'author'   (the raw name bloats the table column; it's still in the
//                   tooltip's raw-property line and on the detail page)
//   institution_ids → 'institution'   (simple map)
//   anything unmapped → returned verbatim (col 3 shows the raw form too)
export function propertyLabel(curation) {
  const p = curation?.property || '';
  if (PROPERTY_LABELS[p]) return PROPERTY_LABELS[p];
  // generic  prefix[key="value"].rest  notation
  const m = p.match(/^(\w+)\[(\w+)="([^"]*)"\]/);
  if (m) {
    const [, prefix, key, val] = m;
    if (key === 'raw_author_name') return 'author';
    return `${singularize(prefix)} with ${key} "${val}"`;
  }
  return p || '—';
}

export function formatExactDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const diffSeconds = Math.floor((Date.now() - date) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  if (diffSeconds < 60) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Compact relative age for dense table cells: 5m / 15h / 42d / 3w / 8mo / 2y.
export function formatRelativeShort(dateStr) {
  if (!dateStr) return '—';
  const diffSeconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diffSeconds < 60) return 'now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${Math.floor(diffDays / 365)}y`;
}

const SELECT_BY_ENDPOINT = {
  institutions: 'id,display_name,geo',
  authors: 'id,display_name,last_known_institutions',
  works: 'id,display_name,publication_year',
};

// Resolves OX URLs in a list of curations to display names/subtitles, batched
// by entity type (one request per type per page), same pattern the RAS card
// used for institutions. Falls back to raw value when unresolved.
export function useEntityResolver() {
  const entityMap = ref({}); // { fullOxUrl: { id, display_name, subtitle, type } }

  async function resolve(curationsList) {
    const buckets = { institutions: [], authors: [], works: [] };

    for (const c of curationsList || []) {
      const d = curationDescriptor(c);
      for (const r of [d.headerRef, d.targetRef, d.previousTargetRef]) {
        const endpoint = ENDPOINT_BY_TYPE[r?.type];
        if (!endpoint || !r.id || entityMap.value[r.id]) continue;
        const sid = shortId(r.id);
        if (sid && !buckets[endpoint].includes(sid)) buckets[endpoint].push(sid);
      }
    }

    await Promise.all(Object.entries(buckets).map(async ([endpoint, ids]) => {
      if (!ids.length) return;
      try {
        const res = await axios.get(
          `https://api.openalex.org/${endpoint}?filter=openalex:${ids.join('|')}` +
          `&select=${SELECT_BY_ENDPOINT[endpoint]}&per_page=${ids.length}`
        );
        for (const item of res.data.results || []) {
          let subtitle = '';
          if (endpoint === 'institutions') {
            subtitle = item.geo?.city || item.geo?.country || '';
          } else if (endpoint === 'authors') {
            subtitle = item.last_known_institutions?.[0]?.display_name || '';
          } else if (endpoint === 'works') {
            subtitle = item.publication_year ? String(item.publication_year) : '';
          }
          entityMap.value[item.id] = {
            id: item.id,
            display_name: item.display_name,
            subtitle,
            type: endpoint,
          };
        }
      } catch (e) {
        console.warn(`Failed to fetch ${endpoint} names:`, e);
      }
    }));
  }

  return { entityMap, resolve };
}

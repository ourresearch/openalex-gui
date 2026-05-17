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
export function curationDescriptor(curation) {
  const { entity, action, property, entity_id: entityId, value } = curation || {};

  if (entity === 'ras') {
    return {
      kindLabel: 'RAS',
      headerRef: { type: 'text', text: entityId },
      actionLabel: action === 'add' ? 'Link' : 'Unlink',
      actionColor: action === 'add' ? 'success' : 'error',
      targetRef: { type: 'institution', id: value },
      rawAuthorName: null,
    };
  }

  if (entity === 'authors') {
    return {
      kindLabel: 'Author',
      headerRef: { type: 'author', id: entityId },
      actionLabel: 'Rename',
      actionColor: 'info',
      targetRef: { type: 'text', text: value },
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
        actionColor: 'success',
        targetRef: { type: 'author', id: value },
        rawAuthorName: rawName,
      };
    }
    return {
      kindLabel: 'Work',
      headerRef: { type: 'work', id: entityId },
      actionLabel: 'Remove author',
      actionColor: 'error',
      targetRef: { type: 'author', id: value },
      rawAuthorName: null,
    };
  }

  return {
    kindLabel: entity || 'Curation',
    headerRef: { type: 'text', text: entityId },
    actionLabel: action || '',
    actionColor: 'grey',
    targetRef: { type: 'text', text: value },
    rawAuthorName: null,
  };
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
      for (const r of [d.headerRef, d.targetRef]) {
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

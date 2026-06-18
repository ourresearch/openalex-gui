import millify from "millify";
import pluralize from "pluralize";
import sanitizeHtml from "sanitize-html";

import store from "./store"
import router from './router'
import {createSimpleFilter} from "./filterConfigs";
import {entityConfigs} from "@/entityConfigs";
import {toPrecision} from "./util";
import * as openalexId from "@/openalexId";

const filters = {
  entityWorksLink(id, entityData) {
    const entityType = openalexId.getEntityType(id);
    if (!id || !entityType) { return; }
    const shortId = openalexId.getShortId(id);
    // For repository sources, use locations.source.id to show all works
    // where this repo appears in any location (not just primary)
    const isRepository = entityType === 'sources' && entityData?.type === 'repository';
    const filterKey = isRepository ? 'locations.source.id' : entityConfigs[entityType].filterKey;
    const filter = createSimpleFilter(
      "works",
      filterKey,
      shortId,
    );
    return {
      name: "Serp",
      params: { entityType: "works" },
      query: { filter: filter.asStr, include_xpac: 'true' },
    };
  },
  /**
   * Create a link to the awards SERP filtered by a funder.
   * @param {string} funderId - The funder's OpenAlex ID
   * @returns {Object} - Vue router link object
   */
  funderAwardsLink(funderId) {
    if (!funderId) { return; }
    const shortId = openalexId.getShortId(funderId);
    const filter = createSimpleFilter(
      "awards",
      "funder.id",
      shortId,
    );
    return {
      name: "Serp",
      params: { entityType: "awards" },
      query: { filter: filter.asStr },
    };
  },
  // Route object (for `<router-link :to>`) to an entity's canonical full page.
  // The zoom drawer no longer rides on the URL, so this is always the full-page
  // route — non-works links (roles, filter values, entity-data rows) navigate
  // here exactly as before.
  entityZoomLink(id) {
    if (!id) { return; }
    const parsed = openalexId.parseId(id);
    if (!parsed) { return; }
    return {
      name: "EntityPage",
      params: { entityType: parsed.entityType, entityId: parsed.shortId },
    };
  },
  // Plain-string href to an entity's canonical full page, for the works-SERP
  // result links that open the zoom drawer (rendered as a plain `<a :href>` so a
  // plain click can be cancelled order-independently — see zoomDrawerClick). The
  // href is what middle-/cmd-click, "open in new tab", and no-JS fall back to, so
  // they land on /<entityType>/<shortId> rather than a `?zoom=` half-state.
  entityZoomHref(id) {
    if (!id) { return undefined; }
    const parsed = openalexId.parseId(id);
    if (!parsed) { return undefined; }
    return router.resolve({
      name: "EntityPage",
      params: { entityType: parsed.entityType, entityId: parsed.shortId },
    }).href;
  },
  // Click handler for the plain `<a>` works-SERP result links. A plain left click
  // opens the zoom drawer from store state (no `?zoom=` in the URL) — or, on
  // phones where the drawer is too cramped, SPA-navigates to the full page.
  // Modified clicks (cmd/ctrl/shift/alt or a non-primary button) fall through to
  // the `<a href>` so open-in-new-tab still works.
  zoomDrawerClick(id, event) {
    if (!id) { return; }
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button)) {
      return;
    }
    const parsed = openalexId.parseId(id);
    if (!parsed) { return; }
    // Cancel the anchor's default navigation; a plain click is handled in JS.
    // (preventDefault on a real <a> always wins, regardless of listener order.)
    event?.preventDefault?.();
    const route = router.currentRoute.value;
    const isWorksSerp = route.name === "Serp" && route.params?.entityType === "works";
    const targetIsWork = parsed.entityType === "works";
    const isPhoneViewport = typeof window !== 'undefined' && window.innerWidth < 600;
    if (isWorksSerp && targetIsWork && !isPhoneViewport) {
      store.commit('setZoomId', parsed.shortId);
    } else {
      router.push({
        name: "EntityPage",
        params: { entityType: parsed.entityType, entityId: parsed.shortId },
      });
    }
  },
  toPrecision(number, precision = 4) {
    return toPrecision(number, precision);
  },
  truncate(str, length = 100) {
    str = String(str);
    if (str.length > length) {
      return str.slice(0, length) + '...';
    }
    return str;
  },
  pluralize(str, count) {
    let pluralized = pluralize(str, count);
    fixedCaseWords.map(word => {
      if (pluralized.toLowerCase() === word.toLowerCase()) {
        pluralized = word;
      }
    })
    return pluralized;
  },
  capitalize(str) {
    if (typeof str !== "string") { return str; }
    const firstLetter = str[0];
    return firstLetter.toUpperCase() + str.substring(1);
  },
  titleCase(str) {
    if (typeof str !== "string") return str;
    const fixedWordsMap = fixedCaseWords.reduce((map, word) => {
      map[word.toLowerCase()] = word;
      return map;
    }, {});
    return str
      .split(" ")
      .map((word, index) => {
        const lowerCaseWord = word.toLowerCase();
        if (fixedWordsMap[lowerCaseWord]) {
          return fixedWordsMap[lowerCaseWord];
        }
        if (index === 0 || !stopWords.includes(lowerCaseWord)) {
          return word[0].toUpperCase() + word.slice(1).toLowerCase();
        }
        return lowerCaseWord;
      })
      .join(" ");
  },
  prettyName(name) {
    let ret = name
      .replace("ieee", "IEEE")
      .replace("United States of America", "United States")
      .replace("United Kingdom of Great Britain and Northern Ireland", "United Kingdom");
    const typeRe = /[a-z]+-[a-z]+/;
    if (typeRe.test(ret)) { ret = ret.replace("-", " "); }
    return ret;
  },
  prettyTitle(title, facetKey) {
    if (!title) return "Untitled"
    if (/^\s+$/.test(title)) return "Untitled"
    if (title && title.toUpperCase() === title && title.length > 15) {
        title = this.titleCase(title.toLowerCase());
    }
    if (facetKey && facetKey === "type") {
        title = title.replace("-", " ")
        title = this.titleCase(title)
    }
    if (facetKey === "authorships.institutions.country_code") {
        title = title
            .replace("ieee", "IEEE")
            .replace("United States of America", "United States")
            .replace("United Kingdom of Great Britain and Northern Ireland", "United Kingdom")
    }

    const safeTitle = sanitizeHtml(title, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    })
    return safeTitle
  },
  millify(number) {
    return millify(
      number,
      {
        precision: 0,
        lowercase: false,
      }
    );
  },
  /**
   * Get display title for an award entity.
   * Awards may not have a display_name/title, so we fall back to funder_award_id,
   * then to the short OpenAlex ID (e.g., "G5453342221").
   * @param {Object} award - The award entity object
   * @returns {string} - The display title to show
   */
  getAwardDisplayTitle(award) {
    if (!award) return 'Untitled';
    // Try display_name first (may be set by API hack), then title
    if (award.display_name) return award.display_name;
    if (award.title) return award.title;
    // Fall back to funder_award_id if available
    if (award.funder_award_id) return award.funder_award_id;
    // Last resort: use short OpenAlex ID
    if (award.id) {
      return openalexId.toDisplayFormat(award.id, 'short');
    }
    return 'Untitled';
  },
};

const stopWords = [
  "a", "an", "and", "as", "at", "but", "by", "for", "in",
  "nor", "of", "on", "or", "so", "the", "to", "up", "yet"
];
const fixedCaseWords = [
  "OpenAlex", "ID", "IDs", "ROR", "ORCID", "DOI", "OA", "ISSN", "ISSNs",
  "DOAJ", "SDG", "SDGs", "FWCI", "URL", "CrossRef", "APC", "PubMed"
];

export default filters;
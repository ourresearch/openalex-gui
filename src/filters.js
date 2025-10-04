import millify from "millify";
import pluralize from "pluralize";
import sanitizeHtml from "sanitize-html";

import {url} from "./url"
import router from './router'
import {createSimpleFilter} from "./filterConfigs";
import {entityConfigs, urlPartsFromId} from "@/entityConfigs";
import {toPrecision, entityTypeFromId, shortenOpenAlexId} from "./util";

const filters = {
  entityWorksLink(id) {
    const entityType = entityTypeFromId(id);
    if (!id || !entityType) { return; }
    const idForFilter = shortenOpenAlexId(id);
    const filter = createSimpleFilter(
      "works",
      entityConfigs[entityType].filterKey,
      idForFilter,
    );
    return {
      name: "Serp",
      params: { entityType: "works" },
      query: { filter: filter.asStr },
    };
  },
  entityZoomLink(id) {
    if (!id) { return; }
    const shortId = shortenOpenAlexId(id);
    const newQuery = url.addToQuery(router.currentRoute.value.query, "zoom", shortId);
    const params = { ...router.currentRoute.value.params };
    if (router.currentRoute.value.name === "Serp") {
      return {
        name: "Serp",
        params,
        query: newQuery,
      };
    } else {
      return {
        name: "EntityPage",
        params: urlPartsFromId(id),
      };
    }
  },
  zoomLink(fullId) {
    if (!fullId) { return; }
    const shortId = shortenOpenAlexId(fullId);
    const zoomIds = router.currentRoute.query.zoom?.split(",") ?? [];
    zoomIds.push(shortId);
    const newQuery = url.addToQuery(router.currentRoute.query, "zoom", zoomIds.join());
    return {
      name: "Serp",
      query: newQuery,
    };
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
      if (pluralized === word.toLowerCase()) {
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
    if (title && title.toUpperCase() === title) {
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
};

const stopWords = [
  "a", "an", "and", "as", "at", "but", "by", "for", "in",
  "nor", "of", "on", "or", "so", "the", "to", "up", "yet"
];
const fixedCaseWords = [
  "OpenAlex", "ID", "IDs", "ROR", "ORCID", "DOI", "OA", "ISSN", "ISSNs",
  "DOAJ", "SDG", "SDGs", "FWCI", "URL", "CrossRef"
];

export default filters;
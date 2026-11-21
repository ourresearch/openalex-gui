// Author type (oxjob #2437): `type` on an author profile and on each authorship's
// `author` is "human", "organization", "software-agent" or null (not stated). Two
// uses on the website:
//   - a small tag beside an author whose type is software-agent (work page authors
//     row, author page header);
//   - the works SERP's "Only AI authors" / "Exclude AI authors" switches, which set
//     `authorships.author.type:software-agent` or `:!software-agent` (works with no
//     declared software-agent author). There is no Human switch: human is mostly
//     null, so "only humans" would hide nearly everything.
import { createSimpleFilter } from "@/filterConfigs";

export const AUTHOR_TYPE_FILTER_KEY = "authorships.author.type";
export const SOFTWARE_AGENT = "software-agent";

// The bare slug of a type value in any form the API or a URL can carry it
// (software-agent, author-types/software-agent, https://openalex.org/author-types/...).
export function authorTypeSlug(value) {
  if (typeof value !== "string" || !value) return null;
  return value.trim().toLowerCase().replace(/^https?:\/\/openalex\.org\//, "").replace(/^author-types\//, "");
}

// The tag to show beside an author, or null. Only software agents get one for now.
export function authorTypeTag(author) {
  if (authorTypeSlug(author?.type) !== SOFTWARE_AGENT) return null;
  return { label: "AI", title: "Software agent", href: `/author-types/${SOFTWARE_AGENT}` };
}

export const AI_AUTHORS_MODES = {
  only: { label: "Only AI authors", hint: "Works with an author stated to be a software agent", isNegated: false },
  exclude: { label: "Exclude AI authors", hint: "Leave out works with an author stated to be a software agent", isNegated: true },
};

// A filter the switches own: the author-type key with software-agent as its one value.
export function isAiAuthorsFilter(filter) {
  if (filter?.key !== AUTHOR_TYPE_FILTER_KEY) return false;
  const options = String(filter.value ?? "").split(/[|+]/);
  return options.length === 1 && authorTypeSlug(options[0]) === SOFTWARE_AGENT;
}

// "only", "exclude" or null for a list of filter objects (filterConfigs.filtersFromUrlStr).
export function aiAuthorsMode(filters) {
  const owned = (filters || []).filter(isAiAuthorsFilter);
  if (!owned.length) return null;
  return owned[owned.length - 1].isNegated ? "exclude" : "only";
}

// The filters with the switches set to `mode` ("only", "exclude" or null = off): any
// filter the switches own is dropped and the new one, if any, goes last.
export function filtersWithAiAuthorsMode(entityType, filters, mode) {
  const kept = (filters || []).filter((f) => !isAiAuthorsFilter(f));
  if (!AI_AUTHORS_MODES[mode]) return kept;
  return [...kept, createSimpleFilter(entityType, AUTHOR_TYPE_FILTER_KEY, SOFTWARE_AGENT, AI_AUTHORS_MODES[mode].isNegated)];
}

// Clicking a switch: on turns the other off; clicking the one that is on turns it off.
export function nextAiAuthorsMode(current, clicked) {
  return current === clicked ? null : clicked;
}

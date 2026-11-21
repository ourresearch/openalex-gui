// Author type (oxjob #2437): `type` on an author profile and on each authorship's
// `author` is "human", "organization", "software-agent" or null (not stated). Two
// uses on the website:
//   - a small tag beside an author whose type is software-agent (work page authors
//     row, author page header);
//   - the works SERP's AI-authors control: one choice of three, "All works", "Only
//     works with known AI authors" (`authorships.author.type:software-agent`) or "No
//     known AI authors" (`:!software-agent`, works with no declared software-agent
//     author). "Known", because only authors a source or rule typed are caught. There
//     is no Human choice: human is mostly null, so "only humans" would hide nearly
//     everything.
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

// The control's three choices, in menu order. `mode` null = no filter.
export const AI_AUTHORS_CHOICES = [
  { mode: null, label: "All works", pill: null },
  {
    mode: "only",
    label: "Only works with known AI authors",
    hint: "An author is known to be a software agent",
    pill: "Known AI authors only",
    isNegated: false,
  },
  {
    mode: "exclude",
    label: "No known AI authors",
    hint: "Leaves out works with an author known to be a software agent",
    pill: "No known AI authors",
    isNegated: true,
  },
];
const choiceFor = (mode) => AI_AUTHORS_CHOICES.find((c) => c.mode === mode) || null;

// The pill shown beside the search box while a filtering choice is on, or null.
export function aiAuthorsPill(mode) {
  return choiceFor(mode)?.pill || null;
}

// A filter the control owns: the author-type key with software-agent as its one value.
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

// The filters with the control set to `mode` ("only", "exclude" or null = All works):
// any filter the control owns is dropped and the new one, if any, goes last.
export function filtersWithAiAuthorsMode(entityType, filters, mode) {
  const kept = (filters || []).filter((f) => !isAiAuthorsFilter(f));
  const choice = choiceFor(mode);
  if (!choice?.mode) return kept;
  return [...kept, createSimpleFilter(entityType, AUTHOR_TYPE_FILTER_KEY, SOFTWARE_AGENT, choice.isNegated)];
}

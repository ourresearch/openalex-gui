// Fetchers for the OQL/OQO spec artifacts served by elastic-api (oxjob #361).
//
// The canonical artifacts (OQL guide, OQO JSON Schema, derived grammar EBNF,
// rendered railroad) live in openalex-elastic-api/docs/ and are served read-only
// at /query/spec/<slug>. The playground's three reference pages (Guide, Grammar,
// OQO schema) fetch them HERE at runtime so they can never drift from the
// implementation — there is no bundled copy in the GUI.
//
// Standalone (not src/api.js), like oqlEditorApi.js: it hits a couple of plain
// read-only endpoints and just needs the shared base URL.

import axios from "axios";
import { urlBase } from "@/apiConfig";

const MAILTO = "mailto=ui@openalex.org";

function specUrl(slug) {
  return `${urlBase.api}/query/spec/${slug}?${MAILTO}`;
}

// Each fetcher returns the raw artifact text/object. Callers render it.
export async function fetchOqlGuideMarkdown() {
  const { data } = await axios.get(specUrl("oql"), { responseType: "text" });
  return data;
}

export async function fetchOqoSchema() {
  const { data } = await axios.get(specUrl("oqo"));
  return data; // parsed JSON
}

export async function fetchGrammarEbnf() {
  const { data } = await axios.get(specUrl("grammar"), { responseType: "text" });
  return data;
}

// The railroad is a full self-contained XHTML doc (inline CSS + SVG); we hand the
// URL to an <iframe> rather than fetching the markup, so its styles stay scoped.
export function grammarRailroadUrl() {
  return specUrl("railroad");
}

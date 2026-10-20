// Entity links and phrases in OQL text, for the IDE editor (oxjob #1597). Pure functions:
// no CodeMirror, no network, so they run under vitest's node environment.
//
// OQL writes every entity as a Markdown link, `[Massachusetts Institute of Technology](I63966007)`
// (#1555). The ID is the meaning; the name is for people. The editor shows the name as a link
// and hides `[`, `](` and the ID, but the text it holds (and hands the page) is the full form.

import { getEntityType, isCollectionId } from "@/openalexId";
import { parseRecordPath } from "@/ssr/recordRoutes";
import { entityConfigs, getLocationString } from "@/entityConfigs";
import { capitalizeFirst } from "@/collectionTypeLabels";

const LINK_RE = /\[([^[\]\n]*)\]\(([^()\s]+)\)/g;

// Every `[name](ID)` in the text, in order: offsets of the whole link, the name, and the ID.
export function findLinks(text) {
  const out = [];
  if (!text) return out;
  LINK_RE.lastIndex = 0;
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    const from = m.index;
    const nameFrom = from + 1;
    const nameTo = nameFrom + m[1].length;
    const to = from + m[0].length;
    out.push({
      from, to, nameFrom, nameTo, idFrom: nameTo + 2, idTo: to - 1,
      name: m[1], id: m[2], kind: linkKind(m[2], text.slice(Math.max(0, from - 24), from)),
    });
  }
  return out;
}

// The link whose name holds `pos` (ends included), or null.
export function linkAtName(links, pos) {
  return links.find((l) => pos >= l.nameFrom && pos <= l.nameTo) || null;
}

// The link that covers `pos` anywhere from `[` to `)` (ends excluded), or null.
export function linkCovering(links, pos) {
  return links.find((l) => pos > l.from && pos < l.to) || null;
}

// An ID's entity kind, from its shape; numbers and slugs are read from the words before
// the link (`in SDG [Climate action](13)`, `under the [CC-BY](cc-by) license`).
export function linkKind(id, before = "") {
  if (!id) return null;
  if (isCollectionId(id)) return "collections";
  if (/^[a-z]\d+$/i.test(id) && getEntityType(id)) return getEntityType(id);   // W123, I123, G123 ...
  if (/^Q\d+$/.test(id)) return "continents";
  const b = before.toLowerCase().replace(/\s+$/, "");
  if (/\bsdgs?$/.test(b)) return "sdgs";
  if (/\bsubfield$/.test(b)) return "subfields";
  if (/\bfield$/.test(b)) return "fields";
  if (/\bdomain$/.test(b)) return "domains";
  if (/\btopic$/.test(b)) return "topics";
  if (/\bunder the$/.test(b)) return "licenses";
  if (/^[A-Z]{2}$/.test(id)) return "countries";
  return null;
}

// The entity's page (and API record) path, `/institutions/I63966007`, in canonical case; null
// for kinds without a page (collections) or a malformed ID.
export function entityPath(kind, id) {
  if (!kind || !id) return null;
  return parseRecordPath(`/${kind}/${id}`)?.canonicalPath || null;
}

// The ID tail of an autocomplete row (`https://openalex.org/I97018004` -> `I97018004`,
// `https://openalex.org/subfields/1702` -> `1702`).
export function idTail(id) {
  return String(id || "").split("/").pop();
}

// The OQL text for a picked entity. A `]` in a name would end the link early, so it goes.
export function linkText(name, id) {
  const clean = String(name || id).replace(/[[\]\n]/g, " ").replace(/\s+/g, " ").trim();
  return `[${clean}](${id})`;
}

// An unclosed `[` before `pos` on the same line (the person is typing a name to look up):
// its offset and the name typed so far, or null. Inside a complete link it's null (the
// link's own lookup handles that).
export function openBracketBefore(text, pos, links = findLinks(text)) {
  if (linkCovering(links, pos)) return null;
  for (let i = pos - 1; i >= 0 && pos - i <= 120; i -= 1) {
    const ch = text[i];
    if (ch === "\n" || ch === "]" || ch === ")") return null;
    if (ch === "[") return { from: i, query: text.slice(i + 1, pos) };
  }
  return null;
}

// What follows the cursor that a picked link should swallow: the `]` closeBrackets put
// there, and a stale `(ID)` after it.
export function bracketTailEnd(text, pos) {
  if (text[pos] !== "]") return pos;
  const m = /^\]\([^()\s]*\)/.exec(text.slice(pos));
  return pos + (m ? m[0].length : 1);
}

// Words with offsets on one line of text (links count as one word each), for phrase lookups.
function wordsWithOffsets(text) {
  const out = [];
  const re = /\[[^[\]\n]*\]\([^()\s]+\)|[^\s,.()[\]"]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ word: m[0], from: m.index, to: m.index + m[0].length });
  }
  return out;
}

// The longest known phrase (up to 6 words) that covers offset `pos` in `text`, from a map
// of lowercased phrase -> entry. Returns {entry, from, to} or null.
export function phraseAt(text, pos, phrases, maxWords = 6) {
  if (!phrases || !phrases.size) return null;
  const words = wordsWithOffsets(text);
  const k = words.findIndex((w) => pos >= w.from && pos <= w.to);
  if (k < 0 || words[k].word.startsWith("[")) return null;
  let best = null;
  for (let start = Math.max(0, k - maxWords + 1); start <= k; start += 1) {
    for (let end = Math.min(words.length - 1, start + maxWords - 1); end >= k; end -= 1) {
      const span = words.slice(start, end + 1);
      if (span.some((w) => w.word.startsWith("["))) continue;
      const key = text.slice(span[0].from, span[span.length - 1].to).toLowerCase().replace(/\s+/g, " ");
      const entry = phrases.get(key) || phrases.get(key.replace(/'s$/, ""));
      if (entry && (!best || span.length > best.n)) {
        best = { entry, from: span[0].from, to: span[span.length - 1].to, n: span.length };
      }
    }
  }
  return best && { entry: best.entry, from: best.from, to: best.to };
}

// Compact numbers for cards: 558203 -> "558K", 97384341 -> "97.4M".
export function compactNumber(n) {
  if (typeof n !== "number" || !isFinite(n)) return null;
  if (n < 10000) return n.toLocaleString("en-US");
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function kindLabel(kind) {
  if (kind === "collections") return "Collection";
  return capitalizeFirst(entityConfigs[kind]?.displayNameSingular) || "Entity";
}

const SOURCE_TYPES = { journal: "Journal", repository: "Repository", conference: "Conference",
  "book series": "Book series", ebook_platform: "Ebook platform" };

// What an entity's hover card says, from its API record: {title, kicker, line, stats}.
export function cardFacts(kind, rec) {
  if (!rec) return null;
  const title = rec.display_name || rec.title || idTail(rec.id);
  let kicker = kindLabel(kind);
  let line = null;
  const stats = [];
  const works = compactNumber(rec.works_count);
  const cites = compactNumber(rec.cited_by_count);
  if (kind === "institutions") {
    if (rec.type) kicker = `${kicker} · ${rec.type}`;
    line = getLocationString(rec) || null;
  } else if (kind === "authors") {
    const inst = (rec.last_known_institutions || [])[0];
    line = inst ? inst.display_name : null;
    const h = rec.summary_stats?.h_index;
    if (typeof h === "number") stats.push(`h-index ${h}`);
  } else if (kind === "sources") {
    if (rec.type) kicker = SOURCE_TYPES[rec.type] || kicker;
    line = rec.host_organization_name || null;
  } else if (kind === "topics" || kind === "subfields" || kind === "fields") {
    const parts = [rec.subfield?.display_name, rec.field?.display_name, rec.domain?.display_name];
    line = parts.filter(Boolean).join(" · ") || null;
    if (!line && rec.description) line = rec.description;
  } else if (kind === "works") {
    const first = rec.authorships?.[0]?.author?.display_name;
    const more = (rec.authorships || []).length > 1 ? " et al." : "";
    const src = rec.primary_location?.source?.display_name;
    line = [first ? first + more : null, rec.publication_year, src].filter(Boolean).join(" · ") || null;
  } else if (rec.description) {
    line = rec.description;
  }
  if (line && line.length > 140) line = line.slice(0, 137).trimEnd() + "…";
  if (works && kind !== "works") stats.unshift(`${works} works`);
  if (cites) stats.splice(kind === "works" ? 0 : 1, 0, `${cites} citations`);
  return { title, kicker, line, stats };
}

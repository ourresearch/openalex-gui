// Pure helpers for AddWorksSearch.vue. Kept in their own module so they
// can be unit-tested without mounting the component (see
// src/__tests__/addWorksSearch.helpers.test.js).

// English function words that never appear in real personal names. Used to
// disqualify queries like "the state of oa" from the name-ladder path.
// Without this, `looksLikePersonName` passes those queries on the 2-4
// short-word heuristic, the ladder fires, and step 3's first-initial
// expansion produces phrases like `"t oa"` that match noise authorships
// (see oxjob #240 prod bug, 2026-05-25).
const NAME_STOPWORDS = new Set([
  'the', 'of', 'and', 'in', 'for', 'on', 'to', 'a', 'an', 'at',
  'with', 'from', 'by', 'is', 'as',
]);

// raw_author_name.search is fuzzy. We tighten it client-side with a
// deliberately shallow rule — surname must match exactly; the first given
// token must match OR be an initial of the other (so "j priem" still
// finds "Jason Priem", but "Richard J Priem" / co-authors of a Priem
// paper do not). oxjob #187 introduced this; oxjob #240 Phase 2 briefly
// dropped it on the wrong theory that quoted-phrase scoping made it
// redundant — restored 2026-05-25 after Kyle / @jason hit false-positive
// authorships in prod.
export function nameTokens(name) {
  let n = (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z, ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (n.includes(',')) {
    const p = n.split(',').map(x => x.trim()).filter(Boolean);
    n = `${p[1] ? p[1] + ' ' : ''}${p[0] || ''}`;
  }
  return n.split(/\s+/).filter(Boolean);
}

export function looksLikePersonName(query) {
  const words = (query || '').trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (/\d/.test(query)) return false;
  if (/[;:?!]/.test(query)) return false;
  if (words.some(w =>
    NAME_STOPWORDS.has(w.toLowerCase().replace(/[^a-z]/g, ''))
  )) return false;
  const avgLen =
    words.reduce((sum, w) => sum + w.replace(/\./g, '').length, 0) /
    words.length;
  if (avgLen > 10) return false;
  return true;
}

export function detectSearchType(query) {
  const trimmed = (query || '').trim();

  if (trimmed.startsWith('10.') || trimmed.includes('doi.org/')) {
    const doi = trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    return { type: 'doi', value: doi };
  }

  if (
    /^[Ww]\d+$/.test(trimmed) ||
    (trimmed.includes('openalex.org/') && /[Ww]\d+/.test(trimmed))
  ) {
    const match = trimmed.match(/([Ww]\d+)/);
    if (match) return { type: 'openalex_id', value: match[1] };
  }

  // User-typed quotes are a strong "do a phrase title search" signal.
  if (/^["'].*["']$/.test(trimmed)) return { type: 'title', value: trimmed };

  if (looksLikePersonName(trimmed)) {
    return { type: 'author_name', value: trimmed };
  }

  return { type: 'title', value: trimmed };
}

// Build the OR'd quoted-phrase filter value for a given ladder step.
// Returns the value (e.g. `"jane m smith" OR "smith jane m"`) or null if
// the typed query has no name tokens. The phrase set grows in steps 1-3;
// steps 4-5 re-fire the step-3 set with slop ~1 and ~2 respectively (see
// oxjob #240 PLAN.md "Phase 2 — Adaptive progressive-ladder rule").
//   step 1: <typed>
//   step 2: + <last> <first> <middles...>            (comma-reversed)
//          + <first> <last> AND <last> <first>       (drop-middles, ≥3 toks)
//   step 3: + <first[0]> <last> AND <last> <first[0]> (first-initial form)
//   step 4: same phrase set, slop=1
//   step 5: same phrase set, slop=2
//
// Drop-middles was added 2026-05-25 after `jason r priem` returned only
// "J Priem" rows (step 3's first-initial form) instead of the obvious
// "Jason Priem" hits. Step 3 dropped middles AND substituted the first
// with its initial; step 2 needs the full-first / dropped-middles variant
// to keep the higher-specificity tier in the result set.
export function buildLadderFilterValue(tokens, step) {
  if (!tokens.length) return null;
  const phrases = [];
  const seen = new Set();
  const push = p => {
    const k = p.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    phrases.push(p);
  };

  push(tokens.join(' '));

  if (step >= 2 && tokens.length >= 2) {
    const last = tokens[tokens.length - 1];
    const first = tokens[0];
    const rest = tokens.slice(0, -1);
    push([last, ...rest].join(' '));
    // Drop-middles: <first> <last> + reverse. Only meaningful when
    // there ARE middles to drop (≥3 tokens); for 2-token names the
    // typed phrase already IS <first> <last>.
    if (tokens.length >= 3) {
      push(`${first} ${last}`);
      push(`${last} ${first}`);
    }
  }

  if (step >= 3 && tokens.length >= 2 && tokens[0].length > 1) {
    const first0 = tokens[0][0];
    const last = tokens[tokens.length - 1];
    push(`${first0} ${last}`);
    push(`${last} ${first0}`);
  }

  const slop = step === 4 ? 1 : step === 5 ? 2 : 0;
  const suffix = slop > 0 ? `~${slop}` : '';
  return phrases.map(p => `"${p}"${suffix}`).join(' OR ');
}

export function givenMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length === 1 && b.startsWith(a)) return true;
  if (b.length === 1 && a.startsWith(b)) return true;
  return false;
}

export function authorshipMatches(authorship, qTokens) {
  const cand = nameTokens(
    authorship.raw_author_name || authorship.author?.display_name || ''
  );
  if (!cand.length) return false;
  if (qTokens[qTokens.length - 1] !== cand[cand.length - 1]) return false;
  if (qTokens.length === 1) return true;
  return givenMatch(qTokens[0], cand[0]);
}

// Returns the index of the authorship that matches the query name, or -1.
export function findMatchedAuthorship(work, queryName) {
  const q = nameTokens(queryName);
  if (!q.length || !work.authorships?.length) return -1;
  for (let i = 0; i < work.authorships.length; i++) {
    if (authorshipMatches(work.authorships[i], q)) return i;
  }
  return -1;
}

export const MIN_TITLE_SEARCH_WORDS = 2;

// Build the search URLs the dialog should fire for a given text query.
// Title search ALWAYS fires for ≥2-token text queries; the name-ladder
// step-1 URL is returned only when `detectSearchType` classifies the
// query as a person name. Returns `{ titleUrl, ladderStep1Url,
// ladderTokens, detected }`; a null URL means "don't fire this leg."
// DOI / OpenAlex-ID detection is handled by the caller.
export function buildSearchUrls(query, authorShortId, apiBase) {
  const trimmed = (query || '').trim();
  const empty = {
    titleUrl: null, ladderStep1Url: null, ladderTokens: [], detected: null,
  };
  if (!trimmed) return empty;

  const detected = detectSearchType(trimmed);
  const tokenCount = trimmed.split(/\s+/).filter(Boolean).length;
  const exclude = authorShortId
    ? `,authorships.author.id:!${authorShortId}`
    : '';

  const titleUrl = tokenCount >= MIN_TITLE_SEARCH_WORDS
    ? `${apiBase}/works?filter=title.search:${encodeURIComponent(trimmed)}${exclude},type:!paratext&include_xpac=true`
    : null;

  let ladderStep1Url = null;
  let ladderTokens = [];
  if (detected.type === 'author_name') {
    ladderTokens = nameTokens(trimmed);
    const v = buildLadderFilterValue(ladderTokens, 1);
    if (v) {
      ladderStep1Url = `${apiBase}/works?filter=raw_author_name.search:${encodeURIComponent(v)}${exclude},type:!paratext&include_xpac=true`;
    }
  }

  return { titleUrl, ladderStep1Url, ladderTokens, detected };
}

// How many of the typed query's tokens appear as exact-equal tokens of
// the chosen authorship's normalized name. Initial-substituted matches
// (e.g. typed "Jason" vs cand "J") DO NOT count. Surname-match is still
// gated upstream by `findMatchedAuthorship`; this metric is what we
// sort by *within* the gated set.
//
// Walked examples for query "Jason Priem":
//   "Jason Priem"   → 2  (both full)
//   "Jason R Priem" → 2  (jason + priem full; r ignored)
//   "J Priem"       → 1  (priem full; j↔jason is initial sub, no credit)
//
// For query "Jason R Priem":
//   "Jason R Priem" → 3
//   "Jason Priem"   → 2  (no r in cand)
//   "J R Priem"     → 2  (r + priem full; j↔jason is initial sub)
//   "J Priem"       → 1
export function computeFullMatchCount(authorship, queryTokens) {
  const cand = nameTokens(
    authorship.raw_author_name || authorship.author?.display_name || ''
  );
  if (!cand.length || !queryTokens.length) return 0;
  const candSet = new Set(cand);
  let count = 0;
  for (const q of queryTokens) {
    if (candSet.has(q)) count++;
  }
  return count;
}

// True if any authorship on the work points to the profile owner's
// canonical OpenAlex author id. Used to surface "already on your
// profile" rows in dim style (Phase 3) without dropping them — so the
// user can see what's already attributed and we don't silently hide
// the legitimate top-cited paper from view.
export function isAlreadyOnProfile(work, authorShortId) {
  if (!authorShortId || !work.authorships?.length) return false;
  const target = authorShortId.toUpperCase();
  return work.authorships.some(a => {
    const aid = (a.author?.id || '')
      .replace('https://openalex.org/', '')
      .toUpperCase();
    return aid === target;
  });
}

// Merge name-leg + title-leg results into a single sorted stream.
// Name rows are deduped first (priority) — if the same work id appears
// in both legs, the name-source row wins, since the name path went
// through the #187 surname+given gate while the title path uses a
// best-effort authorship pick. After dedup, the merged stream is sorted
// ONCE by `makeResultComparator(detectedType)`. Phase 3's "no re-sort
// during scroll" invariant follows from the fact that this function
// produces the final order; "load more" is a pure client reveal.
export function mergeSortPreflight(nameRows, titleRows, detectedType) {
  const seen = new Set();
  const merged = [];
  for (const w of nameRows) {
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    merged.push(w);
  }
  for (const w of titleRows) {
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    merged.push(w);
  }
  merged.sort(makeResultComparator(detectedType));
  return merged;
}

// Build the row-sort comparator the dialog uses post-prefetch. One
// merged stream, sorted ONCE — scroll never re-orders rows ("load more"
// is a pure client reveal). Sort key:
//   1. For name-typed queries: _fullMatchCount desc (specificity —
//      "Jason Priem" beats "J Priem" beats "Jay Priem")
//      For title-typed queries: _relevanceScore desc (API relevance)
//   2. cited_by_count desc     — within a tier, highly-cited rises
//
// `_alreadyOnProfile` is INTENTIONALLY NOT a sort key — it's a visual
// flag only (dim + "Already on your profile" badge). This matches
// Google Scholar UX: already-on-profile rows interleave with not-on-
// profile rows by relevance, not anchored to the bottom. (oxjob #240
// 2026-05-25 follow-up: the bottom-anchor version surprised users
// because their top-cited papers — usually already on profile — fell
// below low-cited variants they didn't recognize.)
export function makeResultComparator(detectedType) {
  return (a, b) => {
    if (detectedType === 'author_name') {
      if ((b._fullMatchCount || 0) !== (a._fullMatchCount || 0)) {
        return (b._fullMatchCount || 0) - (a._fullMatchCount || 0);
      }
    } else if ((b._relevanceScore || 0) !== (a._relevanceScore || 0)) {
      return (b._relevanceScore || 0) - (a._relevanceScore || 0);
    }
    return (b.cited_by_count || 0) - (a.cited_by_count || 0);
  };
}

// ---------------------------------------------------------------------------
// Cascading authorship matcher (oxjob #882).
//
// Why: when a claimant adds a work by title/DOI/ID and the strict matcher
// above can't find them in the author list, AddWorksSearch.vue used to fall
// back to authorships[0] — silently attaching the claimant to the FIRST
// author and hijacking an innocent co-author's authorship (~420 organic
// cases since May 2026; CNRS-076/077 incident). The cascade tries
// progressively looser name rules, but accepts a looser rule's answer ONLY
// when it identifies exactly ONE authorship. If a loose tier matches 2+
// slots the answer is ambiguous and we refuse (-1) — never guess.
//
// Tiers (strict → loose):
//   1. The exact rule `findMatchedAuthorship` applies today (first hit wins
//      — bit-compatible with historical good matches).
//   2. Comma-order variants: `nameTokens` assumes a comma means
//      "Family, Given" and flips; bylines like "Laureline, Lemoine," are
//      actually "Given, Family," so try BOTH interpretations of both the
//      query and the candidate under the strict rule.
//   3. Initials, position-free: the query's family token must equal SOME
//      candidate token, and every query given token must full- or
//      initial-match a distinct remaining candidate token (candidate-side
//      extra tokens — middle names — are fine; a surname-only candidate
//      passes).
//   4. Any-token overlap: some full (length ≥2) token shared between the
//      two names.
// Tiers 2-4 are uniqueness-gated. No tier matches → -1 (caller must
// refuse to attach, NOT default to slot 0).

// Both plausible token interpretations of a name: comma-flipped (the
// `nameTokens` default, "Family, Given") and literal order (comma treated
// as noise, for "Given, Family," bylines). Deduped; [] for empty input.
export function nameTokenVariants(name) {
  const flipped = nameTokens(name);
  const literal = nameTokens((name || '').replace(/,/g, ' '));
  const out = [];
  if (flipped.length) out.push(flipped);
  if (literal.length && literal.join(' ') !== flipped.join(' ')) {
    out.push(literal);
  }
  return out;
}

// The strict rule of `authorshipMatches`, expressed over token arrays so
// it can be applied to any ordering variant pair.
function tokensStrictMatch(qT, cT) {
  if (!qT.length || !cT.length) return false;
  if (qT[qT.length - 1] !== cT[cT.length - 1]) return false;
  if (qT.length === 1) return true;
  return givenMatch(qT[0], cT[0]);
}

// Tier-3 rule. Position-free within the candidate: the query surname
// (last token) must appear verbatim among the candidate tokens; each
// remaining query token must full- or initial-match a DISTINCT remaining
// candidate token. A candidate reduced to only the surname passes (e.g.
// byline "Lemoine"). Extra unmatched candidate tokens are allowed.
function tokensInitialsMatch(qT, cT) {
  if (!qT.length || !cT.length) return false;
  const surname = qT[qT.length - 1];
  const si = cT.indexOf(surname);
  if (si < 0) return false;
  const rest = cT.slice(0, si).concat(cT.slice(si + 1));
  const givens = qT.slice(0, -1);
  if (!givens.length || !rest.length) return true;
  const used = new Array(rest.length).fill(false);
  for (const g of givens) {
    let found = -1;
    for (let i = 0; i < rest.length; i++) {
      if (!used[i] && givenMatch(g, rest[i])) { found = i; break; }
    }
    if (found < 0) return false;
    used[found] = true;
  }
  return true;
}

// Tier-4 rule: any shared full token (length ≥2 — single letters collide
// on initials far too easily to identify a person).
function tokensOverlapMatch(qT, cT) {
  const cSet = new Set(cT);
  return qT.some(t => t.length >= 2 && cSet.has(t));
}

// Returns the index of the ONE authorship the cascade confidently
// identifies as `queryName`, or -1 (no confident match / ambiguous).
export function findMatchedAuthorshipCascade(work, queryName) {
  return findMatchedAuthorshipCascadeDetail(work, queryName).idx;
}

// Same as `findMatchedAuthorshipCascade`, but also reports WHICH tier
// decided: `{ idx, tier, candidateIdxs }` where tier is 1-4 for a match,
// 'ambiguous' when a loose tier found 2+ slots (refused), and 'none'
// when nothing matched. `candidateIdxs` lists the matching slots: the
// single winner for tiers 1-4, ALL tied slots for 'ambiguous' (so a
// caller with a manual-pick UI — the CV-upload path — can offer exactly
// those), and [] for 'none'. Also used by #882 corpus-audit tooling.
export function findMatchedAuthorshipCascadeDetail(work, queryName) {
  const auths = work.authorships || [];
  if (!auths.length) return { idx: -1, tier: 'none', candidateIdxs: [] };
  const qVariants = nameTokenVariants(queryName);
  if (!qVariants.length) return { idx: -1, tier: 'none', candidateIdxs: [] };

  // Tier 1 — today's strict rule, first hit wins.
  const strictIdx = findMatchedAuthorship(work, queryName);
  if (strictIdx >= 0) return { idx: strictIdx, tier: 1, candidateIdxs: [strictIdx] };

  const candVariants = auths.map(a =>
    nameTokenVariants(a.raw_author_name || a.author?.display_name || '')
  );

  const tierPredicates = [
    // Tier 2 — strict rule over every (query, candidate) ordering pair.
    i => qVariants.some(q =>
      candVariants[i].some(c => tokensStrictMatch(q, c))
    ),
    // Tier 3 — initials, position-free (token multiset; ordering variant
    // of the candidate is irrelevant, so use the first).
    i => candVariants[i].length > 0 && qVariants.some(q =>
      tokensInitialsMatch(q, candVariants[i][0])
    ),
    // Tier 4 — any full-token overlap (both sides order-free).
    i => candVariants[i].length > 0 &&
      tokensOverlapMatch(qVariants[0], candVariants[i][0]),
  ];

  for (let t = 0; t < tierPredicates.length; t++) {
    const pred = tierPredicates[t];
    const hits = [];
    for (let i = 0; i < auths.length; i++) {
      if (pred(i)) hits.push(i);
    }
    // 2+ hits at a loose tier: the tier can't tell WHICH slot is the
    // claimant, and every looser tier is a superset — refuse outright,
    // but hand back the tied slots for callers with a manual-pick UI.
    if (hits.length >= 2) return { idx: -1, tier: 'ambiguous', candidateIdxs: hits };
    if (hits.length === 1) return { idx: hits[0], tier: t + 2, candidateIdxs: hits };
  }
  return { idx: -1, tier: 'none', candidateIdxs: [] };
}

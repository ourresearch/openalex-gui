// Comments in the OQL editor (oxjob #1744, Jason Wed 21 Oct): `#` starts a note to the chat
// that runs to the end of its line. `get works about kelp # only open access` runs as
// "only open access", asked of the chat with `get works about kelp` as the query to change.
// The OQL parser never sees a comment: the editor masks them before /validate and
// /parse-context, so the rest still lints and autocompletes.
// shortcut: the comment marker is `#` outside "..." and [...]; OQL has no `#` of its own today.
// If the language ever gains one, move this into the parser.

// [{from, to}] for each comment, `#` through the end of its line.
export function commentRanges(text) {
  const s = String(text || '');
  const out = [];
  let quote = false;
  let bracket = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '\n') {
      quote = false;
      bracket = false;
    } else if (quote) {
      if (ch === '"') quote = false;
    } else if (bracket) {
      if (ch === ']') bracket = false;
    } else if (ch === '"') {
      quote = true;
    } else if (ch === '[') {
      bracket = true;
    } else if (ch === '#') {
      const end = s.indexOf('\n', i);
      const to = end === -1 ? s.length : end;
      out.push({ from: i, to });
      i = to - 1;
    }
  }
  return out;
}

// The text with every comment blanked to spaces, so offsets (squiggles, the cursor sent to
// /parse-context) still line up with the buffer.
export function maskComments(text) {
  const s = String(text || '');
  const ranges = commentRanges(s);
  if (!ranges.length) return s;
  let out = '';
  let at = 0;
  for (const r of ranges) {
    out += s.slice(at, r.from) + ' '.repeat(r.to - r.from);
    at = r.to;
  }
  return out + s.slice(at);
}

// { oql, note }: the query without its comments (blank lines dropped), and the comments'
// words joined into one instruction ('' when there are none).
export function splitComments(text) {
  const s = String(text || '');
  const ranges = commentRanges(s);
  if (!ranges.length) return { oql: s.trim(), note: '' };
  const note = ranges
    .map((r) => s.slice(r.from + 1, r.to).trim())
    .filter(Boolean)
    .join(' ');
  const oql = maskComments(s)
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => line.trim())
    .join('\n')
    .trim();
  return { oql, note };
}

// True when `pos` sits inside a comment (on or after its `#`).
export function inComment(text, pos) {
  return commentRanges(text).some((r) => pos > r.from && pos <= r.to);
}

// What the editor sends the chat instead of running, or null to run the query: a `#` note
// (#1744) asks for the note, applied to the editor's OQL; plain words typed into the statement
// (#1597; /validate asked with plain_words marks them) send the whole statement as typed,
// applied to the query the editor opened on. Measured on 44 real follow-ups (#1597
// work/plain_words_measure.py): the whole statement 44/44; the plain words alone with the rest
// of the statement 42/44 (alone, "not only retracted ones" lost what it was about).
// { kind: 'note' | 'plain', text, currentQuery } | null.
export function editorAsk(text, validation, openedOn) {
  const { oql, note } = splitComments(text);
  if (note) return { kind: 'note', text: note, currentQuery: oql || null };
  if (!validation?.plain_words || !oql) return null;
  return { kind: 'plain', text: oql, currentQuery: (openedOn || '').trim() || null };
}

// oxjob #1688: one page model, two ways to write it (HTML, Markdown), so the two never drift.
//
// A page is { title, canonical, apiUrl, intro, sections: [{ heading, blocks }] }.
// A block is { p: inline } | { facts: [[label, inline], ...] } | { ol: [inline, ...], start? }.
// An inline is a string, a link { text, href }, code { code } (a filter, say), or an array of inlines. Strings are
// plain text from the API: tags are stripped here, then escaped for the format.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };

// API text can carry markup (<i>E. coli</i>, <sup>2</sup>) and entities; an assistant
// wants the words.
// plain() keeps edge spaces (inline pieces join up: [link, " (journal)"]); clean() trims.
function plain(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/\s+/g, " ");
}

export function clean(s) {
  return plain(s).trim();
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// "_" stays: intraword it is never emphasis, and assistants read the raw text (primary_location).
function escapeMd(s) {
  return s.replace(/([\\`*[\]<>])/g, "\\$1");
}

function inlineHtml(x) {
  if (x === null || x === undefined || x === false) return "";
  if (Array.isArray(x)) return x.map(inlineHtml).join("");
  if (typeof x === "object" && "code" in x) return `<code>${escapeHtml(String(x.code))}</code>`;
  if (typeof x === "object") return `<a href="${escapeHtml(x.href)}">${escapeHtml(clean(x.text ?? x.href))}</a>`;
  return escapeHtml(plain(x));
}

function inlineMd(x) {
  if (x === null || x === undefined || x === false) return "";
  if (Array.isArray(x)) return x.map(inlineMd).join("");
  if (typeof x === "object" && "code" in x) return `\`${String(x.code).replace(/`/g, "'")}\``;
  if (typeof x === "object") {
    const text = clean(x.text ?? x.href);
    if (text === x.href) return x.href; // a bare URL reads best as itself
    const href = x.href.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\s/g, "%20");
    return `[${escapeMd(text)}](${href})`;
  }
  return escapeMd(plain(x));
}

// Joined pieces can double a period ("PeerJ, Inc." + "."); an ellipsis stays.
function tidy(s) {
  return s.replace(/([^.])\.\.(?=\s|$)/g, "$1.");
}

function blocks(page) {
  const out = [];
  if (page.intro) out.push({ p: page.intro });
  for (const s of page.sections) {
    if (s.heading) out.push({ heading: s.heading });
    out.push(...s.blocks);
  }
  return out;
}

export function toMarkdown(page) {
  const parts = [`# ${escapeMd(clean(page.title))}`];
  for (const b of blocks(page)) {
    if (b.heading) parts.push(`## ${escapeMd(clean(b.heading))}`);
    else if (b.p) parts.push(tidy(inlineMd(b.p)));
    else if (b.facts) parts.push(b.facts.map(([k, v]) => `- **${escapeMd(k)}:** ${tidy(inlineMd(v))}`).join("\n"));
    else if (b.ol) parts.push(b.ol.map((v, i) => `${(b.start || 1) + i}. ${tidy(inlineMd(v))}`).join("\n"));
  }
  return parts.join("\n\n") + "\n";
}

export function toHtml(page) {
  const body = [`<h1>${escapeHtml(clean(page.title))}</h1>`];
  for (const b of blocks(page)) {
    if (b.heading) body.push(`<h2>${escapeHtml(clean(b.heading))}</h2>`);
    else if (b.p) body.push(`<p>${tidy(inlineHtml(b.p))}</p>`);
    else if (b.facts) {
      body.push(`<ul>\n${b.facts.map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${tidy(inlineHtml(v))}</li>`).join("\n")}\n</ul>`);
    } else if (b.ol) {
      body.push(`<ol${b.start > 1 ? ` start="${b.start}"` : ""}>\n${b.ol.map((v) => `<li>${tidy(inlineHtml(v))}</li>`).join("\n")}\n</ol>`);
    }
  }
  const head = [
    '<meta charset="utf-8">',
    `<title>${escapeHtml(clean(page.title))} | OpenAlex</title>`,
    '<meta name="robots" content="noindex">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<link rel="canonical" href="${escapeHtml(page.canonical)}">`,
  ];
  if (page.apiUrl) head.push(`<link rel="alternate" type="application/json" href="${escapeHtml(page.apiUrl)}">`);
  return `<!doctype html>\n<html lang="en">\n<head>\n${head.join("\n")}\n</head>\n<body>\n<main>\n${body.join("\n")}\n</main>\n</body>\n</html>\n`;
}

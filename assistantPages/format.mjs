// oxjob #1688: one page model, two ways to write it (HTML, Markdown), so the two never drift.
//
// A page is { title, canonical, apiUrl, intro, sections: [{ heading, blocks }] }.
// A block is { p: inline } | { facts: [[label, inline], ...] } | { ol: [inline, ...], start? }.
// An inline is a string, a link { text, href }, code { code } (a filter, say), or an array of inlines.
// Strings are plain text from the API: tags are stripped here, then escaped for the format.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };

// API text can carry markup (<i>E. coli</i>, <sup>2</sup>) and entities; an assistant wants the words.
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

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// "_" stays: intraword it is never emphasis, and assistants read the raw text (primary_location).
const escapeMd = (s) => s.replace(/([\\`*[\]<>])/g, "\\$1");

const HTML = {
  text: escapeHtml,
  code: (c) => `<code>${escapeHtml(c)}</code>`,
  link: (text, href) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`,
  h1: (s) => `<h1>${escapeHtml(s)}</h1>`,
  h2: (s) => `<h2>${escapeHtml(s)}</h2>`,
  p: (s) => `<p>${s}</p>`,
  facts: (rows) => `<ul>\n${rows.map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${v}</li>`).join("\n")}\n</ul>`,
  ol: (items, start) => `<ol${start > 1 ? ` start="${start}"` : ""}>\n${items.map((v) => `<li>${v}</li>`).join("\n")}\n</ol>`,
};

const MD = {
  text: escapeMd,
  code: (c) => `\`${c.replace(/`/g, "'")}\``,
  // a bare URL reads best as itself
  link: (text, href) => (text === href ? href : `[${escapeMd(text)}](${href.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\s/g, "%20")})`),
  h1: (s) => `# ${escapeMd(s)}`,
  h2: (s) => `## ${escapeMd(s)}`,
  p: (s) => s,
  facts: (rows) => rows.map(([k, v]) => `- **${escapeMd(k)}:** ${v}`).join("\n"),
  ol: (items, start) => items.map((v, i) => `${(start || 1) + i}. ${v}`).join("\n"),
};

function inline(x, f) {
  if (x === null || x === undefined || x === false) return "";
  if (Array.isArray(x)) return x.map((y) => inline(y, f)).join("");
  if (typeof x === "object" && "code" in x) return f.code(String(x.code));
  if (typeof x === "object") return f.link(clean(x.text ?? x.href), x.href);
  return f.text(plain(x));
}

function body(page, f) {
  const out = [f.h1(clean(page.title))];
  const blocks = page.intro ? [{ p: page.intro }] : [];
  for (const s of page.sections) {
    if (s.heading) blocks.push({ heading: s.heading });
    blocks.push(...s.blocks);
  }
  for (const b of blocks) {
    if (b.heading) out.push(f.h2(clean(b.heading)));
    else if (b.p) out.push(f.p(inline(b.p, f)));
    else if (b.facts) out.push(f.facts(b.facts.map(([k, v]) => [k, inline(v, f)])));
    else if (b.ol) out.push(f.ol(b.ol.map((v) => inline(v, f)), b.start));
  }
  return out;
}

export function toMarkdown(page) {
  return body(page, MD).join("\n\n") + "\n";
}

export function toHtml(page) {
  const head = [
    '<meta charset="utf-8">',
    `<title>${escapeHtml(clean(page.title))} | OpenAlex</title>`,
    '<meta name="robots" content="noindex">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<link rel="canonical" href="${escapeHtml(page.canonical)}">`,
  ];
  if (page.apiUrl) head.push(`<link rel="alternate" type="application/json" href="${escapeHtml(page.apiUrl)}">`);
  return `<!doctype html>\n<html lang="en">\n<head>\n${head.join("\n")}\n</head>\n<body>\n<main>\n${body(page, HTML).join("\n")}\n</main>\n</body>\n</html>\n`;
}

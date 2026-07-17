// Tiny, dependency-free Markdown -> HTML renderer for the OQL Guide page
// (oxjob #361). The GUI has no markdown library and the dev playground doesn't
// warrant adding one; this covers exactly the constructs docs/oql-spec.md uses:
// ATX headings, fenced code blocks (```), blockquotes, unordered/ordered lists,
// tables, horizontal rules, paragraphs, and inline code/bold/italic/links.
//
// Input is our OWN trusted artifact fetched from elastic-api (not user content),
// but we still HTML-escape every text segment before emitting, so a stray `<` in
// the spec can't inject markup. Output is consumed via v-html on sanitized,
// first-party text.

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Inline: `code`, **bold**, *italic*, [text](url). Applied to already-escaped text.
function inline(text) {
  let t = text;
  // inline code first (so ** inside `code` is left literal)
  t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // links [text](href) — href escaped already; allow only http(s)/relative
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, href) => {
    const safe = /^(https?:\/\/|\/|#)/.test(href) ? href : "#";
    return `<a href="${safe}" target="_blank" rel="noopener">${txt}</a>`;
  });
  return t;
}

export function renderMarkdown(md) {
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let para = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(esc(para.join(" ")))}</p>`);
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      flushPara();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      out.push(`<pre class="md-code"><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushPara();
      out.push("<hr/>");
      i++;
      continue;
    }

    // ATX heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      const level = h[1].length;
      out.push(`<h${level}>${inline(esc(h[2].trim()))}</h${level}>`);
      i++;
      continue;
    }

    // blockquote (collapse consecutive > lines)
    if (/^>\s?/.test(line)) {
      flushPara();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(esc(buf.join(" ")))}</blockquote>`);
      continue;
    }

    // table (a header row with | then a |---| separator)
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara();
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2);
      let html = "<table class='md-table'><thead><tr>";
      html += head.map((c) => `<th>${inline(esc(c))}</th>`).join("");
      html += "</tr></thead><tbody>";
      for (const r of body) {
        html += "<tr>" + cells(r).map((c) => `<td>${inline(esc(c))}</td>`).join("") + "</tr>";
      }
      html += "</tbody></table>";
      out.push(html);
      continue;
    }

    // A hard-wrapped list item continues on indented follow-up lines (standard
    // markdown "lazy continuation"). Absorb any line that starts with whitespace
    // and isn't itself a new item / blank / block construct.
    const isListContinuation = (l) =>
      /^\s+\S/.test(l) &&
      !/^\s*[-*+]\s+/.test(l) &&
      !/^\s*\d+\.\s+/.test(l) &&
      !/^\s*(#{1,6}\s|```|>|\||---)/.test(l);

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*[-*+]\s+/, "");
        i++;
        while (i < lines.length && isListContinuation(lines[i])) {
          item += " " + lines[i].trim();
          i++;
        }
        items.push(item);
      }
      out.push("<ul>" + items.map((it) => `<li>${inline(esc(it))}</li>`).join("") + "</ul>");
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*\d+\.\s+/, "");
        i++;
        while (i < lines.length && isListContinuation(lines[i])) {
          item += " " + lines[i].trim();
          i++;
        }
        items.push(item);
      }
      out.push("<ol>" + items.map((it) => `<li>${inline(esc(it))}</li>`).join("") + "</ol>");
      continue;
    }

    // blank line ends a paragraph
    if (/^\s*$/.test(line)) {
      flushPara();
      i++;
      continue;
    }

    // otherwise accumulate paragraph text
    para.push(line.trim());
    i++;
  }
  flushPara();
  return out.join("\n");
}

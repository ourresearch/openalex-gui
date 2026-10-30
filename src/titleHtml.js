// oxjob #1928: titles render with v-html after sanitize-html, which drops anything shaped like a tag, so a '<' that is
// text vanished with the words after it ("<Hygrophila phlomoides> Nees" showed " Nees"). Each text '<' is escaped
// first (rule: seo/titleMarkup.mjs); markup is handled as before: b/i/em/strong/a kept, other tags dropped, text kept.
import sanitizeHtml from "sanitize-html";
import { escapeTextLessThan } from "./seo/titleMarkup.mjs";

const ALLOWED_TAGS = ["b", "i", "em", "strong", "a"];

export function titleHtml(title) {
  return sanitizeHtml(escapeTextLessThan(title), { allowedTags: ALLOWED_TAGS });
}

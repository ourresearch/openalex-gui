// Canonical icon per work type — single source of truth (#720).
// Keys = the full live /types vocabulary (25 types as of 2026-07-31).
// All names verified to exist in @mdi/font 7.4.47 (the GUI's installed version).
// Intended home: openalex-gui/src/typeIcons.js. First consumer: #686 hero feed.

const typeIcons = {
  "article": "mdi-file-document-outline", // matches the works entity icon
  "preprint": "mdi-file-clock-outline",
  "review": "mdi-text-box-search-outline",
  "dataset": "mdi-database-outline",
  "data-paper": "mdi-file-table-outline",
  "software": "mdi-code-braces",
  "software-paper": "mdi-file-code-outline",
  "book": "mdi-book-outline",
  "book-chapter": "mdi-book-open-page-variant-outline",
  "book-review": "mdi-book-search-outline",
  "reference-entry": "mdi-alphabetical-variant",
  "dissertation": "mdi-school-outline",
  "conference-paper": "mdi-presentation",
  "conference-abstract": "mdi-card-text-outline",
  "report": "mdi-clipboard-text-outline",
  "standard": "mdi-certificate-outline",
  "editorial": "mdi-newspaper-variant-outline",
  "letter": "mdi-email-outline",
  "peer-review": "mdi-comment-check-outline",
  "erratum": "mdi-file-document-edit-outline",
  "retraction": "mdi-file-document-remove-outline",
  "paratext": "mdi-text-box-outline",
  "supplementary-materials": "mdi-paperclip",
  "libguides": "mdi-compass-outline",
  "other": "mdi-file-question-outline",
};

const fallbackTypeIcon = "mdi-file-outline";

export function getTypeIcon(typeId) {
  // accepts a bare key ("article") or a full id ("https://openalex.org/types/article")
  const key = String(typeId ?? "").split("/").pop();
  return typeIcons[key] ?? fallbackTypeIcon;
}

export { typeIcons, fallbackTypeIcon };

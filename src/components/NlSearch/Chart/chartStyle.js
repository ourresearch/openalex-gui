// Colours, ink and number formats for the result charts (oxjob #1745).
// Palette: the dataviz skill's validated reference palette (light; the site has no dark theme).
// Validated with the skill's validate_palette.js; see the job's ACCEPTANCE.md Test 4.

export const INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  baseline: "#c3c2b7",
  surface: "#ffffff", // the page is white; gaps between marks are drawn in it
  empty: "#f0efec", // a country with no works
};

// Categorical slots, in this fixed order (the order is the colour-blind safety, never cycled).
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
export const OTHER = "#c3c2b7";

// Sequential blue for magnitude (maps, heatmaps): light = few, dark = many.
export const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];

// Open-access statuses wear their own names' colours, so a reader who knows "gold" and
// "green" OA reads the chart without the legend. Closed is the neutral gray.
export const OA_COLORS = {
  diamond: "#6da7ec",
  gold: "#eda100",
  green: "#1baf7a",
  hybrid: "#6250d6",
  bronze: "#b0652a",
  closed: "#c3c2b7",
};

export const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

const nf = (opts) => new Intl.NumberFormat("en-US", opts);
const COMPACT = nf({ notation: "compact", maximumFractionDigits: 1 });
const INT = nf({ maximumFractionDigits: 0 });
const DEC = nf({ maximumFractionDigits: 2 });
const PCT = nf({ maximumFractionDigits: 1 });

// A value as text: "11,013", "85.2%", "2.47"; `short` compacts big counts ("1.4M").
export function formatValue(measure, v, { short = false } = {}) {
  if (v == null || Number.isNaN(v)) return "–";
  if (typeof v !== "number") return String(v);
  if (measure?.percent) return `${PCT.format(v)}%`;
  if (Number.isInteger(v)) return short && Math.abs(v) >= 100000 ? COMPACT.format(v) : INT.format(v);
  return DEC.format(v);
}

// Axis ticks: "0", "2K", "1.5M", "40%".
export const tickFormat = (measure) => (v) => (measure?.percent ? `${PCT.format(v)}%` : COMPACT.format(v));

// Cut a long name to fit a label column; the tooltip carries the full name.
export function truncate(s, n) {
  const t = String(s ?? "");
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

// Approximate rendered width of a label at 12 px (no DOM needed).
export const textWidth = (s, px = 12) => String(s ?? "").length * px * 0.6;

// Notes as one line: "Top 15 of 32,864 institutions; 2026 is the year so far".
export function joinNotes(parts) {
  const p = parts.filter(Boolean).map((s, i) => (i ? s.charAt(0).toLowerCase() + s.slice(1) : s));
  return p.join("; ");
}

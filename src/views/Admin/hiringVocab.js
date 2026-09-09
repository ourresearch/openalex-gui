// Hiring viewer vocabulary (oxjob #868). Mirrors openalex-users-api/job_roles.py
// (STAGES, NOTE_KINDS, OWNERS, ROLE_SLUGS) — the API validates against those;
// keep the two in sync when a stage/kind/owner is added.

export const ROLE_TITLES = {
  'software-engineer': 'Software Engineer',
  'community-lead': 'Community Lead',
  'operations-associate': 'Operations Associate',
};

export const roleTitle = (slug) => ROLE_TITLES[slug] || slug || '—';

// In process order; terminal states + the internal marker last.
export const STAGES = [
  'new', 'screened', 'round-1', 'take-home', 'round-2', 'offer',
  'hired', 'rejected', 'withdrew', 'test-row',
];

export const STAGE_COLORS = {
  'new': 'blue',
  'screened': 'teal',
  'round-1': 'indigo',
  'take-home': 'deep-purple',
  'round-2': 'purple',
  'offer': 'orange',
  'hired': 'green',
  'rejected': 'grey',
  'withdrew': 'grey',
  'test-row': 'grey-lighten-1',
};

export const OWNERS = ['jason', 'casey', 'kyle', 'rohan'];

export const NOTE_KINDS = [
  { value: 'screen', title: 'Screen', icon: 'mdi-filter-outline' },
  { value: 'r1-notes', title: 'Round 1 — notes', icon: 'mdi-account-outline' },
  { value: 'r1-transcript', title: 'Round 1 — transcript', icon: 'mdi-text-long' },
  { value: 'takehome-brief', title: 'Take-home — brief', icon: 'mdi-briefcase-outline' },
  { value: 'takehome-review', title: 'Take-home — review', icon: 'mdi-briefcase-check-outline' },
  { value: 'r2-notes', title: 'Round 2 — notes', icon: 'mdi-account-group-outline' },
  { value: 'r2-transcript', title: 'Round 2 — transcript', icon: 'mdi-text-long' },
  { value: 'ai-assessment', title: 'AI assessment', icon: 'mdi-robot-outline' },
  { value: 'decision', title: 'Decision', icon: 'mdi-gavel' },
  { value: 'other', title: 'Other', icon: 'mdi-note-outline' },
];

export const noteKindMeta = (kind) =>
  NOTE_KINDS.find((k) => k.value === kind) || { value: kind, title: kind, icon: 'mdi-note-outline' };

// Per-person ratings (oxjob #992). Mirrors job_roles.py VERDICTS + RATER_BY_USER_ID —
// the API derives the rater from the caller; this mirror only decides what the UI
// shows. Keep both maps in sync.
export const VERDICTS = ['no', 'maybe', 'yes'];

export const VERDICT_COLORS = {
  yes: 'green',
  maybe: 'amber',
  no: 'grey',
};

// Display order for rating rows/chips.
export const RATERS = ['jason', 'casey', 'kyle', 'rohan'];

export const RATER_BY_USER_ID = {
  'user-TSamuHxDbnhn': 'jason',       // wordslikethis@gmail.com
  'user-WtSjPhQ5KiAk': 'jason',       // jason@ourresearch.org
  '7PUpb9cUxP24EUnn7FK1of': 'casey',  // caseym@gmail.com
  'user-7T8J8achwL4r': 'kyle',        // kyle@ourresearch.org
  'user-NYwtnFt4dWzA': 'kyle',        // kyle@openalex.org
  'urB82AJTZfVbo9QHqtxrcf': 'kyle',   // kyle.demes@gmail.com
};

// ai_triage_score (1-3) is a verdict too (1 no / 2 maybe / 3 yes) — triage v4.
export const SCORE_VERDICTS = { 1: 'no', 2: 'maybe', 3: 'yes' };

// attributes.region (auto-classified; hiring/process/attributes.md).
export const REGIONS = [
  { value: 'americas', title: 'Americas' },
  { value: 'europe', title: 'Europe' },
  { value: 'other', title: 'Other' },
];

export const formatAttrValue = (v) => {
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

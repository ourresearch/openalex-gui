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

export const formatAttrValue = (v) => {
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

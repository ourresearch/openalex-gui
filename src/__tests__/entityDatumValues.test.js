import { describe, it, expect } from 'vitest';

import { entityLinkItems, stringItems } from '@/components/Entity/entityDatumValues';

// The bug this file exists for (oxjob #619, reported by CNRS/Inist as q5.5):
// on https://openalex.org/works/W2134293572 NONE of the author names were
// clickable, even though two of the three authors have perfectly good author
// ids. The third byline entry is the group author "WHO Consultation", which has
// no author id — and the row demanded that EVERY item carry an id before it
// would render any links at all.
const W2134293572_AUTHORS = [
  { id: 'https://openalex.org/A5108525331', display_name: 'K. G. M. M. Alberti', raw_author_name: 'K.G.M.M. Alberti' },
  { id: 'https://openalex.org/A5019887736', display_name: 'Paul Zimmet', raw_author_name: 'P.Z. Zimmet' },
  { id: null, display_name: 'WHO Consultation', raw_author_name: 'WHO Consultation' },
];

describe('entityLinkItems', () => {
  it('links the authors it can on a work with an unresolved group author', () => {
    const items = entityLinkItems(W2134293572_AUTHORS);
    expect(items).toHaveLength(3);
    expect(items.filter(i => i.id).map(i => i.display_name))
      .toEqual(['K. G. M. M. Alberti', 'Paul Zimmet']);
    // The unlinkable one is still returned — the template renders it as text.
    expect(items[2].id).toBeNull();
  });

  it('handles a list where every item resolved', () => {
    const items = entityLinkItems(W2134293572_AUTHORS.slice(0, 2));
    expect(items).toHaveLength(2);
  });

  it('returns null when no item resolved, so the value renders as strings', () => {
    expect(entityLinkItems([{ id: null, display_name: 'WHO Consultation' }])).toBeNull();
  });

  it('returns null for a plain list of strings', () => {
    expect(entityLinkItems(['J. Smith', 'John Smith'])).toBeNull();
  });

  it('wraps a single entity object', () => {
    const one = { id: 'https://openalex.org/A5019887736', display_name: 'Paul Zimmet' };
    expect(entityLinkItems(one)).toEqual([one]);
  });

  it('tolerates null members, an empty list, and non-arrays', () => {
    expect(entityLinkItems([null, { id: 'https://openalex.org/A1' }])).toHaveLength(1);
    expect(entityLinkItems([])).toBeNull();
    expect(entityLinkItems(null)).toBeNull();
    expect(entityLinkItems('a string')).toBeNull();
    expect(entityLinkItems(42)).toBeNull();
  });
});

describe('stringItems', () => {
  it('yields nothing for a mixed entity list, so the row cannot render twice', () => {
    // The two branches sit in separate v-ifs in the template: if both returned
    // a value the author list would appear twice on the page.
    expect(entityLinkItems(W2134293572_AUTHORS)).not.toBeNull();
    expect(stringItems(W2134293572_AUTHORS)).toBeNull();
  });

  it('yields nothing for a fully-resolved entity list', () => {
    expect(stringItems(W2134293572_AUTHORS.slice(0, 2))).toBeNull();
  });

  it('renders a plain string list', () => {
    expect(stringItems(['J. Smith', 'John Smith'])).toEqual(['J. Smith', 'John Smith']);
  });

  it('falls back to display_name when nothing in the list resolved', () => {
    expect(stringItems([{ id: null, display_name: 'WHO Consultation' }]))
      .toEqual(['WHO Consultation']);
  });

  it('drops nulls and stringifies anything else', () => {
    expect(stringItems([null, undefined, 7])).toEqual(['7']);
  });

  it('returns null for non-arrays', () => {
    expect(stringItems(null)).toBeNull();
    expect(stringItems('a string')).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buckets, classifyIntent, features, fnv1a16, loadIntentModel } from '../intent/intentModel.js';
import { footerSearchEntityType, INTENT_VETO_CONFIDENCE } from '../components/searchBox.helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(here, 'fixtures', 'intent-buckets.json'), 'utf8'));
const weights = JSON.parse(readFileSync(join(here, '..', '..', 'public', 'intent-weights.json'), 'utf8'));
const model = loadIntentModel(weights);

describe('intent feature hashing (parity with the Python reference, oxjob #1347)', () => {
  it('FNV-1a over UTF-16 code units matches known values', () => {
    expect(fnv1a16('')).toBe(0x811c9dc5);
    expect(fnv1a16('a')).toBe(0xe40c292c);
  });

  it('reproduces the Python bucket sets for 327 strings (edge cases, real queries, synthetic)', () => {
    let mismatches = 0;
    for (const r of fixture.rows) {
      const b = buckets(r.q, fixture.log2);
      if (b.length !== r.buckets.length || !b.every((v, i) => v === r.buckets[i])) mismatches++;
    }
    expect(mismatches).toBe(0);
  });

  it('is total: empty, whitespace, emoji and non-BMP input do not throw', () => {
    for (const q of ['', '   ', '😀', '𝔘𝔫𝔦𝔠𝔬𝔡𝔢', null, undefined]) {
      expect(() => features(q)).not.toThrow();
      expect(() => classifyIntent(model, q)).not.toThrow();
    }
  });
});

describe('intent model (shipped weights)', () => {
  const cases = [
    ['Climate OR change', 'boolean'],
    ['("climate risk" OR "climate-related risk") AND ("financial regulation")', 'boolean'],
    ['10.1038/s41586-020-2649-2', 'identifier'],
    ['0000-0002-1825-0097', 'identifier'],
    ['W2741809807', 'identifier'],
    ['harvard university', 'institution'],
    ['Assessing the heterogeneity of treatment effects by identifying the treatment benefit rate', 'title'],
    ['what causes tides on earth?', 'question'],
    ['Smith J, Jones A. Nature. 2019;567(7748):123-130. doi:10.1038/x', 'reference'],
  ];
  it.each(cases)('%s → %s', (q, label) => {
    expect(classifyIntent(model, q).label).toBe(label);
  });

  it('returns a distribution and a confidence in [0, 1]', () => {
    const r = classifyIntent(model, 'machine learning');
    const total = Object.values(r.probs).reduce((a, b) => a + b, 0);
    expect(Math.abs(total - 1)).toBeLessThan(1e-9);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });

  it('classifies in well under a millisecond', () => {
    const qs = fixture.rows.map((r) => r.q);
    const t0 = performance.now();
    for (let i = 0; i < 5000; i++) classifyIntent(model, qs[i % qs.length]);
    expect((performance.now() - t0) / 5000).toBeLessThan(0.2);
  });
});

describe('footerSearchEntityType with an intent', () => {
  const hi = (label) => ({ label, confidence: INTENT_VETO_CONFIDENCE });
  const lo = (label) => ({ label, confidence: INTENT_VETO_CONFIDENCE - 0.01 });

  it('keeps the #820 rule when there is no intent yet', () => {
    expect(footerSearchEntityType(['institutions', 'institutions'], 'works')).toBe('institutions');
    expect(footerSearchEntityType(['institutions', 'institutions'], 'works', null)).toBe('institutions');
  });

  it('a confident works-query intent vetoes the swap (the CNRS "Climate OR change" case)', () => {
    for (const label of ['boolean', 'title', 'question', 'identifier', 'topic']) {
      expect(footerSearchEntityType(['institutions', 'institutions'], 'works', hi(label))).toBe('works');
    }
  });

  it('an unconfident intent changes nothing', () => {
    expect(footerSearchEntityType(['institutions', 'institutions'], 'works', lo('boolean'))).toBe('institutions');
    expect(footerSearchEntityType(['institutions', 'keywords'], 'works', lo('institution'))).toBe('works');
  });

  it('a confident entity intent swaps when that type is among the suggestions, even if mixed', () => {
    expect(footerSearchEntityType(['authors', 'keywords', 'works'], 'works', hi('author'))).toBe('authors');
    expect(footerSearchEntityType(['keywords', 'works'], 'works', hi('author'))).toBe('works');
  });

  it('never swaps away from a non-works box on intent alone', () => {
    expect(footerSearchEntityType(['authors'], 'sources', hi('author'))).toBe('authors'); // #820 rule still applies
    expect(footerSearchEntityType(['keywords'], 'sources', hi('author'))).toBe('sources');
  });
});

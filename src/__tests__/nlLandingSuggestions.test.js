import { describe, it, expect } from 'vitest';
import { LANDING_SUGGESTIONS, pickSuggestions } from '../components/NlSearch/nlLandingSuggestions.js';

// Small seeded PRNG (mulberry32) so picks are reproducible.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('LANDING_SUGGESTIONS (oxjob #1744)', () => {
  it('has 30+ entries, each non-empty, at most 120 characters, with a known kind', () => {
    expect(LANDING_SUGGESTIONS.length).toBeGreaterThanOrEqual(30);
    for (const s of LANDING_SUGGESTIONS) {
      expect(typeof s.text).toBe('string');
      expect(s.text.trim().length).toBeGreaterThan(0);
      expect(s.text.length).toBeLessThanOrEqual(120);
      expect(['question', 'keyword', 'review']).toContain(s.kind);
    }
  });

  it('has no duplicates', () => {
    const texts = LANDING_SUGGESTIONS.map((s) => s.text.trim().toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('is mostly questions, with some keyword and review searches', () => {
    const count = (k) => LANDING_SUGGESTIONS.filter((s) => s.kind === k).length;
    expect(count('question')).toBeGreaterThan(LANDING_SUGGESTIONS.length / 2);
    expect(count('keyword')).toBeGreaterThanOrEqual(3);
    expect(count('review')).toBeGreaterThanOrEqual(3);
  });
});

describe('pickSuggestions', () => {
  it('returns 3 distinct entries with at least one question and one keyword', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const picks = pickSuggestions(LANDING_SUGGESTIONS, 3, seeded(seed));
      expect(picks).toHaveLength(3);
      expect(new Set(picks.map((s) => s.text)).size).toBe(3);
      expect(picks.some((s) => s.kind === 'question')).toBe(true);
      expect(picks.some((s) => s.kind === 'keyword')).toBe(true);
      for (const p of picks) expect(LANDING_SUGGESTIONS).toContain(p);
    }
  });

  it('is deterministic for a seeded rand', () => {
    const a = pickSuggestions(LANDING_SUGGESTIONS, 3, seeded(42));
    const b = pickSuggestions(LANDING_SUGGESTIONS, 3, seeded(42));
    expect(a).toEqual(b);
  });

  it('rotates: different seeds give different picks, and reviews show up often', () => {
    const seen = new Set();
    let withReview = 0;
    let questionFirst = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const picks = pickSuggestions(LANDING_SUGGESTIONS, 3, seeded(seed));
      picks.forEach((s) => seen.add(s.text));
      if (picks.some((s) => s.kind === 'review')) withReview++;
      if (picks[0].kind === 'question') questionFirst++;
    }
    expect(seen.size).toBeGreaterThan(LANDING_SUGGESTIONS.length * 0.8);
    expect(withReview).toBeGreaterThan(200 * 0.25);
    // Order is shuffled, not always question first.
    expect(questionFirst).toBeLessThan(200);
  });

  it('handles short lists and other n', () => {
    const tiny = [
      { text: 'a question?', kind: 'question' },
      { text: 'kw', kind: 'keyword' },
    ];
    expect(pickSuggestions(tiny, 3, seeded(1))).toHaveLength(2);
    expect(pickSuggestions(LANDING_SUGGESTIONS, 5, seeded(7))).toHaveLength(5);
    expect(pickSuggestions([], 3, seeded(1))).toEqual([]);
  });

  it('works with the default Math.random', () => {
    const picks = pickSuggestions();
    expect(picks).toHaveLength(3);
  });
});

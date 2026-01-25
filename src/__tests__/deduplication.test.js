/**
 * Deduplication Tests
 *
 * Tests for the vector search result deduplication utilities.
 * Covers both the nested API structure { score, work: {...} }
 * and flat structures { title, cited_by_count, ... }.
 */

import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  normalizeTitle,
  titleSimilarity,
  clusterDuplicates,
  selectBestFromCluster,
  deduplicateResults,
  extractWork,
  getTitle,
  getCitedByCount,
  getPublicationYear,
  getScore,
} from '@/utils/deduplication';

// =============================================================================
// HELPER FUNCTION TESTS (for nested API structure)
// =============================================================================

describe('extractWork', () => {
  it('extracts work from nested structure', () => {
    const result = { score: 0.95, work: { title: 'Test', cited_by_count: 10 } };
    expect(extractWork(result)).toEqual({ title: 'Test', cited_by_count: 10 });
  });

  it('returns object directly for flat structure', () => {
    const result = { title: 'Test', cited_by_count: 10 };
    expect(extractWork(result)).toEqual({ title: 'Test', cited_by_count: 10 });
  });

  it('handles null/undefined', () => {
    expect(extractWork(null)).toBe(null);
    expect(extractWork(undefined)).toBe(null);
  });
});

describe('getTitle', () => {
  it('gets title from nested structure', () => {
    const result = { score: 0.95, work: { title: 'Test Title' } };
    expect(getTitle(result)).toBe('Test Title');
  });

  it('gets title from flat structure', () => {
    const result = { title: 'Test Title' };
    expect(getTitle(result)).toBe('Test Title');
  });

  it('falls back to display_name', () => {
    const result = { work: { display_name: 'Display Name' } };
    expect(getTitle(result)).toBe('Display Name');
  });

  it('returns empty string for missing title', () => {
    expect(getTitle({})).toBe('');
    expect(getTitle(null)).toBe('');
  });
});

describe('getCitedByCount', () => {
  it('gets cited_by_count from nested structure', () => {
    const result = { score: 0.95, work: { cited_by_count: 100 } };
    expect(getCitedByCount(result)).toBe(100);
  });

  it('gets cited_by_count from flat structure', () => {
    const result = { cited_by_count: 100 };
    expect(getCitedByCount(result)).toBe(100);
  });

  it('returns 0 for missing', () => {
    expect(getCitedByCount({})).toBe(0);
  });
});

describe('getScore', () => {
  it('gets score from nested structure (top level)', () => {
    const result = { score: 0.95, work: { title: 'Test' } };
    expect(getScore(result)).toBe(0.95);
  });

  it('gets score from flat structure', () => {
    const result = { score: 0.85 };
    expect(getScore(result)).toBe(0.85);
  });

  it('falls back to relevance_score', () => {
    const result = { work: { relevance_score: 0.75 } };
    expect(getScore(result)).toBe(0.75);
  });
});

// =============================================================================
// LEVENSHTEIN DISTANCE TESTS
// =============================================================================

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns length of other string when one is empty', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
  });

  it('calculates distance for single character changes', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    expect(levenshteinDistance('cat', 'cart')).toBe(1);
    expect(levenshteinDistance('cart', 'cat')).toBe(1);
  });

  it('calculates distance for multiple changes', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});

// =============================================================================
// NORMALIZE TITLE TESTS
// =============================================================================

describe('normalizeTitle', () => {
  it('converts to lowercase', () => {
    expect(normalizeTitle('HELLO WORLD')).toBe('hello world');
  });

  it('removes punctuation', () => {
    expect(normalizeTitle('Hello, World!')).toBe('hello world');
    expect(normalizeTitle('test: a study')).toBe('test a study');
  });

  it('collapses whitespace', () => {
    expect(normalizeTitle('hello   world')).toBe('hello world');
    expect(normalizeTitle('  hello  world  ')).toBe('hello world');
  });

  it('handles empty and null inputs', () => {
    expect(normalizeTitle('')).toBe('');
    expect(normalizeTitle(null)).toBe('');
    expect(normalizeTitle(undefined)).toBe('');
  });
});

// =============================================================================
// TITLE SIMILARITY TESTS
// =============================================================================

describe('titleSimilarity', () => {
  it('returns 1.0 for identical titles', () => {
    expect(titleSimilarity('Hello World', 'Hello World')).toBe(1.0);
  });

  it('returns 1.0 for titles that normalize to same string', () => {
    expect(titleSimilarity('Hello, World!', 'hello world')).toBe(1.0);
  });

  it('returns 0.0 when one title is empty', () => {
    expect(titleSimilarity('Hello', '')).toBe(0.0);
  });

  it('returns high similarity for minor variations', () => {
    const sim = titleSimilarity('Wind Power and Bird Deaths', 'Wind Power and Bird Death');
    expect(sim).toBeGreaterThan(0.95);
  });

  it('returns lower similarity for significant differences', () => {
    const sim = titleSimilarity(
      'Wind Power and Bird Deaths',
      'Wind Power and Bird Deaths: A 2017 Updated Synthesis'
    );
    expect(sim).toBeLessThan(0.90);
  });
});

// =============================================================================
// CLUSTER DUPLICATES TESTS - Nested Structure
// =============================================================================

describe('clusterDuplicates with nested structure', () => {
  it('returns empty array for empty input', () => {
    expect(clusterDuplicates([])).toEqual([]);
    expect(clusterDuplicates(null)).toEqual([]);
  });

  it('puts each unique title in its own cluster', () => {
    const results = [
      { score: 0.9, work: { title: 'Machine Learning in Healthcare' } },
      { score: 0.8, work: { title: 'Deep Ocean Exploration' } },
      { score: 0.7, work: { title: 'Climate Change Effects' } },
    ];
    const clusters = clusterDuplicates(results);
    expect(clusters.length).toBe(3);
    expect(clusters.every(c => c.length === 1)).toBe(true);
  });

  it('groups identical titles together', () => {
    const results = [
      { score: 0.9, work: { title: 'Machine Learning' } },
      { score: 0.8, work: { title: 'Machine Learning' } },
      { score: 0.7, work: { title: 'Deep Ocean' } },
    ];
    const clusters = clusterDuplicates(results);
    expect(clusters.length).toBe(2);
    expect(clusters[0].length).toBe(2);
    expect(clusters[1].length).toBe(1);
  });

  it('groups similar titles above threshold', () => {
    const results = [
      { score: 0.9, work: { title: 'Estimates and correlates of bird and bat mortality' } },
      { score: 0.8, work: { title: 'Estimates and correlates of bird and bat mortality' } },
      { score: 0.7, work: { title: 'Ocean Biology Research' } },
    ];
    const clusters = clusterDuplicates(results, 0.90);
    expect(clusters.length).toBe(2);
    expect(clusters[0].length).toBe(2);
  });
});

// =============================================================================
// SELECT BEST FROM CLUSTER TESTS - Nested Structure
// =============================================================================

describe('selectBestFromCluster with nested structure', () => {
  it('returns null for empty cluster', () => {
    expect(selectBestFromCluster([])).toBe(null);
    expect(selectBestFromCluster(null)).toBe(null);
  });

  it('returns single item from single-item cluster', () => {
    const item = { score: 0.9, work: { title: 'Test', cited_by_count: 10 } };
    expect(selectBestFromCluster([item])).toBe(item);
  });

  it('selects by highest citation count (primary)', () => {
    const results = [
      { score: 0.9, work: { title: 'Test', cited_by_count: 10 } },
      { score: 0.8, work: { title: 'Test', cited_by_count: 100 } },
      { score: 0.7, work: { title: 'Test', cited_by_count: 50 } },
    ];
    const best = selectBestFromCluster(results);
    expect(getCitedByCount(best)).toBe(100);
  });

  it('selects by most recent year when citations are equal (secondary)', () => {
    const results = [
      { score: 0.9, work: { title: 'Test', cited_by_count: 50, publication_year: 2015 } },
      { score: 0.8, work: { title: 'Test', cited_by_count: 50, publication_year: 2020 } },
      { score: 0.7, work: { title: 'Test', cited_by_count: 50, publication_year: 2017 } },
    ];
    const best = selectBestFromCluster(results);
    expect(getPublicationYear(best)).toBe(2020);
  });

  it('selects by highest score when citations and year are equal (tertiary)', () => {
    const results = [
      { score: 0.85, work: { title: 'Test', cited_by_count: 50, publication_year: 2020 } },
      { score: 0.95, work: { title: 'Test', cited_by_count: 50, publication_year: 2020 } },
      { score: 0.90, work: { title: 'Test', cited_by_count: 50, publication_year: 2020 } },
    ];
    const best = selectBestFromCluster(results);
    expect(getScore(best)).toBe(0.95);
  });
});

// =============================================================================
// DEDUPLICATE RESULTS (INTEGRATION) TESTS - Nested Structure
// =============================================================================

describe('deduplicateResults with nested structure', () => {
  it('returns empty array for empty/invalid input', () => {
    expect(deduplicateResults([])).toEqual([]);
    expect(deduplicateResults(null)).toEqual([]);
  });

  it('returns same items when all titles are unique', () => {
    const results = [
      { score: 0.9, work: { title: 'Machine Learning', cited_by_count: 10 } },
      { score: 0.8, work: { title: 'Ocean Biology', cited_by_count: 20 } },
      { score: 0.7, work: { title: 'Climate Science', cited_by_count: 15 } },
    ];
    const deduped = deduplicateResults(results);
    expect(deduped.length).toBe(3);
  });

  it('removes exact duplicates keeping highest cited', () => {
    const results = [
      { score: 0.9, work: { title: 'Machine Learning', cited_by_count: 10 } },
      { score: 0.8, work: { title: 'Machine Learning', cited_by_count: 100 } },
      { score: 0.7, work: { title: 'Machine Learning', cited_by_count: 50 } },
    ];
    const deduped = deduplicateResults(results);
    expect(deduped.length).toBe(1);
    expect(getCitedByCount(deduped[0])).toBe(100);
  });

  it('handles real-world duplicate scenario (Zenodo duplicates)', () => {
    // Simulates actual API response with duplicates
    const results = [
      {
        score: 0.0064,
        work: {
          title: 'Estimates and correlates of bird and bat mortality at small wind turbine sites',
          cited_by_count: 0,
          publication_year: 2015,
        },
      },
      {
        score: 0.0064,
        work: {
          title: 'Estimates and correlates of bird and bat mortality at small wind turbine sites',
          cited_by_count: 0,
          publication_year: 2015,
        },
      },
      {
        score: 0.0062,
        work: {
          title: 'Estimates and correlates of bird and bat mortality at small wind turbine sites',
          cited_by_count: 10,
          publication_year: 2014,
        },
      },
      {
        score: 0.006,
        work: { title: 'Unrelated paper on solar energy', cited_by_count: 30 },
      },
    ];
    const deduped = deduplicateResults(results);
    expect(deduped.length).toBe(2);
    // Should keep the one with most citations (10)
    const birdPaper = deduped.find(r => getTitle(r).includes('bird and bat mortality'));
    expect(getCitedByCount(birdPaper)).toBe(10);
  });

  it('keeps legitimately different versions separate', () => {
    const results = [
      { score: 0.9, work: { title: 'Wind Power and Bird Deaths', cited_by_count: 100 } },
      { score: 0.8, work: { title: 'Wind Power and Bird Deaths: A 2017 Updated Synthesis', cited_by_count: 50 } },
    ];
    const deduped = deduplicateResults(results, { threshold: 0.90 });
    expect(deduped.length).toBe(2);
  });

  it('preserves original nested structure in output', () => {
    const results = [
      { score: 0.9, work: { title: 'Test', cited_by_count: 10, id: 'W123' } },
    ];
    const deduped = deduplicateResults(results);
    expect(deduped[0]).toHaveProperty('score');
    expect(deduped[0]).toHaveProperty('work');
    expect(deduped[0].work.id).toBe('W123');
  });
});

// =============================================================================
// BACKWARD COMPATIBILITY - Flat Structure
// =============================================================================

describe('deduplicateResults with flat structure (backward compatibility)', () => {
  it('handles flat structure without work wrapper', () => {
    const results = [
      { title: 'Machine Learning', cited_by_count: 10 },
      { title: 'Machine Learning', cited_by_count: 100 },
    ];
    const deduped = deduplicateResults(results);
    expect(deduped.length).toBe(1);
    expect(deduped[0].cited_by_count).toBe(100);
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('Edge Cases', () => {
  it('handles results with no title field', () => {
    const results = [
      { score: 0.9, work: { id: '1' } },
      { score: 0.8, work: { id: '2' } },
    ];
    const deduped = deduplicateResults(results);
    // Without titles, everything has empty normalized title, so all cluster together
    expect(deduped.length).toBe(1);
  });

  it('handles special characters in titles', () => {
    const results = [
      { score: 0.9, work: { title: 'COVID-19: A New Challenge' } },
      { score: 0.8, work: { title: 'COVID19 A New Challenge' } },
    ];
    const deduped = deduplicateResults(results);
    expect(deduped.length).toBe(1);
  });

  it('maintains order of first occurrence for clusters', () => {
    const results = [
      { score: 0.9, work: { title: 'First Paper', cited_by_count: 10 } },
      { score: 0.8, work: { title: 'Second Paper', cited_by_count: 20 } },
      { score: 0.7, work: { title: 'First Paper', cited_by_count: 100 } },
    ];
    const deduped = deduplicateResults(results);
    // First Paper cluster should come before Second Paper cluster
    expect(getTitle(deduped[0])).toBe('First Paper');
    expect(getTitle(deduped[1])).toBe('Second Paper');
  });
});

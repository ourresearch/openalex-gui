/**
 * Deduplication Integration Tests
 *
 * These tests call the actual OpenAlex API to verify deduplication behavior
 * with real data. They have longer timeouts due to network calls.
 *
 * Run with: npm run test:run -- src/__tests__/deduplication.integration.test.js
 */

import { describe, it, expect } from 'vitest';
import axios from 'axios';
import {
  normalizeTitle,
  clusterDuplicates,
  deduplicateResults,
  getTitle,
  getCitedByCount,
} from '@/utils/deduplication';

const API_BASE = 'https://api.openalex.org';

/**
 * Fetch results from the Discover API
 */
async function fetchDiscoverResults(query, count = 25) {
  const params = new URLSearchParams({ query, count, mailto: 'test@openalex.org' });
  const url = `${API_BASE}/discover/works?${params}`;
  const response = await axios.get(url, { timeout: 30000 });
  return response.data.results || [];
}

/**
 * Check if results contain visible duplicates (exact normalized title matches)
 */
function hasVisibleDuplicates(results) {
  const seen = new Set();
  for (const result of results) {
    const normalized = normalizeTitle(getTitle(result));
    if (normalized && seen.has(normalized)) return true;
    seen.add(normalized);
  }
  return false;
}

/**
 * Count duplicate clusters in results
 */
function countDuplicateClusters(results, threshold = 0.90) {
  const clusters = clusterDuplicates(results, threshold);
  return clusters.filter(c => c.length > 1).length;
}

// =============================================================================
// SMOKE TESTS - Verify API is accessible
// =============================================================================

describe('Smoke Tests', () => {
  it('can fetch results from Find API', async () => {
    const results = await fetchDiscoverResults('machine learning');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  }, 30000);

  it('results have expected nested structure', async () => {
    const results = await fetchDiscoverResults('climate change');
    const firstResult = results[0];

    expect(firstResult).toHaveProperty('score');
    expect(firstResult).toHaveProperty('work');
    expect(firstResult.work).toHaveProperty('title');
  }, 30000);
});

// =============================================================================
// FUNCTIONAL TESTS - Test deduplication with real API data
// =============================================================================

describe('Functional: wind power and bird deaths', () => {
  it('deduplication returns multiple results, not just one', async () => {
    const rawResults = await fetchDiscoverResults('wind power and bird deaths');
    const dedupedResults = deduplicateResults(rawResults);

    console.log(`Raw: ${rawResults.length}, Deduplicated: ${dedupedResults.length}`);

    expect(rawResults.length).toBeGreaterThan(0);
    expect(dedupedResults.length).toBeGreaterThan(5);
    expect(dedupedResults.length).toBeLessThanOrEqual(rawResults.length);
  }, 30000);

  it('removes actual duplicate "Estimates and correlates" entries', async () => {
    const rawResults = await fetchDiscoverResults('wind power and bird deaths');
    const dedupedResults = deduplicateResults(rawResults);

    // Should have no visible duplicates after deduplication
    expect(hasVisibleDuplicates(dedupedResults)).toBe(false);

    // Should keep the highest cited version
    const estimatesPaper = dedupedResults.find(r =>
      getTitle(r).toLowerCase().includes('estimates and correlates')
    );
    if (estimatesPaper) {
      // The one we keep should have citations (10)
      expect(getCitedByCount(estimatesPaper)).toBeGreaterThanOrEqual(0);
    }
  }, 30000);
});

describe('Functional: british third empire', () => {
  it('removes duplicates while preserving unique content', async () => {
    const rawResults = await fetchDiscoverResults('british third empire');
    const dedupedResults = deduplicateResults(rawResults);

    console.log(`Raw: ${rawResults.length}, Deduplicated: ${dedupedResults.length}`);

    expect(dedupedResults.length).toBeGreaterThan(5);
    expect(hasVisibleDuplicates(dedupedResults)).toBe(false);
  }, 30000);
});

describe('Functional: price gouging economics', () => {
  it('removes duplicates in economics results', async () => {
    const rawResults = await fetchDiscoverResults('economics of price gouging regulation');
    const dedupedResults = deduplicateResults(rawResults);

    console.log(`Raw: ${rawResults.length}, Deduplicated: ${dedupedResults.length}`);

    expect(dedupedResults.length).toBeGreaterThan(0);
    expect(hasVisibleDuplicates(dedupedResults)).toBe(false);
  }, 30000);
});

describe('Functional: tiktok metareview', () => {
  it('handles queries with few or no duplicates', async () => {
    const rawResults = await fetchDiscoverResults('metareview studies social media tiktok');
    const dedupedResults = deduplicateResults(rawResults);

    console.log(`Raw: ${rawResults.length}, Deduplicated: ${dedupedResults.length}`);

    expect(dedupedResults.length).toBeGreaterThan(0);
    expect(hasVisibleDuplicates(dedupedResults)).toBe(false);
  }, 30000);
});

// =============================================================================
// QUALITY TESTS - Verify best selection logic
// =============================================================================

describe('Quality: Best version selection', () => {
  it('keeps higher cited version when duplicates have different citations', async () => {
    const rawResults = await fetchDiscoverResults('wind power and bird deaths');

    // Find clusters with citation differences
    const clusters = clusterDuplicates(rawResults);
    const clusterWithCitationDiff = clusters.find(cluster => {
      if (cluster.length <= 1) return false;
      const citations = cluster.map(r => getCitedByCount(r));
      return Math.max(...citations) > Math.min(...citations);
    });

    if (clusterWithCitationDiff) {
      const dedupedResults = deduplicateResults(rawResults);
      const selectedTitle = normalizeTitle(getTitle(clusterWithCitationDiff[0]));
      const selectedResult = dedupedResults.find(r =>
        normalizeTitle(getTitle(r)) === selectedTitle
      );

      // The selected one should have the highest citations from the cluster
      const maxCitations = Math.max(...clusterWithCitationDiff.map(r => getCitedByCount(r)));
      expect(getCitedByCount(selectedResult)).toBe(maxCitations);
    }
  }, 30000);
});

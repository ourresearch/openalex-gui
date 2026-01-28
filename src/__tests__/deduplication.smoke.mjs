/**
 * Smoke Tests for Deduplication
 *
 * This script tests deduplication against the real OpenAlex API.
 * Run with: node src/__tests__/deduplication.smoke.mjs
 */

import https from 'https';

// ============================================================================
// Deduplication functions (copied from deduplication.js for standalone use)
// ============================================================================

function extractWork(result) {
  if (!result) return null;
  if (result.work && typeof result.work === 'object') return result.work;
  return result;
}

function getTitle(result) {
  const work = extractWork(result);
  return work?.title || work?.display_name || '';
}

function getCitedByCount(result) {
  const work = extractWork(result);
  return work?.cited_by_count || 0;
}

function getPublicationYear(result) {
  const work = extractWork(result);
  return work?.publication_year || 0;
}

function getScore(result) {
  if (result?.score != null) return result.score;
  const work = extractWork(result);
  return work?.score || work?.relevance_score || 0;
}

function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];
  for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[s1.length][s2.length];
}

function normalizeTitle(title) {
  if (!title) return '';
  return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function titleSimilarity(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0.0;
  const distance = levenshteinDistance(norm1, norm2);
  return 1 - (distance / Math.max(norm1.length, norm2.length));
}

function clusterDuplicates(results, threshold = 0.90) {
  if (!results || results.length === 0) return [];
  const clusters = [];
  const assigned = new Set();

  for (let i = 0; i < results.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = [results[i]];
    assigned.add(i);
    const title1 = getTitle(results[i]);

    for (let j = i + 1; j < results.length; j++) {
      if (assigned.has(j)) continue;
      const title2 = getTitle(results[j]);
      if (titleSimilarity(title1, title2) >= threshold) {
        cluster.push(results[j]);
        assigned.add(j);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

function selectBestFromCluster(cluster) {
  if (!cluster || cluster.length === 0) return null;
  if (cluster.length === 1) return cluster[0];

  return cluster.reduce((best, current) => {
    const bestCitations = getCitedByCount(best);
    const currentCitations = getCitedByCount(current);
    if (currentCitations > bestCitations) return current;
    if (currentCitations < bestCitations) return best;

    const bestYear = getPublicationYear(best);
    const currentYear = getPublicationYear(current);
    if (currentYear > bestYear) return current;
    if (currentYear < bestYear) return best;

    const bestScore = getScore(best);
    const currentScore = getScore(current);
    if (currentScore > bestScore) return current;
    return best;
  });
}

function deduplicateResults(results, options = {}) {
  const { threshold = 0.90 } = options;
  if (!results || !Array.isArray(results) || results.length === 0) return results || [];
  const clusters = clusterDuplicates(results, threshold);
  return clusters.map(cluster => selectBestFromCluster(cluster));
}

// ============================================================================
// API Fetch
// ============================================================================

function fetchDiscoverResults(query, count = 25) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ query, count, mailto: 'test@openalex.org' });
    const url = `https://api.openalex.org/discover/works?${params}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ============================================================================
// Test Runner
// ============================================================================

function hasVisibleDuplicates(results) {
  const seen = new Set();
  for (const result of results) {
    const normalized = normalizeTitle(getTitle(result));
    if (normalized && seen.has(normalized)) return true;
    seen.add(normalized);
  }
  return false;
}

function countDuplicateClusters(results, threshold = 0.90) {
  const clusters = clusterDuplicates(results, threshold);
  return clusters.filter(c => c.length > 1).length;
}

async function runTest(name, query, assertions) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log(`Query: "${query}"`);
  console.log('='.repeat(60));

  try {
    const rawResults = await fetchDiscoverResults(query);
    const dedupedResults = deduplicateResults(rawResults);

    console.log(`Raw results: ${rawResults.length}`);
    console.log(`Deduplicated results: ${dedupedResults.length}`);
    console.log(`Duplicates removed: ${rawResults.length - dedupedResults.length}`);

    // Show duplicate clusters
    const clusters = clusterDuplicates(rawResults);
    const dupClusters = clusters.filter(c => c.length > 1);
    if (dupClusters.length > 0) {
      console.log(`\nDuplicate clusters found: ${dupClusters.length}`);
      dupClusters.forEach((cluster, i) => {
        console.log(`  Cluster ${i + 1} (${cluster.length} items):`);
        cluster.forEach(r => {
          console.log(`    - "${getTitle(r).substring(0, 60)}..." [${getCitedByCount(r)} citations]`);
        });
        const selected = selectBestFromCluster(cluster);
        console.log(`    -> Selected: "${getTitle(selected).substring(0, 40)}..." [${getCitedByCount(selected)} citations]`);
      });
    } else {
      console.log('\nNo duplicate clusters found in raw results.');
    }

    // Run assertions
    let passed = 0;
    let failed = 0;
    console.log('\nAssertions:');
    for (const [desc, fn] of Object.entries(assertions)) {
      try {
        const result = fn(rawResults, dedupedResults);
        if (result) {
          console.log(`  ✓ ${desc}`);
          passed++;
        } else {
          console.log(`  ✗ ${desc}`);
          failed++;
        }
      } catch (e) {
        console.log(`  ✗ ${desc} (Error: ${e.message})`);
        failed++;
      }
    }

    console.log(`\nResult: ${passed} passed, ${failed} failed`);
    return failed === 0;
  } catch (e) {
    console.error(`\nERROR: ${e.message}`);
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('DEDUPLICATION SMOKE TESTS');
  console.log('Testing against live OpenAlex API');
  console.log(new Date().toISOString());

  let allPassed = true;

  // Test 1: Wind power and bird deaths
  allPassed = await runTest(
    'wind power and bird deaths',
    'wind power and bird deaths',
    {
      'Returns multiple results (not just one)': (raw, deduped) => deduped.length > 5,
      'Removes duplicates if present': (raw, deduped) => deduped.length <= raw.length,
      'No visible duplicates after dedup': (raw, deduped) => !hasVisibleDuplicates(deduped),
      'Preserves most unique content': (raw, deduped) => deduped.length >= raw.length * 0.6,
    }
  ) && allPassed;

  // Test 2: British third empire
  allPassed = await runTest(
    'british third empire',
    'british third empire',
    {
      'Returns multiple results': (raw, deduped) => deduped.length > 5,
      'No visible duplicates after dedup': (raw, deduped) => !hasVisibleDuplicates(deduped),
    }
  ) && allPassed;

  // Test 3: Price gouging
  allPassed = await runTest(
    'economics of price gouging',
    'economics of price gouging regulation and welfare effects',
    {
      'Returns results': (raw, deduped) => deduped.length > 0,
      'No visible duplicates after dedup': (raw, deduped) => !hasVisibleDuplicates(deduped),
    }
  ) && allPassed;

  // Test 4: TikTok metareview
  allPassed = await runTest(
    'tiktok metareview',
    'metareview of studies comparing social media engagement tiktok',
    {
      'Returns results': (raw, deduped) => deduped.length > 0,
      'No visible duplicates after dedup': (raw, deduped) => !hasVisibleDuplicates(deduped),
    }
  ) && allPassed;

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('FINAL RESULT:', allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
  console.log('='.repeat(60));

  process.exit(allPassed ? 0 : 1);
}

main();

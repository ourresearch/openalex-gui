#!/usr/bin/env node
/**
 * Smoke test for Discover page API
 * Run this BEFORE marking any embedding/vector search changes as complete
 *
 * Usage: node src/__tests__/smoke-test-discover.mjs [--prod]
 */

const API_BASE = process.argv.includes('--prod')
  ? 'https://api.openalex.org'
  : 'http://localhost:5005';

const TEST_QUERIES = [
  'machine learning',
  'climate change effects on coral reefs',
  'CRISPR gene editing',
  'quantum computing algorithms',
  'vaccine efficacy covid'
];

async function runSmokeTests() {
  console.log(`\n🔥 SMOKE TEST: Discover API (${API_BASE})\n`);
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const query of TEST_QUERIES) {
    const startTime = Date.now();
    try {
      const url = `${API_BASE}/discover/works?query=${encodeURIComponent(query)}&count=5`;
      const response = await fetch(url);
      const elapsed = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.meta) throw new Error('Missing meta field');
      if (!data.results) throw new Error('Missing results field');
      if (!Array.isArray(data.results)) throw new Error('results is not an array');
      if (data.results.length === 0) throw new Error('No results returned');

      // Validate first result structure
      const first = data.results[0];
      if (first.score === undefined) throw new Error('Missing score in result');
      if (!first.work) throw new Error('Missing work in result');
      if (!first.work.id) throw new Error('Missing work.id');
      if (!first.work.title && !first.work.display_name) throw new Error('Missing title');

      // Validate timing
      if (!data.meta.timing) throw new Error('Missing timing data');
      if (!data.meta.timing.embed_ms) throw new Error('Missing embed_ms');

      const embedMs = data.meta.timing.embed_ms;
      const totalMs = data.meta.timing.total_ms;

      console.log(`✅ "${query.substring(0, 30)}..." `);
      console.log(`   ${data.results.length} results, embed: ${embedMs}ms, total: ${totalMs}ms`);

      results.push({ query, passed: true, embedMs, totalMs, resultCount: data.results.length });
      passed++;

    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.log(`❌ "${query.substring(0, 30)}..."`);
      console.log(`   ERROR: ${error.message} (${elapsed}ms)`);
      results.push({ query, passed: false, error: error.message });
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 SUMMARY: ${passed}/${TEST_QUERIES.length} passed`);

  if (failed > 0) {
    console.log(`\n❌ ${failed} TESTS FAILED - DO NOT DEPLOY\n`);
    process.exit(1);
  }

  // Check latency thresholds
  const embedTimes = results.filter(r => r.passed).map(r => r.embedMs);
  const avgEmbed = embedTimes.reduce((a, b) => a + b, 0) / embedTimes.length;

  console.log(`\n⏱️  Avg embed time: ${Math.round(avgEmbed)}ms`);

  if (avgEmbed > 500) {
    console.log(`⚠️  WARNING: Avg embed time exceeds 500ms threshold`);
  }

  console.log(`\n✅ ALL SMOKE TESTS PASSED\n`);
  process.exit(0);
}

runSmokeTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * Deduplication Analysis Script
 *
 * Runs 100 diverse research queries through the Find API,
 * collects timing and deduplication statistics.
 *
 * Run with: node src/__tests__/dedup-analysis.mjs
 */

import https from 'https';
import fs from 'fs';

// 100 diverse research queries across academic fields
const QUERIES = [
  // Pharmacology & Medicine
  "CRISPR gene therapy for sickle cell disease clinical trials",
  "metformin longevity effects beyond diabetes",
  "mRNA vaccine immune response mechanisms",
  "opioid addiction treatment buprenorphine vs methadone",
  "gut microbiome influence on drug metabolism",

  // Cardiology
  "SGLT2 inhibitors heart failure outcomes",
  "artificial heart long-term survival rates",
  "stem cell therapy for myocardial infarction",
  "wearable ECG atrial fibrillation detection accuracy",

  // Neurology & Psychiatry
  "psilocybin therapy treatment-resistant depression",
  "deep brain stimulation Parkinson's disease progression",
  "tau protein aggregation Alzheimer's mechanisms",
  "ketamine rapid antidepressant effects neural pathways",
  "sleep deprivation cognitive function young adults",

  // Oncology
  "CAR-T cell therapy solid tumors challenges",
  "liquid biopsy early cancer detection sensitivity",
  "immunotherapy checkpoint inhibitors resistance mechanisms",
  "tumor microenvironment immune evasion strategies",
  "cancer metabolism Warburg effect therapeutic targets",

  // Genetics & Molecular Biology
  "polygenic risk scores cardiovascular disease prediction",
  "epigenetic inheritance transgenerational trauma",
  "long non-coding RNA gene regulation mechanisms",
  "single cell RNA sequencing tumor heterogeneity",
  "GWAS missing heritability complex traits",

  // Public Health & Epidemiology
  "COVID-19 long-term neurological complications",
  "vaccine hesitancy social media misinformation",
  "air pollution cardiovascular mortality urban areas",
  "antibiotic resistance global surveillance strategies",
  "climate change infectious disease spread patterns",

  // Psychology
  "cognitive behavioral therapy anxiety meta-analysis",
  "social media use adolescent mental health longitudinal",
  "mindfulness meditation stress reduction workplace",
  "attachment theory adult romantic relationships",
  "implicit bias racial discrimination employment",

  // Education
  "online learning effectiveness compared traditional classroom",
  "growth mindset intervention academic achievement",
  "bilingual education cognitive development children",
  "STEM gender gap intervention strategies",
  "universal pre-K long-term educational outcomes",

  // Computer Science & AI
  "large language models reasoning capabilities limitations",
  "federated learning privacy preserving machine learning",
  "transformer architecture attention mechanisms interpretability",
  "reinforcement learning robotics manipulation tasks",
  "adversarial attacks neural network robustness",
  "quantum computing error correction algorithms",
  "graph neural networks drug discovery applications",

  // Environmental Science
  "ocean acidification coral reef ecosystem collapse",
  "permafrost thaw methane emissions feedback loop",
  "renewable energy storage battery technology advances",
  "microplastics marine food chain bioaccumulation",
  "carbon capture direct air technology feasibility",
  "biodiversity loss ecosystem services economic valuation",

  // Economics & Finance
  "universal basic income employment effects pilot studies",
  "cryptocurrency market volatility prediction models",
  "behavioral economics nudge theory policy applications",
  "automation job displacement labor market adaptation",
  "housing affordability urban inequality gentrification",

  // Physics & Astronomy
  "dark matter detection direct experiments WIMP",
  "gravitational waves neutron star mergers",
  "quantum entanglement long distance communication",
  "exoplanet habitability atmospheric biosignatures",
  "black hole information paradox recent theories",

  // Materials Science & Engineering
  "perovskite solar cells stability degradation mechanisms",
  "graphene biomedical applications drug delivery",
  "self-healing polymers structural applications",
  "high entropy alloys mechanical properties",
  "biodegradable plastics environmental impact assessment",

  // Agriculture & Food Science
  "vertical farming urban food security scalability",
  "plant-based meat protein quality nutrition comparison",
  "CRISPR crop improvement drought tolerance",
  "soil microbiome sustainable agriculture practices",
  "food waste reduction supply chain interventions",

  // Social Sciences
  "polarization social media echo chambers empirical",
  "immigration economic impact host country labor",
  "gender wage gap unexplained factors analysis",
  "criminal justice reform recidivism reduction programs",
  "aging population pension system sustainability",

  // Linguistics & Communication
  "language acquisition critical period hypothesis",
  "machine translation neural low-resource languages",
  "misinformation spread correction effectiveness",
  "emoji communication cross-cultural interpretation",

  // History & Humanities
  "digital humanities text mining historical documents",
  "decolonization museum repatriation cultural heritage",
  "oral history methodology trauma survivors",

  // Architecture & Urban Studies
  "smart cities IoT infrastructure privacy concerns",
  "green building certification energy performance gap",
  "urban heat island mitigation strategies",

  // Biomedical Engineering
  "3D bioprinting organ transplantation progress",
  "wearable biosensors continuous glucose monitoring",
  "brain-computer interface motor rehabilitation stroke",

  // Chemistry
  "metal-organic frameworks CO2 capture efficiency",
  "CRISPR delivery nanoparticle optimization",
  "electrochemical water splitting hydrogen production",

  // Short queries (testing edge cases)
  "Alzheimer's biomarkers",
  "vaccine efficacy",
  "climate models",
  "gene editing ethics",
  "AI bias",
  "cancer immunotherapy",
  "mental health apps",
  "renewable energy policy",
  "pandemic preparedness",
  "antibiotic alternatives",
];

// Deduplication functions
function normalizeTitle(title) {
  if (!title) return "";
  return title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
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
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[s1.length][s2.length];
}

function titleSimilarity(t1, t2) {
  const n1 = normalizeTitle(t1), n2 = normalizeTitle(t2);
  if (n1 === n2) return 1.0;
  if (!n1.length || !n2.length) return 0.0;
  return 1 - levenshteinDistance(n1, n2) / Math.max(n1.length, n2.length);
}

function countDuplicatesRemoved(results, threshold = 0.90) {
  if (!results || results.length === 0) return 0;

  const dominated = new Set();
  for (let i = 0; i < results.length; i++) {
    if (dominated.has(i)) continue;
    const t1 = results[i].work?.title || results[i].title || "";
    for (let j = i + 1; j < results.length; j++) {
      if (dominated.has(j)) continue;
      const t2 = results[j].work?.title || results[j].title || "";
      if (titleSimilarity(t1, t2) >= threshold) {
        // Find best in cluster
        const c1 = results[i].work?.cited_by_count || results[i].cited_by_count || 0;
        const c2 = results[j].work?.cited_by_count || results[j].cited_by_count || 0;
        if (c2 > c1) {
          dominated.add(i);
          break;
        } else {
          dominated.add(j);
        }
      }
    }
  }
  return dominated.size;
}

// Fetch from API
function fetchQuery(query) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ query, count: 25, mailto: 'test@openalex.org' });
    const url = `https://api.openalex.org/discover/works?${params}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Sleep helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Main
async function main() {
  console.log("Deduplication Analysis - 100 Research Queries");
  console.log("=============================================\n");

  const results = [];
  let totalRemoved = 0;
  let totalEmbedMs = 0;
  let totalSearchMs = 0;
  let queriesWithDuplicates = 0;

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i];
    process.stdout.write(`[${i + 1}/${QUERIES.length}] ${query.substring(0, 50)}...`);

    try {
      const response = await fetchQuery(query);
      const embedMs = response.meta?.timing?.embed_ms || 0;
      const searchMs = response.meta?.timing?.search_ms || 0;
      const rawCount = response.results?.length || 0;
      const removed = countDuplicatesRemoved(response.results || []);

      results.push({
        query,
        rawCount,
        removed,
        dedupedCount: rawCount - removed,
        embedMs,
        searchMs,
        totalMs: embedMs + searchMs,
      });

      totalRemoved += removed;
      totalEmbedMs += embedMs;
      totalSearchMs += searchMs;
      if (removed > 0) queriesWithDuplicates++;

      console.log(` ${removed > 0 ? `REMOVED: ${removed}` : 'OK'} (${embedMs}ms + ${searchMs}ms)`);

      // Rate limit: small delay between requests
      await sleep(200);
    } catch (e) {
      console.log(` ERROR: ${e.message}`);
      results.push({
        query,
        rawCount: 0,
        removed: 0,
        dedupedCount: 0,
        embedMs: 0,
        searchMs: 0,
        totalMs: 0,
        error: e.message,
      });
    }
  }

  // Generate markdown report
  const mdLines = [
    "# Deduplication Analysis Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary Statistics",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total queries | ${QUERIES.length} |`,
    `| Queries with duplicates | ${queriesWithDuplicates} (${(queriesWithDuplicates / QUERIES.length * 100).toFixed(1)}%) |`,
    `| Total duplicates removed | ${totalRemoved} |`,
    `| Avg duplicates per query | ${(totalRemoved / QUERIES.length).toFixed(2)} |`,
    `| Avg embed time | ${(totalEmbedMs / QUERIES.length).toFixed(0)}ms |`,
    `| Avg search time | ${(totalSearchMs / QUERIES.length).toFixed(0)}ms |`,
    `| Avg total time | ${((totalEmbedMs + totalSearchMs) / QUERIES.length).toFixed(0)}ms |`,
    "",
    "## Queries with Most Duplicates Removed",
    "",
    "| Query | Removed | Raw | After Dedup |",
    "|-------|---------|-----|-------------|",
  ];

  // Top duplicates
  const sorted = [...results].filter(r => !r.error).sort((a, b) => b.removed - a.removed);
  sorted.slice(0, 10).forEach(r => {
    mdLines.push(`| ${r.query.substring(0, 60)}${r.query.length > 60 ? '...' : ''} | ${r.removed} | ${r.rawCount} | ${r.dedupedCount} |`);
  });

  mdLines.push("");
  mdLines.push("## Timing Analysis");
  mdLines.push("");
  mdLines.push("| Query | Embed (ms) | Search (ms) | Total (ms) |");
  mdLines.push("|-------|------------|-------------|------------|");

  // Slowest queries
  const byTime = [...results].filter(r => !r.error).sort((a, b) => b.totalMs - a.totalMs);
  byTime.slice(0, 10).forEach(r => {
    mdLines.push(`| ${r.query.substring(0, 50)}${r.query.length > 50 ? '...' : ''} | ${r.embedMs} | ${r.searchMs} | ${r.totalMs} |`);
  });

  mdLines.push("");
  mdLines.push("## Full Results");
  mdLines.push("");
  mdLines.push("| # | Query | Removed | Embed | Search |");
  mdLines.push("|---|-------|---------|-------|--------|");

  results.forEach((r, i) => {
    const removedStr = r.removed > 0 ? `**${r.removed}**` : '0';
    mdLines.push(`| ${i + 1} | ${r.query} | ${removedStr} | ${r.embedMs}ms | ${r.searchMs}ms |`);
  });

  // Write to file
  const mdContent = mdLines.join("\n");
  fs.writeFileSync('dedup-analysis-report.md', mdContent);

  // Print summary to console
  console.log("\n=============================================");
  console.log("SUMMARY");
  console.log("=============================================");
  console.log(`Total queries: ${QUERIES.length}`);
  console.log(`Queries with duplicates: ${queriesWithDuplicates} (${(queriesWithDuplicates / QUERIES.length * 100).toFixed(1)}%)`);
  console.log(`Total duplicates removed: ${totalRemoved}`);
  console.log(`Average per query: ${(totalRemoved / QUERIES.length).toFixed(2)}`);
  console.log(`\nTiming:`);
  console.log(`  Avg embed: ${(totalEmbedMs / QUERIES.length).toFixed(0)}ms`);
  console.log(`  Avg search: ${(totalSearchMs / QUERIES.length).toFixed(0)}ms`);
  console.log(`  Avg total: ${((totalEmbedMs + totalSearchMs) / QUERIES.length).toFixed(0)}ms`);
  console.log(`\nReport saved to: dedup-analysis-report.md`);
}

main().catch(console.error);

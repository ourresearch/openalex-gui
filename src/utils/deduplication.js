/**
 * Deduplication utilities for Find page vector search results.
 *
 * Vector search often returns duplicate works (same work appearing multiple times)
 * due to data quality issues, especially with Zenodo/repository content.
 * These duplicates cluster together because identical content produces nearly
 * identical embeddings.
 *
 * This module provides frontend-based deduplication using title similarity,
 * keeping the version with most citations.
 *
 * API Response Structure:
 * The Find API returns results in format: { score, work: { id, title, cited_by_count, ... } }
 * This module handles both this nested structure and flat structures for flexibility.
 */

/**
 * Extract the work object from a result.
 * Handles both nested { score, work: {...} } and flat { title, ... } structures.
 *
 * @param {Object} result - A result item
 * @returns {Object} The work object with title, cited_by_count, etc.
 */
export function extractWork(result) {
  if (!result) return null;
  // Nested structure: { score, work: { title, ... } }
  if (result.work && typeof result.work === 'object') {
    return result.work;
  }
  // Flat structure: { title, ... }
  return result;
}

/**
 * Get the title from a result (handles nested or flat structure).
 *
 * @param {Object} result - A result item
 * @returns {string} The title
 */
export function getTitle(result) {
  const work = extractWork(result);
  return work?.title || work?.display_name || '';
}

/**
 * Get cited_by_count from a result (handles nested or flat structure).
 *
 * @param {Object} result - A result item
 * @returns {number} Citation count
 */
export function getCitedByCount(result) {
  const work = extractWork(result);
  return work?.cited_by_count || 0;
}

/**
 * Get publication_year from a result (handles nested or flat structure).
 *
 * @param {Object} result - A result item
 * @returns {number} Publication year
 */
export function getPublicationYear(result) {
  const work = extractWork(result);
  return work?.publication_year || 0;
}

/**
 * Get score from a result (handles nested or flat structure).
 *
 * @param {Object} result - A result item
 * @returns {number} Search score
 */
export function getScore(result) {
  // Score is at top level in nested structure
  if (result?.score != null) return result.score;
  // Or might be in work object for flat structure
  const work = extractWork(result);
  return work?.score || work?.relevance_score || 0;
}

/**
 * Calculate Levenshtein distance between two strings.
 * Standard dynamic programming implementation.
 *
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} Edit distance
 */
export function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  // Create matrix
  const matrix = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[s1.length][s2.length];
}

/**
 * Normalize a title for comparison.
 * - Lowercase
 * - Remove punctuation
 * - Collapse whitespace
 *
 * @param {string} title - Raw title
 * @returns {string} Normalized title
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Collapse whitespace
    .trim();
}

/**
 * Calculate similarity ratio between two titles (0.0 to 1.0).
 * Uses normalized Levenshtein distance.
 *
 * @param {string} title1 - First title
 * @param {string} title2 - Second title
 * @returns {number} Similarity ratio (1.0 = identical, 0.0 = completely different)
 */
export function titleSimilarity(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0.0;

  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);

  return 1 - (distance / maxLength);
}

/**
 * Cluster results by title similarity.
 * Groups results where title similarity >= threshold.
 * Handles both nested { score, work } and flat { title } structures.
 *
 * @param {Array} results - Array of result objects
 * @param {number} threshold - Similarity threshold (0.0 to 1.0), default 0.90
 * @returns {Array<Array>} Array of clusters (each cluster is an array of results)
 */
export function clusterDuplicates(results, threshold = 0.90) {
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
      const similarity = titleSimilarity(title1, title2);

      if (similarity >= threshold) {
        cluster.push(results[j]);
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Select the best result from a cluster of duplicates.
 * Selection priority:
 * 1. Most citations (cited_by_count)
 * 2. Most recent year (publication_year)
 * 3. Highest search score (score)
 *
 * Handles both nested { score, work } and flat { title } structures.
 *
 * @param {Array} cluster - Array of similar results
 * @returns {Object} Best result from the cluster (preserves original structure)
 */
export function selectBestFromCluster(cluster) {
  if (!cluster || cluster.length === 0) return null;
  if (cluster.length === 1) return cluster[0];

  return cluster.reduce((best, current) => {
    const bestCitations = getCitedByCount(best);
    const currentCitations = getCitedByCount(current);

    // Primary: Most citations
    if (currentCitations > bestCitations) return current;
    if (currentCitations < bestCitations) return best;

    // Secondary: Most recent year
    const bestYear = getPublicationYear(best);
    const currentYear = getPublicationYear(current);
    if (currentYear > bestYear) return current;
    if (currentYear < bestYear) return best;

    // Tertiary: Highest search score
    const bestScore = getScore(best);
    const currentScore = getScore(current);
    if (currentScore > bestScore) return current;

    return best;
  });
}

/**
 * Deduplicate search results by title similarity.
 * Main entry point for deduplication.
 *
 * @param {Array} results - Array of work objects from vector search
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Similarity threshold (default 0.90)
 * @returns {Array} Deduplicated results array
 */
export function deduplicateResults(results, options = {}) {
  const { threshold = 0.90 } = options;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return results || [];
  }

  const clusters = clusterDuplicates(results, threshold);
  return clusters.map(cluster => selectBestFromCluster(cluster));
}

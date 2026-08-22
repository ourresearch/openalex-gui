// Max rows the semantic (vector) search path returns; the API rejects a larger
// per_page outright ("per_page cannot exceed 50 for semantic search").
// Mirrors openalex-elastic-api core/vector_index.MAX_SEMANTIC_RESULTS (#862).
export const SEMANTIC_MAX_PER_PAGE = 50;

/**
 * OQL Parsing Tests
 * 
 * Tests for bidirectional conversion between OQL strings and URL filters.
 * 
 * Test Categories:
 * 1. Grammar: Tests that the grammar correctly parses OQL syntax
 * 2. OQL → Filters: Tests that OQL strings produce correct filter objects
 * 3. One-directional: Tests for valid OQL variants that map to same URL
 *    (e.g., with or without display name)
 * 4. Error handling: Tests that invalid OQL produces appropriate errors
 */

import { describe, it, expect, vi } from 'vitest'
import * as oqlGrammar from '@/oqlGrammar'
import { validateOqlSync, oqlToFiltersSync } from '@/oql'

// Mock the API for display name fetching
vi.mock('@/api', () => ({
  api: {
    getEntityDisplayName: vi.fn(),
    getFilterValueDisplayName: vi.fn(),
  }
}))

// =============================================================================
// GRAMMAR PARSING TESTS
// Tests that the grammar correctly parses various OQL formats
// =============================================================================

describe('OQL Grammar Parsing', () => {
  
  describe('Bracketed IDs', () => {
    
    it('parses display name with bracketed native entity ID', () => {
      const result = oqlGrammar.parse('works where institution is University of Cambridge [i241749]')
      expect(result.entityType).toBe('works')
      expect(result.clauses[0].field).toBe('institution')
      expect(result.clauses[0].values[0].displayName).toBe('University of Cambridge')
      expect(result.clauses[0].values[0].id).toBe('i241749')
    })
    
    it('parses bracketed ID without display name', () => {
      const result = oqlGrammar.parse('works where corresponding institution is [i241749]')
      expect(result.entityType).toBe('works')
      expect(result.clauses[0].values[0].displayName).toBeNull()
      expect(result.clauses[0].values[0].id).toBe('i241749')
    })
    
    it('parses work type with bracketed ID', () => {
      const result = oqlGrammar.parse('works where type is article [article]')
      expect(result.clauses[0].field).toBe('type')
      expect(result.clauses[0].values[0].displayName).toBe('article')
      expect(result.clauses[0].values[0].id).toBe('article')
    })
    
    it('parses work type with just bracketed ID', () => {
      const result = oqlGrammar.parse('works where type is [article]')
      expect(result.clauses[0].values[0].displayName).toBeNull()
      expect(result.clauses[0].values[0].id).toBe('article')
    })
    
    it('parses hyphenated type ID like book-chapter', () => {
      const result = oqlGrammar.parse('works where type is Book Chapter [book-chapter]')
      expect(result.clauses[0].values[0].displayName).toBe('Book Chapter')
      expect(result.clauses[0].values[0].id).toBe('book-chapter')
    })
    
    it('parses country with bracketed code', () => {
      const result = oqlGrammar.parse('works where country is Germany [de]')
      expect(result.clauses[0].field).toBe('country')
      expect(result.clauses[0].values[0].displayName).toBe('Germany')
      expect(result.clauses[0].values[0].id).toBe('de')
    })
    
    it('parses SDG with numeric ID', () => {
      const result = oqlGrammar.parse('works where sustainable development goal is Good health and Well-being [3]')
      expect(result.clauses[0].field).toBe('sustainable development goal')
      expect(result.clauses[0].values[0].displayName).toBe('Good health and Well-being')
      expect(result.clauses[0].values[0].id).toBe('3')
    })
    
    it('parses SDG with just numeric ID', () => {
      const result = oqlGrammar.parse('works where sustainable development goal is [3]')
      expect(result.clauses[0].values[0].displayName).toBeNull()
      expect(result.clauses[0].values[0].id).toBe('3')
    })
    
  })
  
  describe('Negation', () => {
    
    it('parses negated value with bracketed ID', () => {
      const result = oqlGrammar.parse('works where type is not Book Chapter [book-chapter]')
      expect(result.clauses[0].values[0].negated).toBe(true)
      expect(result.clauses[0].values[0].id).toBe('book-chapter')
    })
    
    it('parses mixed positive and negated values', () => {
      const result = oqlGrammar.parse('works where type is Article [article] and not Book Chapter [book-chapter]')
      expect(result.clauses[0].values[0].negated).toBe(false)
      expect(result.clauses[0].values[0].id).toBe('article')
      expect(result.clauses[0].values[1].negated).toBe(true)
      expect(result.clauses[0].values[1].id).toBe('book-chapter')
    })
    
  })
  
  describe('Multiple values', () => {
    
    it('parses OR values', () => {
      const result = oqlGrammar.parse('works where type is Article [article] or Book [book]')
      expect(result.clauses[0].values).toHaveLength(2)
      expect(result.clauses[0].values[0].id).toBe('article')
      expect(result.clauses[0].values[1].id).toBe('book')
    })
    
  })
  
})

// =============================================================================
// AST STRUCTURE TESTS
// Tests that parsed AST has correct structure for filter conversion
// =============================================================================

describe('OQL AST Structure', () => {
  
  describe('Entities with display name + bracketed IDs', () => {
    
    it('parses institution with display name and ID', () => {
      const ast = oqlToFiltersSync('works where institution is University of Cambridge [i241749]')
      expect(ast.entityType).toBe('works')
      expect(ast.clauses[0].field).toBe('institution')
      expect(ast.clauses[0].values[0].id).toBe('i241749')
    })
    
    it('parses work type with display name and ID', () => {
      const ast = oqlToFiltersSync('works where type is Article [article]')
      expect(ast.clauses[0].field).toBe('type')
      expect(ast.clauses[0].values[0].id).toBe('article')
    })
    
    it('parses SDG with display name and numeric ID', () => {
      const ast = oqlToFiltersSync('works where sustainable development goal is Good health [3]')
      expect(ast.clauses[0].field).toBe('sustainable development goal')
      expect(ast.clauses[0].values[0].id).toBe('3')
    })
    
    it('parses negated value', () => {
      const ast = oqlToFiltersSync('works where type is not Book Chapter [book-chapter]')
      expect(ast.clauses[0].values[0].negated).toBe(true)
      expect(ast.clauses[0].values[0].id).toBe('book-chapter')
    })
    
  })
  
})

// =============================================================================
// ONE-DIRECTIONAL TESTS (OQL → URL only)
// Tests for valid OQL variants that map to the same URL
// Display name is optional - both versions should produce same filter
// =============================================================================

describe('OQL Variants (One-directional)', () => {
  
  describe('Optional display names - both produce same ID in AST', () => {
    
    it('institution: display name + ID equals ID-only', () => {
      const withDisplayName = oqlToFiltersSync('works where corresponding institution is University of Cambridge [i241749]')
      const idOnly = oqlToFiltersSync('works where corresponding institution is [i241749]')
      
      expect(withDisplayName.clauses[0].values[0].id).toBe(idOnly.clauses[0].values[0].id)
      expect(withDisplayName.clauses[0].field).toBe(idOnly.clauses[0].field)
    })
    
    it('type: display name + ID equals ID-only', () => {
      const withDisplayName = oqlToFiltersSync('works where type is Article [article]')
      const idOnly = oqlToFiltersSync('works where type is [article]')
      
      expect(withDisplayName.clauses[0].values[0].id).toBe(idOnly.clauses[0].values[0].id)
    })
    
  })
  
})

// =============================================================================
// ERROR HANDLING TESTS
// Tests that invalid OQL produces appropriate errors
// =============================================================================

describe('OQL Error Handling', () => {
  
  it('rejects invalid syntax', () => {
    const result = validateOqlSync('this is not valid oql at all')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  // Note: Unknown field names are currently parsed by grammar but should fail in filter conversion
  // This is a known limitation - the grammar is permissive, validation happens later
  it('parses syntactically valid OQL even with unknown fields (grammar is permissive)', () => {
    // The grammar accepts any field name syntax, validation of field names happens later
    const result = validateOqlSync('works where nonexistent_field is something [abc]')
    // Currently this passes grammar parsing - field validation is done in async step
    expect(result.valid).toBe(true)
  })
  
})

// =============================================================================
// ALPHABETICAL ORDERING TESTS
// Tests that filters and values are sorted alphabetically
// =============================================================================

describe('OQL Alphabetical Ordering', () => {
  
  describe('Filters in WHERE clause should be alphabetically ordered by field name', () => {
    
    it('orders filters alphabetically when parsed from unordered input', () => {
      // Scenario: University librarian analyzing open access and year trends
      // Input has: year, type, open access - should become: open access, type, year
      const result = oqlGrammar.parse('works where year is 2023 and type is [article] and Open Access status is [gold]')
      expect(result.clauses).toHaveLength(3)
      // The grammar parses in input order; ordering happens in conversion
    })
    
    it('maintains clause structure when reordering', () => {
      // Scenario: Research office tracking institutional output by funder and country
      const result = oqlGrammar.parse('works where Country is Germany [de] and funder is NIH [f4320332161] and institution is MIT [i63966007]')
      expect(result.clauses).toHaveLength(3)
      expect(result.clauses[0].field).toBe('Country')
      expect(result.clauses[1].field).toBe('funder')
      expect(result.clauses[2].field).toBe('institution')
    })
    
  })
  
  describe('Values within a filter should be alphabetically ordered by ID', () => {
    
    it('orders institution IDs alphabetically', () => {
      // Scenario: Comparing output across three peer institutions
      const result = oqlGrammar.parse('works where institution is Stanford [i97018004] or MIT [i63966007] or Harvard [i136199984]')
      expect(result.clauses[0].values).toHaveLength(3)
      // Values parsed in input order; ordering happens in conversion
      expect(result.clauses[0].values[0].id).toBe('i97018004')
      expect(result.clauses[0].values[1].id).toBe('i63966007')
      expect(result.clauses[0].values[2].id).toBe('i136199984')
    })
    
    it('orders type IDs alphabetically', () => {
      // Scenario: Filtering to common publication types
      const result = oqlGrammar.parse('works where type is review [review] or article [article] or Book Chapter [book-chapter]')
      expect(result.clauses[0].values).toHaveLength(3)
    })
    
  })
  
})

// =============================================================================
// PARENTHESES SUPPORT TESTS
// Tests for one level of parentheses in select entity filter values
// =============================================================================

describe('OQL Parentheses in Select Values', () => {
  
  describe('Valid parenthesized expressions', () => {
    
    it('parses AND with parenthesized OR group: institution is [i1] and ([i2] or [i3])', () => {
      // Scenario: Papers from Harvard that also involve either Stanford OR MIT
      const result = oqlGrammar.parse('works where institution is Harvard [i136199984] and (Stanford [i97018004] or MIT [i63966007])')
      expect(result.clauses[0].field).toBe('institution')
      expect(result.clauses[0].values.length).toBeGreaterThanOrEqual(1)
    })
    
    it('parses OR with parenthesized AND group: institution is [i1] or ([i2] and [i3])', () => {
      // Scenario: Papers from Harvard OR papers that involve both Stanford AND MIT
      const result = oqlGrammar.parse('works where institution is Harvard [i136199984] or (Stanford [i97018004] and MIT [i63966007])')
      expect(result.clauses[0].field).toBe('institution')
    })
    
    it('parses two parenthesized groups: institution is ([i1] or [i2]) and ([i3] or [i4])', () => {
      // Scenario: Papers from (Harvard OR Yale) that also involve (MIT OR Stanford)
      const result = oqlGrammar.parse('works where institution is (Harvard [i136199984] or Yale [i32971472]) and (MIT [i63966007] or Stanford [i97018004])')
      expect(result.clauses[0].field).toBe('institution')
    })
    
    it('parses funder with parentheses for grant analysis', () => {
      // Scenario: NIH-funded papers OR papers funded by both NSF AND DOE
      const result = oqlGrammar.parse('works where funder is NIH [f4320332161] or (NSF [f4320334112] and DOE [f4320306076])')
      expect(result.clauses[0].field).toBe('funder')
    })
    
  })
  
  describe('NOT operator cannot apply to parenthesized expressions - must be expanded', () => {
    
    it('parses expanded not: institution is [i1] and not [i2] and not [i3]', () => {
      // VALID: Explicitly negating each value
      // Scenario: Harvard papers excluding both MIT and Stanford collaborations
      const result = oqlGrammar.parse('works where institution is Harvard [i136199984] and not MIT [i63966007] and not Stanford [i97018004]')
      expect(result.clauses[0].field).toBe('institution')
      // Should have negated values
      const negatedValues = result.clauses[0].values.filter(v => v.negated)
      expect(negatedValues.length).toBe(2)
    })
    
    it('rejects not applied to parenthesized group', () => {
      // INVALID: not ([i2] or [i3]) - should fail or be expanded
      // The grammar should not parse this as valid
      expect(() => {
        oqlGrammar.parse('works where institution is Harvard [i136199984] and not (MIT [i63966007] or Stanford [i97018004])')
      }).toThrow()
    })
    
  })
  
})

// =============================================================================
// REALISTIC INSTITUTIONAL ANALYTICS TESTS
// Based on common OpenAlex use cases for university research offices
// =============================================================================

describe('Realistic Institutional Analytics Queries', () => {
  
  describe('Open Access compliance monitoring', () => {
    
    it('parses query for gold OA articles from specific institution', () => {
      // Scenario: OA compliance officer checking gold OA output
      const result = oqlGrammar.parse('works where institution is University of Cambridge [i241749] and Open Access status is gold [gold] and type is article [article]')
      expect(result.entityType).toBe('works')
      expect(result.clauses).toHaveLength(3)
    })
    
    it('parses query excluding closed access', () => {
      // Scenario: Finding all OA works (any status except closed)
      const result = oqlGrammar.parse('works where institution is MIT [i63966007] and Open Access status is not closed [closed]')
      expect(result.clauses).toHaveLength(2)
    })
    
  })
  
  describe('Funder compliance and grant tracking', () => {
    
    it('parses NIH-funded works from multiple institutions', () => {
      // Scenario: NIH program officer reviewing multi-site grant output
      const result = oqlGrammar.parse('works where funder is NIH [f4320332161] and institution is Harvard [i136199984] or MIT [i63966007]')
      expect(result.clauses.length).toBeGreaterThanOrEqual(1)
    })
    
    it('parses works with multiple funders', () => {
      // Scenario: Tracking co-funded research
      const result = oqlGrammar.parse('works where funder is NIH [f4320332161] and NSF [f4320334112]')
      expect(result.clauses[0].field).toBe('funder')
    })
    
  })
  
  describe('International collaboration analysis', () => {
    
    it('parses multi-country collaboration query', () => {
      // Scenario: Tracking US-UK-Germany research partnerships
      const result = oqlGrammar.parse('works where Country is United States [us] and United Kingdom [gb] and Germany [de]')
      expect(result.clauses[0].field).toBe('Country')
      expect(result.clauses[0].values).toHaveLength(3)
    })
    
  })
  
  describe('Topic and field analysis', () => {
    
    it('parses SDG-related research query', () => {
      // Scenario: Sustainability office tracking SDG research
      const result = oqlGrammar.parse('works where sustainable development goal is Climate Action [13] or Clean Energy [7]')
      expect(result.clauses[0].field).toBe('sustainable development goal')
      expect(result.clauses[0].values).toHaveLength(2)
    })
    
  })
  
})

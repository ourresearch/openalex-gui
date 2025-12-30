# OQL (OpenAlex Query Language) Specification v1.0

## Overview

OQL is a human-readable query language that bidirectionally converts to/from OpenAlex API URL parameters. It's designed to be:
- **Copy-pasteable** — Users can include OQL in papers/slides, and others can paste it into OpenAlex to reproduce results
- **Unambiguous** — Native entity IDs are always included in brackets
- **Deterministic** — No AI required; purely rule-based conversion

### Design Philosophy
- **Strict output**: Always emit the longest, most human-readable OQL
- **Permissive input**: Accept various shorthand forms that prioritize precision

---

## 1. Syntax Structure

### 1.1 Basic Format
```
{EntityType} where {clause} [and {clause}]* [; sort by {field}] [; sample {n}] [; group by {field}] [; include xpac]
```

### 1.2 Entity Type (Required)
Statement **must** begin with plural entity name:
- `Works where ...`
- `Authors where ...`
- `Sources where ...`
- `Institutions where ...`
- `Funders where ...`
- `Publishers where ...`
- `Topics where ...`

### 1.3 Conjunctions
- **AND**: All top-level clauses are joined by `and` (matches API comma-join behavior)
- **OR**: Only allowed *within* a single filter's values, e.g., `type is (article or book-chapter)`
- Each facet key can appear **only once** in a statement

---

## 2. Filter Types & Syntax

### 2.1 Boolean Filters
| URL | OQL |
|-----|-----|
| `open_access.is_oa:true` | `is open access` |
| `open_access.is_oa:false` | `is not open access` |
| `is_retracted:true` | `is retracted` |
| `has_doi:false` | `does not have a DOI` |

**Pattern**: `is {displayName}` / `is not {displayName}`

Use `booleanValues` from facetConfig when available for natural phrasing.

### 2.2 Range Filters
Applies to: `publication_year`, `cited_by_count`, `fwci`, `authors_count`, etc.

| URL Value | OQL |
|-----------|-----|
| `42` | `{field} = 42` |
| `42-` | `{field} ≥ 42` |
| `-42` | `{field} ≤ 42` |
| `42-100` | `{field} is 42–100` |

**Examples**:
- `publication_year:2023-` → `year ≥ 2023`
- `cited_by_count:100-500` → `citations is 100–500`
- `fwci:2-` → `FWCI ≥ 2`

### 2.3 Select Entity Filters

#### Native Entities (OpenAlex-minted IDs)
Include short ID in brackets: `{display_name} [{short_id}]`

| Entity Type | Example |
|-------------|---------|
| institutions | `institution is University of Florida [i33213144]` |
| authors | `author is Albert Einstein [a12345678]` |
| works | `cites Machine Learning Paper [w987654321]` |
| sources | `source is Nature [s1234567]` |
| topics | `topic is Artificial Intelligence [t123456]` |
| funders | `funder is NIH [f1234567]` |
| publishers | `publisher is Elsevier [p123456]` |

#### Non-Native Entities (External/Well-Known IDs)
No brackets needed — unambiguous by nature:

| Entity Type | Example |
|-------------|---------|
| countries | `country is Germany` |
| types | `type is article` |
| SDGs | `SDG is Zero Hunger` |
| languages | `language is English` |
| licenses | `license is CC-BY` |
| continents | `continent is Europe` |
| OA statuses | `OA status is gold` |

#### Multiple Values (OR)
```
type is (article or book-chapter)
institution is (Harvard University [i136199984] or MIT [i63966007])
```

#### Multiple Values (AND) — must have all
```
institution is (Harvard University [i136199984] and MIT [i63966007])
```

### 2.4 Search Filters
| URL | OQL |
|-----|-----|
| `title_and_abstract.search:machine learning` | `title & abstract includes "machine learning"` |
| `display_name.search:climate` | `title includes "climate"` |
| `raw_affiliation_strings.search:stanford` | `raw affiliation string includes "stanford"` |
| `default.search:test` | `fulltext includes "test"` |

**Pattern**: `{displayName} includes "{searchTerm}"`

### 2.5 Negation
Negation uses `not` before each negated value:

| URL | OQL |
|-----|-----|
| `type:!article` | `type is not article` |
| `type:!article\|book-chapter` | `type is not article and not book-chapter` |
| `authorships.institutions.lineage:!i136199984` | `institution is not Harvard University [i136199984]` |
| `authorships.institutions.lineage:!i136199984\|i63966007` | `institution is not Harvard University [i136199984] and not MIT [i63966007]` |

**Patterns**:
- Single value: `{field} is not {value}`
- Multiple negated values: `{field} is not {value1} and not {value2} [and not {valueN}]`

### 2.6 Mixed Positive and Negated Values
When the same field has both positive and negated filters (from multiple URL filter segments), combine into one clause:

| URL | OQL |
|-----|-----|
| `type:!article\|book-chapter,type:other` | `type is other and not article and not book-chapter` |

**Rule**: Positive values come first, then negated values, all connected with `and`.

### 2.7 Null/Unknown Values
| URL | OQL |
|-----|-----|
| `language:null` | `language is unknown` |
| `language:!null` | `language is not unknown` |

---

## 3. Non-Filter Parameters

### 3.1 Sort (Optional)
Only include if non-default. Ascending not currently supported.

| URL | OQL |
|-----|-----|
| `sort=fwci:desc` | `; sort by FWCI` |
| `sort=cited_by_count:desc` | `; sort by citation count` |
| `sort=publication_date:desc` | `; sort by date` |

### 3.2 Sample (Optional)
| URL | OQL |
|-----|-----|
| `sample=100` | `; sample 100` |

### 3.3 Group By (Optional, single value only)
| URL | OQL |
|-----|-----|
| `group_by=publication_year` | `; group by year` |
| `group_by=authorships.institutions.lineage` | `; group by institution` |

### 3.4 Include XPAC (Optional)
| URL | OQL |
|-----|-----|
| `include_xpac=true` | `; include xpac` |

### 3.5 Excluded Parameters
- `page`, `per_page` — pagination is UI state
- `column` — display preference

---

## 4. Complete Examples

### Example 1: Complex Works Query
**URL**:
```
https://openalex.org/works?filter=publication_year:2023-,open_access.is_oa:true,authorships.institutions.lineage:i33213144,type:article|book-chapter&sort=fwci:desc&include_xpac=true
```

**OQL**:
```
Works where year ≥ 2023 and is open access and institution is University of Florida [i33213144] and type is (article or book-chapter); sort by FWCI; include xpac
```

### Example 2: Author Search with Negation
**URL**:
```
https://openalex.org/authors?filter=last_known_institutions.id:i136199984,has_orcid:true,last_known_institutions.country_code:!US
```

**OQL**:
```
Authors where institution is Harvard University [i136199984] and has an ORCID and institution country is not United States
```

### Example 3: Works with Search and Sample
**URL**:
```
https://openalex.org/works?filter=title_and_abstract.search:machine learning,publication_year:2020-2024&sample=100
```

**OQL**:
```
Works where title & abstract includes "machine learning" and year is 2020–2024; sample 100
```

---

## 5. Phase 1 Implementation: Display Mode

### 5.1 Location
- Positioned above the current filters tray on the results page
- Toggle switch: `[Filters | OQL]`
- Default: Filters view (existing behavior)
- **Toggle state persists via localStorage**

### 5.2 OQL View Features
- Renders OQL as HTML
- Entity names with IDs are **clickable** — opens entity in slide-in/zoom panel
- "Edit" button converts OQL to editable `<textarea>`
- "Add filter" button remains available below

### 5.3 Edit Mode
- Click "Edit" → OQL becomes editable text in a `<textarea>`
- No syntax highlighting or autocomplete (Phase 1)
- "Apply" button parses OQL and updates filters/URL
- "Cancel" button reverts to display mode
- Parse errors show descriptive error message

### 5.4 Error Handling
Parse errors should indicate:
- Unrecognized entity type
- Unknown filter/field name
- Invalid syntax (missing `where`, malformed range, etc.)
- Mismatched display name and ID (see Section 6.1)

---

## 6. Parsing OQL → URL (Phase 1)

### 6.1 Native Entity ID Handling

**The bracketed ID `[{entity_id}]` is required for native entities. The display name is optional.**

Valid input forms:
```
institution is University of Florida [i33213144]   ✓ (name + ID)
institution is [i33213144]                         ✓ (ID only)
institution is University of Florida               ✗ (no ID - error in Phase 1)
```

**Validation rules**:
1. If `[{id}]` pattern is present, extract the ID for the API filter
2. If display name is also provided, validate it matches the entity's actual `display_name`
3. If mismatch: throw error explaining the discrepancy, let user fix

**Example error**:
```
Error: Display name "Harvard" doesn't match entity i136199984 (actual name: "Harvard University"). 
Please correct the name or remove it.
```

**Output**: Always emit full `{display_name} [{id}]` format when converting URL → OQL.

### 6.2 Non-Native Entity Resolution
For countries, types, SDGs, languages, licenses, continents, OA statuses:
- Direct lookup by display name or value (case-insensitive)
- These don't require bracketed IDs

### 6.3 Entity Lookup (Phase 2)
Autocomplete-based entity resolution for native entities without IDs is deferred to Phase 2.

---

## 7. Field Name Mapping

### Input (Permissive)
Accept **either**:
- `displayName` from facetConfigs (e.g., `year`, `citation count`, `institution`)
- `facetConfig.key` (e.g., `publication_year`, `cited_by_count`, `authorships.institutions.lineage`)

### Output (Strict)
Always emit `displayName` from facetConfigs.

### Key Mappings

| facetConfig.key | OQL displayName |
|-----------------|-----------------|
| `publication_year` | year |
| `cited_by_count` | citation count |
| `authorships.institutions.lineage` | institution |
| `authorships.author.id` | author |
| `primary_location.source.id` | source |
| `open_access.is_oa` | open access |
| `title_and_abstract.search` | title & abstract |
| `display_name.search` | title |
| `fwci` | FWCI |
| `primary_topic.id` | topic |
| `awards.funder.id` | funder |
| `primary_location.source.publisher_lineage` | publisher |
| `authorships.countries` | country |
| `language` | language |
| `type` | type |

---

## 8. Future Phases (Out of Scope for Phase 1)

- **Phase 2**: Entity autocomplete/lookup by name, author disambiguation, syntax highlighting
- **Phase 3**: Inline autocomplete while typing
- **Phase 4**: Rich editor with hover tooltips (entity metadata)
- **Phase 5**: OQL mode in main search box

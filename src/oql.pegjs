// OQL (OpenAlex Query Language) Grammar
// Peggy parser for bidirectional OQL ↔ URL conversion

{
  // Helper to flatten arrays
  function flattenValues(values) {
    return values.flat ? values.flat() : values;
  }
}

// =============================================================================
// TOP LEVEL
// =============================================================================

Query
  = _ entityType:EntityType _ "where"i _ clauses:ClauseList options:Options? _ {
      return {
        entityType: entityType,
        clauses: clauses,
        options: options || {}
      };
    }
  / _ entityType:EntityType _ {
      return {
        entityType: entityType,
        clauses: [],
        options: {}
      };
    }

EntityType
  = "Works"i { return "works"; }
  / "Authors"i { return "authors"; }
  / "Sources"i { return "sources"; }
  / "Institutions"i { return "institutions"; }
  / "Funders"i { return "funders"; }
  / "Publishers"i { return "publishers"; }
  / "Topics"i { return "topics"; }
  / "Keywords"i { return "keywords"; }
  / "Concepts"i { return "concepts"; }

// =============================================================================
// CLAUSES
// =============================================================================

ClauseList
  = first:Clause rest:(_ "and"i !(_ "not"i) _ Clause)* {
      return [first, ...rest.map(r => r[4])];
    }

// Order matters: try more specific patterns first
Clause
  = BooleanClause
  / SearchClause
  / RangeClause
  / SelectClause

// =============================================================================
// BOOLEAN CLAUSE: "it's Open Access" - starts with "it's"
// =============================================================================

BooleanClause
  = "it's"i _ value:BooleanValue {
      return { type: "boolean", value: value };
    }

BooleanValue
  = chars:$[a-zA-Z0-9 ]+ { return chars.trim(); }

// =============================================================================
// RANGE CLAUSE: "year is 2023", "year ≥ 2023", "citations is 100–500"
// =============================================================================

RangeClause
  = field:SimpleFieldName _ op:RangeOperator _ value:RangeValue {
      return { type: "range", field: field, operator: op, value: value };
    }

RangeOperator
  = ">=" { return ">="; }
  / "≥" { return ">="; }
  / "<=" { return "<="; }
  / "≤" { return "<="; }
  / "=" { return "="; }
  / "is"i { return "is"; }

RangeValue
  = min:Integer "–" max:Integer { return { min: min, max: max }; }
  / min:Integer "-" max:Integer { return { min: min, max: max }; }
  / value:Integer { return { exact: value }; }

Integer
  = digits:$[0-9]+ { return parseInt(digits, 10); }

// =============================================================================
// SEARCH CLAUSE: "title includes \"machine learning\""
// =============================================================================

SearchClause
  = field:SimpleFieldName _ "includes"i _ '"' searchTerm:$[^"]* '"' {
      return { type: "search", field: field, value: searchTerm };
    }

// =============================================================================
// SELECT CLAUSE: "type is article", "institution is Harvard [i123]"
// =============================================================================

SelectClause
  = field:SimpleFieldName _ "is"i _ "not"i _ values:NegatedValueList {
      return { type: "select", field: field, values: values, allNegated: true };
    }
  / field:SimpleFieldName _ "is"i _ values:MixedValueList {
      return { type: "select", field: field, values: values, allNegated: false };
    }

// Simple field name: words that are NOT operators, joined by spaces
SimpleFieldName
  = first:FieldWord rest:(_ FieldWord)* {
      return [first, ...rest.map(r => r[1])].join(' ');
    }

FieldWord
  = !("is"i / "includes"i / "and"i / "not"i / "it's"i) chars:$[a-zA-Z0-9&_-]+ {
      return chars;
    }

// Mixed values: positive and/or negated, e.g., "other and not article and not book-chapter"
MixedValueList
  = first:SelectValue rest:(_ "and"i _ SelectValue)* {
      return [first, ...rest.map(r => r[3])];
    }

// Negated value list: "not X and not Y"
NegatedValueList
  = first:NegatedValue rest:(_ "and"i _ NegatedValue)* {
      return [first, ...rest.map(r => r[3])];
    }

NegatedValue
  = "not"i _ value:SingleValue {
      return { ...value, negated: true };
    }

SelectValue
  = "not"i _ value:SingleValue {
      return { ...value, negated: true };
    }
  / value:SingleValue {
      return { ...value, negated: false };
    }

// A single value: either with bracketed ID (native entity) or plain text (non-native)
SingleValue
  = displayName:DisplayNameWithId _ "[" id:ShortId "]" {
      return { displayName: displayName.trim(), id: id };
    }
  / "unknown"i {
      return { displayName: "unknown", id: null, isNull: true };
    }
  / displayName:PlainDisplayName {
      return { displayName: displayName.trim(), id: null };
    }

// Display name that ends at a bracketed ID - uses negative lookahead
DisplayNameWithId
  = chars:(!("[" ShortId "]") .)+ {
      return chars.map(c => c[1]).join('');
    }

// Plain display name for non-native entities (no brackets)
// Stops at: "and", end of input, semicolon, or closing bracket
PlainDisplayName
  = chars:$(!"and"i ![\];] .)+ {
      return chars.trim();
    }

ShortId
  = prefix:[a-zA-Z] digits:$[0-9]+ {
      return (prefix + digits).toLowerCase();
    }

// =============================================================================
// OPTIONS: "; sort by X", "; sample N", etc.
// =============================================================================

Options
  = opts:Option+ {
      return opts.reduce((acc, opt) => ({ ...acc, ...opt }), {});
    }

Option
  = _ ";" _ "sort"i _ "by"i _ field:FieldName {
      return { sort: field.trim() };
    }
  / _ ";" _ "sample"i _ n:Integer {
      return { sample: n };
    }
  / _ ";" _ "group"i _ "by"i _ field:FieldName {
      return { groupBy: field.trim() };
    }
  / _ ";" _ "include"i _ "xpac"i {
      return { includeXpac: true };
    }

// =============================================================================
// FIELD NAME: For options (sort by, group by) - simpler pattern
// =============================================================================

FieldName
  = chars:$[a-zA-Z0-9 &_-]+ { return chars.trim(); }

// =============================================================================
// WHITESPACE
// =============================================================================

_ "whitespace"
  = [ \t\n\r]*

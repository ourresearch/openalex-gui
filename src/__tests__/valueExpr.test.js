import { describe, it, expect } from 'vitest';
import { parseValueExpr, isCompoundValue } from '../components/Oql/valueExpr.js';

// oxjob #507 Phases 5 + 6 — parse a single value chip's typed text into a boolean
// AST (terms joined by and/or, optional not, optional parens). Standard precedence
// NOT > AND > OR; flattened same-join groups; quoted runs are one literal term.

describe('parseValueExpr — single values', () => {
  it('a plain term is a leaf, not compound', () => {
    expect(parseValueExpr('cancer')).toEqual({ t: 'leaf', value: 'cancer', negated: false });
    expect(isCompoundValue('cancer')).toBe(false);
  });
  it('a multi-word phrase stays ONE leaf', () => {
    expect(parseValueExpr('machine learning')).toEqual({ t: 'leaf', value: 'machine learning', negated: false });
    expect(isCompoundValue('machine learning')).toBe(false);
  });
  it('a quoted phrase keeps its quotes and "or" inside stays literal', () => {
    expect(parseValueExpr('"rock or roll"')).toEqual({ t: 'leaf', value: '"rock or roll"', negated: false });
    expect(isCompoundValue('"rock or roll"')).toBe(false);
  });
  it('empty / whitespace input parses to null', () => {
    expect(parseValueExpr('')).toBeNull();
    expect(parseValueExpr('   ')).toBeNull();
    expect(isCompoundValue('')).toBe(false);
  });
  it('a bare `not foo` is a negated leaf but NOT treated as compound', () => {
    expect(parseValueExpr('not foo')).toEqual({ t: 'leaf', value: 'foo', negated: true });
    expect(isCompoundValue('not foo')).toBe(false);
  });
});

describe('parseValueExpr — OR / AND flattening', () => {
  it('a or b or c → one flat OR group of three', () => {
    expect(parseValueExpr('cancer or tumor or neoplasm')).toEqual({
      t: 'group', join: 'or', children: [
        { t: 'leaf', value: 'cancer', negated: false },
        { t: 'leaf', value: 'tumor', negated: false },
        { t: 'leaf', value: 'neoplasm', negated: false },
      ],
    });
    expect(isCompoundValue('cancer or tumor or neoplasm')).toBe(true);
  });
  it('a and b → flat AND group', () => {
    expect(parseValueExpr('a and b')).toEqual({
      t: 'group', join: 'and', children: [
        { t: 'leaf', value: 'a', negated: false },
        { t: 'leaf', value: 'b', negated: false },
      ],
    });
  });
  it('case-insensitive connectives (AND / Or)', () => {
    expect(parseValueExpr('a AND b').join).toBe('and');
    expect(parseValueExpr('a Or b').join).toBe('or');
  });
  it('multi-word operands across connectives', () => {
    expect(parseValueExpr('machine learning or deep learning')).toEqual({
      t: 'group', join: 'or', children: [
        { t: 'leaf', value: 'machine learning', negated: false },
        { t: 'leaf', value: 'deep learning', negated: false },
      ],
    });
  });
});

describe('parseValueExpr — precedence (NOT > AND > OR)', () => {
  it('a or b and c → a or (b and c)', () => {
    expect(parseValueExpr('a or b and c')).toEqual({
      t: 'group', join: 'or', children: [
        { t: 'leaf', value: 'a', negated: false },
        { t: 'group', join: 'and', children: [
          { t: 'leaf', value: 'b', negated: false },
          { t: 'leaf', value: 'c', negated: false },
        ] },
      ],
    });
  });
  it('a and b or c → (a and b) or c', () => {
    expect(parseValueExpr('a and b or c')).toEqual({
      t: 'group', join: 'or', children: [
        { t: 'group', join: 'and', children: [
          { t: 'leaf', value: 'a', negated: false },
          { t: 'leaf', value: 'b', negated: false },
        ] },
        { t: 'leaf', value: 'c', negated: false },
      ],
    });
  });
});

describe('parseValueExpr — parentheses (Phase 6)', () => {
  it('(a or b) and c overrides precedence', () => {
    expect(parseValueExpr('(cancer or tumor) and therapy')).toEqual({
      t: 'group', join: 'and', children: [
        { t: 'group', join: 'or', children: [
          { t: 'leaf', value: 'cancer', negated: false },
          { t: 'leaf', value: 'tumor', negated: false },
        ] },
        { t: 'leaf', value: 'therapy', negated: false },
      ],
    });
  });
  it('crossgrain: (a and b) or (c and d)', () => {
    expect(parseValueExpr('(a and b) or (c and d)')).toEqual({
      t: 'group', join: 'or', children: [
        { t: 'group', join: 'and', children: [
          { t: 'leaf', value: 'a', negated: false }, { t: 'leaf', value: 'b', negated: false },
        ] },
        { t: 'group', join: 'and', children: [
          { t: 'leaf', value: 'c', negated: false }, { t: 'leaf', value: 'd', negated: false },
        ] },
      ],
    });
  });
  it('parens glued to words tokenize correctly', () => {
    expect(parseValueExpr('(a or b)and c').join).toBe('and');
  });
  it('an unclosed paren is tolerated (live typing)', () => {
    expect(parseValueExpr('(a or b').join).toBe('or');
  });
});

describe('parseValueExpr — negation (De Morgan to NNF)', () => {
  it('a and not b → AND of [a, not b]', () => {
    expect(parseValueExpr('a and not b')).toEqual({
      t: 'group', join: 'and', children: [
        { t: 'leaf', value: 'a', negated: false },
        { t: 'leaf', value: 'b', negated: true },
      ],
    });
  });
  it('not (a or b) → (not a and not b)', () => {
    expect(parseValueExpr('not (a or b)')).toEqual({
      t: 'group', join: 'and', children: [
        { t: 'leaf', value: 'a', negated: true },
        { t: 'leaf', value: 'b', negated: true },
      ],
    });
  });
});

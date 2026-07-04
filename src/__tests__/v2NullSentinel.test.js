import { describe, it, expect } from 'vitest';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';
import { treeToTokens } from '../components/Oql/treeToTokens.js';

// oxjob #554 — `unknown` inside a value group is the null sentinel: a vleaf with
// `value: null` (+ display "unknown") is a REAL value, distinct from a transient
// empty box (always `value: ""`). It must (1) survive the tree→OQO round-trip
// (vFilled must not strip it) and (2) render as an `unknown` chip inside the
// always-parenthesized value group, never as a "new <type>" placeholder.

const mixedTree = {
  where: {
    node: 'clause', id: 'c1', column_id: 'language', column: 'language',
    operator: 'is',
    value: {
      node: 'vgroup', id: 'g1', join: 'or',
      children: [
        { node: 'vleaf', id: 'v1', value: 'en', display: 'en', negated: false },
        { node: 'vleaf', id: 'v2', value: null, display: 'unknown', negated: false },
      ],
    },
  },
};

describe('null sentinel in value groups (#554)', () => {
  it('survives tree→OQO: `is (en or unknown)` keeps the null leaf', () => {
    const rows = v2FilterRows(mixedTree);
    expect(rows).toHaveLength(1);
    expect(rows[0].join).toBe('or');
    const vals = rows[0].filters.map((f) => f.value);
    expect(vals).toContain('en');
    expect(vals).toContain(null);
  });

  it('a transient empty box ("") is still stripped', () => {
    const t = JSON.parse(JSON.stringify(mixedTree));
    t.where.value.children.push({ node: 'vleaf', id: 'v3', value: '', display: '', negated: false });
    const rows = v2FilterRows(t);
    expect(rows[0].filters).toHaveLength(2); // en + null, "" dropped
  });

  it('a group collapsed to the sole null sentinel keeps the clause', () => {
    const t = JSON.parse(JSON.stringify(mixedTree));
    t.where.value.children = t.where.value.children.filter((v) => v.value === null);
    const rows = v2FilterRows(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(null); // singleton group collapses to the leaf
  });

  it('renders as an `unknown` brick inside parens (never a placeholder)', () => {
    const toks = treeToTokens({ entity: { id: 'works', text: 'works' },
      where_keyword: ' where ', where: mixedTree.where });
    const text = toks.map((t) => t.text).join('');
    expect(text).toBe('works where language is (en or unknown)');
    const sentinel = toks.find((t) => t.t === 'vbrick' && t.value === null);
    expect(sentinel.display).toBe('unknown');
  });

  it('a bare single-vleaf clause value renders with the canonical parens', () => {
    const t = {
      entity: { id: 'works', text: 'works' }, where_keyword: ' where ',
      where: { node: 'clause', id: 'c1', column_id: 'type', column: 'type',
        operator: 'is',
        value: { node: 'vleaf', id: 'v1', value: 'article', display: 'article',
          negated: false } },
    };
    expect(treeToTokens(t).map((x) => x.text).join('')).toBe('works where type is (article)');
  });
});

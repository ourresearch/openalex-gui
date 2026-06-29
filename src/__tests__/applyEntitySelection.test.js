import { describe, it, expect } from 'vitest';
import {
    applyEntitySelection,
    filtersFromUrlStr,
    filtersAsUrlStr,
} from '../filterConfigs';

// Regression coverage for the collaboration-AND bug (Krista @ Concordia,
// 2026-06): adding a second/third institution in the works SERP must be able to
// AND (separate clauses = intersection) instead of always collapsing into one
// pipe-OR "is any of" clause (union). The shared EntityValuePicker used to read
// ALL same-key clauses and rewrite them as a single OR clause, which silently
// turned "Concordia AND Dalhousie" into "Concordia OR Dalhousie".
//
// applyEntitySelection is the pure decision the picker now delegates to. AND is
// expressed as separate comma-joined clauses; OR as pipe-joined options in one.
const KEY = 'authorships.institutions.lineage';
const MCGILL = 'i5023651';
const CONCORDIA = 'i60158472';
const DALHOUSIE = 'i129902397';

const apply = (urlStr, opts) =>
    filtersAsUrlStr(applyEntitySelection({
        entityType: 'works',
        filterKey: KEY,
        currentFilters: filtersFromUrlStr('works', urlStr),
        ...opts,
    }));

describe('applyEntitySelection — collaboration AND fix', () => {
    // The two-institution AND query Kyle hand-built for Krista.
    const TWO_AND = `${KEY}:${CONCORDIA},${KEY}:${MCGILL}`;

    describe('appendNew ("Add filter")', () => {
        it('adds a 3rd institution as a SEPARATE AND clause, not an OR', () => {
            // initSelection starts empty in appendNew mode, so the picker's
            // selection is only the newly-picked institution.
            const out = apply(TWO_AND, {
                appendNew: true,
                selectedEntityIds: [DALHOUSIE],
            });
            // Three comma-separated clauses = AND of all three (intersection).
            expect(out).toBe(`${KEY}:${CONCORDIA},${KEY}:${MCGILL},${KEY}:${DALHOUSIE}`);
            // And specifically NOT collapsed into a single pipe-OR clause.
            expect(out).not.toContain('|');
        });

        it('creates the first clause when none exists yet', () => {
            const out = apply('', { appendNew: true, selectedEntityIds: [DALHOUSIE] });
            expect(out).toBe(`${KEY}:${DALHOUSIE}`);
        });

        it('preserves existing clauses when the new selection is empty (no-op clear)', () => {
            const out = apply(TWO_AND, { appendNew: true, selectedEntityIds: [] });
            expect(out).toBe(TWO_AND);
        });
    });

    describe('filterIndex (advanced row edit)', () => {
        it('edits ONLY its own clause, leaving the other AND clause intact', () => {
            // Edit row 1 (McGill) to McGill-or-Dalhousie; row 0 (Concordia) must
            // stay a separate AND clause, not get folded in.
            const out = apply(TWO_AND, {
                filterIndex: 1,
                selectedEntityIds: [MCGILL, DALHOUSIE],
            });
            expect(out).toBe(`${KEY}:${CONCORDIA},${KEY}:${MCGILL}|${DALHOUSIE}`);
        });

        it('drops only its own row when cleared, keeping the other AND clause', () => {
            const out = apply(TWO_AND, { filterIndex: 1, selectedEntityIds: [] });
            expect(out).toBe(`${KEY}:${CONCORDIA}`);
        });
    });

    describe('basic chip (neither flag) — one chip per facet stays OR', () => {
        it('collapses all same-key clauses into a single pipe-OR clause', () => {
            // The basic-mode chip aggregates every same-key clause; this is the
            // intended union behavior and must be preserved.
            const out = apply(TWO_AND, {
                selectedEntityIds: [CONCORDIA, MCGILL, DALHOUSIE],
            });
            expect(out).toBe(`${KEY}:${CONCORDIA}|${MCGILL}|${DALHOUSIE}`);
        });
    });
});

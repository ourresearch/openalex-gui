import {describe, expect, it} from 'vitest';
import {index, needRows, pinned, sortRows, statsFor} from '@/questionMap';

const run = (correct, verdict = correct ? 'answers' : 'no') => ({verdict, correct});
const q = (id, need, label, rung, runs = {}, kind = 'data') => ({id, text: `question ${id}`, need, label, rung, runs, kind});

const data = index({
    labels: [{key: 'real'}, {key: 'synthetic'}],
    rungs: [1, 2, 3, 4, 5].map(n => ({n, name: `r${n}`})),
    branches: [{id: 'A', name: 'Find', nodes: [{id: 'A1', name: 'Search', needs: ['A1.1', 'A1.2']}]}],
    appendices: [],
    needs: {'A1.1': {id: 'A1.1', prevalence: {website_users: 10, api_keys: 5}}, 'A1.2': {id: 'A1.2', prevalence: {}}},
    questions: [
        q('1', 'A1.1', 'real', 1, {opus: run(true), haiku: run(false)}),
        q('2', 'A1.1', 'synthetic', 2, {opus: run(false), haiku: run(false, 'partly')}),
        q('3', 'A1.2', 'real', 5, {}, 'not_data'),
        q('4', 'A1.2', 'real', 3, {opus: run(false)}),
        q('5', 'A1.2', 'real', 4),
    ],
});

describe('question map stats', () => {
    it('counts rungs, labels and per-model accuracy on data questions only', () => {
        const s = statsFor(data.byNeed['A1.1']);
        expect(s.n).toBe(2);
        expect(s.real).toBe(1);
        expect(s.oneQuery).toBe(1);
        expect(s.arms.opus).toMatchObject({right: 1, tested: 2, share: 0.5});
        expect(s.arms.haiku).toMatchObject({right: 0, tested: 2});
        expect(s.arms.sonnet.share).toBeNull();
    });

    it('takes the median rung as typical and ignores not-data questions for models', () => {
        const s = statsFor(data.byNeed['A1.2']);
        expect(s.typicalRung).toBe(4);
        expect(s.oneQuery).toBe(0);
        expect(s.arms.opus.tested).toBe(1);
    });

    it('filters by source and sorts easiest first', () => {
        const rows = needRows(data, {labels: new Set(['real'])});
        expect(rows.map(r => r.stats.n)).toEqual([1, 3]);
        expect(sortRows(rows, 'ease').map(r => r.need.id)).toEqual(['A1.1', 'A1.2']);
        expect(sortRows(rows, 'common')[0].need.id).toBe('A1.1');
    });

    it('pins a real user success and the agent-misses failure', () => {
        const p = pinned(data.byNeed['A1.1']);
        expect(p.success.id).toBe('1');
        expect(p.failure.id).toBe('2');
    });
});

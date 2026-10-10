import {describe, expect, it} from 'vitest';
import {index, labelsFromQuery, matches, needRows, pinned, sortRows, statsFor, toggled} from '@/questionMap';

const run = (correct, verdict = correct ? 'answers' : 'no') => ({verdict, correct});
const q = (id, need, label, rung, runs = {}, kind = 'data', wording = 'own') =>
    ({id, text: `Question ${id}`, need, label, rung, runs, kind, wording});

const data = index({
    labels: [{key: 'real'}, {key: 'synthetic'}],
    rungs: [1, 2, 3, 4, 5].map(n => ({n, name: `r${n}`})),
    arms: [{key: 'haiku', name: 'Haiku'}, {key: 'sonnet', name: 'Sonnet'}, {key: 'opus', name: 'Opus', launch: true}],
    branches: [{id: 'A', name: 'Find', nodes: [{id: 'A1', name: 'Search', needs: ['A1.1', 'A1.2']}]}],
    appendices: [{id: 'O', name: 'Out', needs: ['O1']}],
    needs: {
        'A1.1': {id: 'A1.1', branch: 'A', scope: 'in', prevalence: {website_users: 10, api_keys: 5}},
        'A1.2': {id: 'A1.2', branch: 'A', scope: 'in', prevalence: {}},
        O1: {id: 'O1', branch: 'O', scope: 'out', prevalence: {}},
    },
    questions: [
        q('1', 'A1.1', 'real', 1, {opus: run(true), haiku: run(false)}),
        q('2', 'A1.1', 'synthetic', 2, {opus: run(false), haiku: run(false, 'partly')}, 'data', 'model'),
        q('3', 'A1.2', 'real', 5, {}, 'not_data'),
        q('4', 'A1.2', 'real', 3, {opus: run(false)}),
        q('5', 'A1.2', 'real', 4),
        q('6', 'O1', 'real', 5),
    ],
});

describe('question map', () => {
    it('indexes branch, scope, lowercased text and the launch arm', () => {
        expect(data.inScope.map(x => x.id)).toEqual(['1', '2', '3', '4', '5']);
        expect(data.questions[0]).toMatchObject({branch: 'A', lc: 'question 1'});
        expect(data.launch.key).toBe('opus');
    });

    it('counts rungs, labels, wording and per-model accuracy on data questions only', () => {
        const s = statsFor(data.byNeed['A1.1'], data.arms);
        expect(s).toMatchObject({n: 2, real: 1, own: 1, oneQuery: 1});
        expect(s.arms.opus).toMatchObject({right: 1, tested: 2, share: 0.5});
        expect(s.arms.haiku).toMatchObject({right: 0, tested: 2});
        expect(s.arms.sonnet.share).toBeNull();
    });

    it('takes the median rung as typical and ignores not-data questions for models', () => {
        const s = statsFor(data.byNeed['A1.2'], data.arms);
        expect(s.typicalRung).toBe(4);
        expect(s.oneQuery).toBe(0);
        expect(s.arms.opus.tested).toBe(1);
    });

    it('filters, then sorts needs easiest first', () => {
        const qs = data.inScope.filter(x => matches(x, {labels: new Set(['real']), search: 'question'}));
        const rows = needRows(data, qs);
        expect(rows.map(r => r.stats.n)).toEqual([1, 3]);
        expect(sortRows(rows, 'ease', 'opus').map(r => r.need.id)).toEqual(['A1.1', 'A1.2']);
        expect(sortRows(rows, 'common', 'opus')[0].need.id).toBe('A1.1');
        expect(data.inScope.filter(x => matches(x, {wording: 'model'})).map(x => x.id)).toEqual(['2']);
    });

    it('pins a real user success and the agent-misses failure', () => {
        const p = pinned(data.byNeed['A1.1'], 'opus');
        expect(p.success.id).toBe('1');
        expect(p.failure.id).toBe('2');
    });

    it('reads and toggles the source filter', () => {
        expect([...labelsFromQuery({sources: 'real,bogus'}, data.labels)]).toEqual(['real']);
        expect(labelsFromQuery({}, data.labels).size).toBe(2);
        expect([...toggled(new Set(['real']), 'synthetic')]).toEqual(['real', 'synthetic']);
    });
});

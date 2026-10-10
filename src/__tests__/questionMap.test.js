import {describe, expect, it} from 'vitest';
import {armShares, feedbackText, hasResult, index, mark, matches, referenceOql, sortQuestions} from '@/questionMap';

const run = (correct, verdict = correct ? 'answers' : 'no') => ({verdict, correct});
const q = (id, need, label, rung, runs = {}, extra = {}) =>
    ({id, text: `Question ${id}`, need, label, rung, runs, kind: 'data', wording: 'user', ...extra});

const data = index({
    labels: [{key: 'real'}, {key: 'synthetic'}],
    wordings: [{key: 'user'}, {key: 'person'}, {key: 'model'}],
    arms: [{key: 'haiku', name: 'Haiku'}, {key: 'sonnet', name: 'Sonnet'}, {key: 'opus', name: 'Opus', launch: true}],
    branches: [{id: 'A', name: 'Find', nodes: [{id: 'A1', name: 'Search', needs: ['A1.1', 'A1.2']}]}],
    appendices: [],
    needs: {
        'A1.1': {id: 'A1.1', branch: 'A', scope: 'in'},
        'A1.2': {id: 'A1.2', branch: 'A', scope: 'in'},
        O1: {id: 'O1', branch: 'O', scope: 'out'},
    },
    questions: [
        q('1', 'A1.2', 'real', 4, {opus: run(true), haiku: run(false)}, {gold: {oql: 'get works', sort: null}}),
        q('2', 'A1.1', 'synthetic', 1, {opus: run(false), haiku: run(false, 'partly'), sonnet: run(true)}, {wording: 'model'}),
        q('3', 'A1.1', 'real', 2, {opus: run(false), haiku: run(false), sonnet: run(false)}, {grade: {oql: 'get authors'}}),
        q('4', 'O1', 'real', 5),
    ],
});

describe('question map', () => {
    it('keeps in-scope questions, the launch arm and each need\'s ease', () => {
        expect(data.inScope.map(x => x.id)).toEqual(['1', '2', '3']);
        expect(data.launch.key).toBe('opus');
        expect(data.ease['A1.1']).toBe(1.5);
    });

    it('orders easiest types first, easiest questions first within a type', () => {
        expect(sortQuestions(data.inScope, 'ease', data).map(x => x.id)).toEqual(['2', '3', '1']);
        expect(sortQuestions(data.inScope, 'hard', data).map(x => x.id)).toEqual(['1', '2', '3']);
    });

    it('filters by wording, need and how the models did', () => {
        expect(data.inScope.filter(x => matches(x, {wordings: new Set(['model'])})).map(x => x.id)).toEqual(['2']);
        expect(data.inScope.filter(x => matches(x, {need: 'A1.1', search: 'question 3'})).map(x => x.id)).toEqual(['3']);
        expect(data.inScope.filter(x => hasResult(x, 'launchWrong', data)).map(x => x.id)).toEqual(['2', '3']);
        expect(data.inScope.filter(x => hasResult(x, 'split', data)).map(x => x.id)).toEqual(['1', '2']);
        expect(data.inScope.filter(x => hasResult(x, 'allWrong', data)).map(x => x.id)).toEqual(['3']);
    });

    it('scores each model on judged data questions', () => {
        const s = Object.fromEntries(armShares(data.inScope, data.arms).map(a => [a.key, a]));
        expect(s.opus).toMatchObject({right: 1, tested: 3});
        expect(s.sonnet).toMatchObject({right: 1, tested: 2});
    });

    it('shows checked gold first, else the grader\'s query, and marks verdicts', () => {
        expect(referenceOql(data.questions[0])).toMatchObject({oql: 'get works', checked: true});
        expect(referenceOql(data.questions[2])).toMatchObject({oql: 'get authors', checked: false});
        expect([run(true), run(false, 'partly'), run(false), null].map(r => mark(r).key)).toEqual(['good', 'partly', 'bad', 'none']);
    });

    it('turns the judge calls into text to paste back', () => {
        const t = feedbackText({'3|opus': {call: 'disagrees', note: 'it is right'}}, data);
        expect(t).toContain('3 · opus: judge said "no"; Jason disagrees. Note: it is right');
    });
});

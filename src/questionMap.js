// The question map (oxjob #1618): every question OQL and the chat agent must answer, one row each.
//
// Staff only. The data quotes real users (support tickets, forum posts), and this repo is public, so nothing here
// ships it: the page fetches it from oxjobs.org with the viewer's API key, which serves it to OpenAlex admins only.
// The vocabulary (needs, rungs, source labels, wordings, model arms, gap names) comes with the data too.
// Pure logic, so it can be unit-tested.
import {markRaw} from 'vue';

const DATA_URL = 'https://oxjobs.org/admin-data/1618/map_data.json.gz';
const FEEDBACK_KEY = 'oxQuestionMapFeedback';

let pending = null;

export function loadQuestionMap() {
    if (!pending) {
        const token = localStorage.getItem('token');
        pending = fetch(DATA_URL, {headers: token ? {Authorization: `Bearer ${token}`} : {}})
            .then(r => {
                if (r.status === 401) throw new Error('Only OpenAlex staff can see the question map. Log in with a staff account.');
                if (!r.ok) throw new Error(`Couldn't load the question map (HTTP ${r.status}).`);
                return r.json();
            })
            .then(index)
            .catch(e => {
                pending = null;
                throw e;
            });
    }
    return pending;
}

// Lookups the page needs, built once. The data never changes after load, so it is marked raw: Vue doesn't track
// its ~1,600 questions property by property.
export function index(data) {
    const byNeed = {};
    for (const q of data.questions) {
        const need = data.needs[q.need];
        q.branch = need?.branch;
        q.inScope = need?.scope === 'in';
        q.lc = q.text.toLowerCase();
        (byNeed[q.need] ||= []).push(q);
    }
    // A need's difficulty: the mean rung of its questions. Orders the list easiest first.
    const ease = {};
    for (const [id, qs] of Object.entries(byNeed)) {
        const rated = qs.filter(q => q.rung);
        ease[id] = rated.length ? rated.reduce((t, q) => t + q.rung, 0) / rated.length : 9;
    }
    const mapOrder = {};
    let i = 0;
    for (const b of data.branches) for (const n of b.nodes) for (const id of n.needs) mapOrder[id] = i++;
    return markRaw({
        ...data,
        wordingByKey: Object.fromEntries(data.wordings.map(w => [w.key, w])),
        byNeed,
        ease,
        mapOrder,
        inScope: data.questions.filter(q => q.inScope),
        launch: data.arms.find(a => a.launch) || data.arms[data.arms.length - 1],
    });
}

// How the models did on a question, for the "Result" filter.
export const RESULTS = {
    launchWrong: 'Launch agent wrong',
    launchRight: 'Launch agent right',
    split: 'Models disagree',
    allWrong: 'All wrong',
};

function judged(q, arms) {
    return arms.map(a => q.runs?.[a.key]).filter(r => r?.verdict);
}

export function hasResult(q, result, data) {
    if (!result) return true;
    const runs = judged(q, data.arms);
    if (!runs.length) return false;
    const launch = q.runs?.[data.launch.key];
    if (result === 'launchWrong') return !!launch?.verdict && !launch.correct;
    if (result === 'launchRight') return !!launch?.correct;
    if (result === 'allWrong') return runs.every(r => !r.correct);
    if (result === 'split') return runs.some(r => r.correct) && runs.some(r => !r.correct);
    return true;
}

// `search` must already be lowercased; "42" or "#42" finds case 42.
export function matches(q, {wordings, label, branch, need, search} = {}) {
    const caseNo = search && /^#?\d+$/.test(search) ? Number(search.replace('#', '')) : null;
    if (caseNo) return q.case === caseNo;
    return (!wordings || wordings.has(q.wording))
        && (!label || q.label === label)
        && (!branch || q.branch === branch)
        && (!need || q.need === need)
        && (!search || q.lc.includes(search));
}

export function countBy(questions, key) {
    const c = {};
    for (const q of questions) c[q[key]] = (c[q[key]] || 0) + 1;
    return c;
}

// Share of judged data questions each model got right.
export function armShares(questions, arms) {
    return arms.map(a => {
        let right = 0, tested = 0;
        for (const q of questions) {
            const r = q.runs?.[a.key];
            if (q.kind === 'data' && r?.verdict) {
                tested += 1;
                if (r.correct) right += 1;
            }
        }
        return {...a, right, tested, share: tested ? right / tested : null};
    });
}

export const SORTS = {ease: 'Easiest types first', hard: 'Hardest types first', map: 'Map order'};

// Questions grouped by type (need): easiest types first by default, and easiest questions first within a type.
export function sortQuestions(questions, key, data) {
    const needKey = {
        ease: q => data.ease[q.need],
        hard: q => -data.ease[q.need],
        map: q => data.mapOrder[q.need] ?? 1e6,
    }[key] || (q => data.ease[q.need]);
    return [...questions].sort((a, b) => needKey(a) - needKey(b) || (a.need < b.need ? -1 : a.need > b.need ? 1 : 0)
        || (a.rung || 9) - (b.rung || 9));
}

// The one query that answers it: #1492's checked gold; else the launch agent's query when the judge called it right
// (real ids, ran live); else #1555's grader's draft (placeholder ids, parsed only).
export function referenceOql(q, launchKey) {
    if (q.gold?.oql) return {oql: q.gold.oql, sort: q.gold.sort, tag: null, by: q.gold.by};
    const launch = q.runs?.[launchKey];
    if (launch?.correct && launch.oql) return {oql: launch.oql, sort: launch.sort, tag: 'agent', by: "the launch agent's answer, judged right"};
    if (q.grade?.oql) return {oql: q.grade.oql, tag: 'draft', by: "#1555's grader: a draft with placeholder ids, parsed but not run"};
    return null;
}

export function mark(run) {
    if (!run?.verdict) return {key: 'none', icon: '–'};
    if (run.correct) return {key: 'good', icon: '✓'};
    return run.verdict === 'partly' ? {key: 'partly', icon: '◐'} : {key: 'bad', icon: '✕'};
}

// Jason's calls on the judge, kept in this browser until he copies them into a session.
export function loadFeedback() {
    try {
        return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

export function saveFeedback(fb) {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
}

export function feedbackKey(q, arm) {
    return `${q.id}|${arm}`;
}

export function feedbackText(fb, data) {
    const byId = Object.fromEntries(data.questions.map(q => [q.id, q]));
    const lines = ['Question map feedback (oxjob #1618):', ''];
    for (const [k, v] of Object.entries(fb)) {
        if (!v.call && !v.note) continue;
        const [id, arm] = k.split('|');
        const q = byId[id];
        const run = q?.runs?.[arm] || {};
        lines.push(`- #${q?.case} (${id}) · ${arm}: judge said "${run.verdict || 'none'}"; Jason ${v.call || 'noted'}.`
            + `${v.note ? ` Note: ${v.note}` : ''}\n  Q: ${(q?.text || '').slice(0, 200)}`);
    }
    return lines.join('\n');
}

export function pct(x) {
    return x == null ? '–' : `${Math.round(x * 100)}%`;
}

export function num(x) {
    return x ? x.toLocaleString('en-US') : '–';
}

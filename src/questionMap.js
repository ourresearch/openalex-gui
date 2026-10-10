// The question map (oxjob #1618): every question OQL and the chat agent must answer, by the need behind it.
//
// Staff only. The data quotes real users (support tickets, forum posts), and this repo is public, so nothing here
// ships it: the page fetches it from oxjobs.org with the viewer's API key, which serves it to OpenAlex admins only.
// The vocabulary (rungs, source labels, wordings, model arms, gap names) comes with the data too.
// Pure logic, so it can be unit-tested.
import {markRaw} from 'vue';

const DATA_URL = 'https://oxjobs.org/admin-data/1618/map_data.json.gz';

// Ordinal blue ramp, light = easy (validated with the dataviz skill: monotone, visible steps, light end 2.06:1).
export const RUNG_COLORS = {1: '#86b6ef', 2: '#5598e7', 3: '#256abf', 4: '#184f95', 5: '#0d366b'};

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

// Lookups the views need, built once. The data never changes after load, so it is marked raw: Vue doesn't
// track its ~1,700 questions property by property.
export function index(data) {
    const nodeById = {};
    for (const b of data.branches) for (const n of b.nodes) nodeById[n.id] = n;
    const byNeed = {};
    for (const q of data.questions) {
        const need = data.needs[q.need];
        q.branch = need?.branch;
        q.inScope = need?.scope === 'in';
        q.lc = q.text.toLowerCase();
        (byNeed[q.need] ||= []).push(q);
    }
    return markRaw({
        ...data,
        nodeById,
        branchById: Object.fromEntries([...data.branches, ...data.appendices].map(b => [b.id, b])),
        byNeed,
        inScope: data.questions.filter(q => q.inScope),
        launch: data.arms.find(a => a.launch) || data.arms[data.arms.length - 1],
    });
}

// `search` must already be lowercased.
export function matches(q, {labels, wording, branch, search} = {}) {
    return (!labels || labels.has(q.label))
        && (!wording || q.wording === wording)
        && (!branch || q.branch === branch)
        && (!search || q.lc.includes(search));
}

export function countBy(questions, key) {
    const c = {};
    for (const q of questions) c[q[key]] = (c[q[key]] || 0) + 1;
    return c;
}

export function groupBy(questions, key) {
    const g = {};
    for (const q of questions) (g[q[key]] ||= []).push(q);
    return g;
}

// Numbers for any set of questions. One number per idea; the views pick which to show.
export function statsFor(questions, arms) {
    const s = {
        n: questions.length,
        byLabel: {},
        own: 0,
        rungs: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        arms: Object.fromEntries(arms.map(a => [a.key, {right: 0, tested: 0, share: null}])),
        gaps: {},
    };
    for (const q of questions) {
        s.byLabel[q.label] = (s.byLabel[q.label] || 0) + 1;
        if (q.wording === 'own') s.own += 1;
        if (q.rung) s.rungs[q.rung] += 1;
        if (q.kind === 'data') {
            for (const a of arms) {
                const run = q.runs?.[a.key];
                if (run?.verdict) {
                    s.arms[a.key].tested += 1;
                    if (run.correct) s.arms[a.key].right += 1;
                }
            }
        }
        if (q.rung >= 3) for (const g of q.grade?.gaps || []) s.gaps[g] = (s.gaps[g] || 0) + 1;
    }
    let rated = 0, sum = 0;
    for (const n of [1, 2, 3, 4, 5]) {
        rated += s.rungs[n];
        sum += n * s.rungs[n];
    }
    // median rung, read off the histogram
    let seen = 0;
    s.typicalRung = rated ? [1, 2, 3, 4, 5].find(n => (seen += s.rungs[n]) > Math.floor((rated - 1) / 2)) : null;
    s.meanRung = rated ? sum / rated : null;
    s.oneQuery = rated ? (s.rungs[1] + s.rungs[2]) / rated : null;
    s.real = s.byLabel.real || 0;
    for (const x of Object.values(s.arms)) x.share = x.tested ? x.right / x.tested : null;
    return s;
}

// One row per need with at least one of `questions` (already filtered), in the map's order.
export function needRows(data, questions) {
    const byNeed = groupBy(questions, 'need');
    const rows = [];
    for (const b of data.branches) {
        for (const node of b.nodes) {
            for (const id of node.needs) {
                if (byNeed[id]) rows.push({need: data.needs[id], node, branch: b, stats: statsFor(byNeed[id], data.arms)});
            }
        }
    }
    return rows;
}

// Distinct website users plus API keys a week on this need's logged query shapes.
export function askers(need) {
    const p = need?.prevalence || {};
    return (p.website_users || 0) + (p.api_keys || 0);
}

export const SORTS = {
    ease: 'easiest first', common: 'most logged', real: 'most real users', questions: 'most questions',
    launch: 'launch agent worst first', oneQuery: 'one query today',
};

export function sortRows(rows, key, launchKey) {
    const val = {
        ease: r => r.stats.meanRung ?? 9,
        common: r => -askers(r.need),
        real: r => -r.stats.real,
        questions: r => -r.stats.n,
        launch: r => r.stats.arms[launchKey].share ?? 2,
        oneQuery: r => -(r.stats.oneQuery ?? -1),
    }[key] || (r => r.stats.meanRung ?? 9);
    return [...rows].sort((a, b) => val(a) - val(b) || b.stats.n - a.stats.n);
}

// The question to show first as a success, and as a failure: real users' questions first.
const LABEL_ORDER = ['real', 'logged', 'staff', 'published', 'synthetic'];

export function pinned(questions, launchKey) {
    const ranked = [...questions].sort((a, b) => LABEL_ORDER.indexOf(a.label) - LABEL_ORDER.indexOf(b.label));
    const launch = q => q.runs?.[launchKey];
    return {
        success: ranked.find(q => launch(q)?.correct),
        failure: ranked.find(q => q.rung === 2) || ranked.find(q => launch(q)?.verdict && !launch(q).correct),
    };
}

// Source-label filter state, shared by both views: ?sources=real,logged, else every label.
export function labelsFromQuery(query, labels) {
    const keys = (query.sources || '').split(',').filter(k => labels.some(l => l.key === k));
    return new Set(keys.length ? keys : labels.map(l => l.key));
}

export function toggled(set, key) {
    const s = new Set(set);
    s.has(key) ? s.delete(key) : s.add(key);
    return s;
}

export function pct(x) {
    return x == null ? '–' : `${Math.round(x * 100)}%`;
}

export function num(x) {
    return x ? x.toLocaleString('en-US') : '–';
}

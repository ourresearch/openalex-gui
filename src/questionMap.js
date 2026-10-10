// The question map (oxjob #1618): every question OQL and the chat agent must answer, by the need behind it.
//
// Staff only. The data quotes real users (support tickets, forum posts), and this repo is public, so nothing here
// ships it: the page fetches it from oxjobs.org with the viewer's API key, which serves it to OpenAlex admins only.
// Pure logic (no Vue), so it can be unit-tested.

const DATA_URL = 'https://oxjobs.org/admin-data/1618/map_data.json.gz';

export const ARMS = [
    {key: 'haiku', name: 'Haiku'},
    {key: 'sonnet', name: 'Sonnet'},
    {key: 'opus', name: 'Opus'},
];
export const LAUNCH_ARM = 'opus';

// Ordinal blue ramp, light = easy (validated with the dataviz skill: monotone, visible steps, light end 2.06:1).
export const RUNG_COLORS = {1: '#86b6ef', 2: '#5598e7', 3: '#256abf', 4: '#184f95', 5: '#0d366b'};

// #1555's gap codes (map_fit.py), in words a reader can use.
export const GAP_NAMES = {
    THING_FIRST: 'Start from the people, institutions or journals',
    AUTHOR_POSITION: 'First, last or corresponding author',
    CAREER_HISTORY: "A person's career over time",
    MULTI_HOP: 'Chains: co-citation, cites-both, second hops',
    DERIVED_METRIC: 'A number across groups: share, growth, ratio',
    CITATION_SUBSET: 'Count only some citations',
    PAIRS_NETWORK: 'Pairs or a network as the answer',
    NEGATION_MANY: '"No author from X"',
    RELATIVE_TIME: '"The last five years", "new this week"',
    TEXT_TO_PEOPLE: 'Match people or journals to a text',
    LIMITS: "OQL's size limits",
    FIELD_MISSING: 'A field we hold but OQL lacks',
    NO_DATA: "Data OpenAlex doesn't hold",
    JUDGMENT: 'A judgment no query makes',
    OUTSIDE_OQL: 'Another surface: lookup, alerts, export',
    RANKING_QUALITY: 'Best-first ranking quality',
    OTHER: 'Other',
};

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

// Lookups the views need, built once.
export function index(data) {
    const nodes = {};
    for (const b of data.branches) {
        for (const n of b.nodes) nodes[n.id] = {...n, branch: b.id};
    }
    const branches = Object.fromEntries([...data.branches, ...data.appendices].map(b => [b.id, b]));
    const byNeed = {};
    for (const q of data.questions) (byNeed[q.need] ||= []).push(q);
    return {...data, nodeById: nodes, branchById: branches, byNeed};
}

export const WORDINGS = [
    {key: 'own', name: 'Their own words', story: "The source's own words: what a person typed or wrote."},
    {key: 'model', name: 'Model-written',
     story: 'A model wrote the question: for a logged query, or from evidence that was not a question (shown with it).'},
];

export function matches(q, {labels, wording, search} = {}) {
    if (labels && labels.size && !labels.has(q.label)) return false;
    if (wording && q.wording !== wording) return false;
    if (search) {
        const s = search.toLowerCase();
        if (!q.text.toLowerCase().includes(s)) return false;
    }
    return true;
}

// Numbers for any set of questions. One number per idea; the views pick which to show.
export function statsFor(questions) {
    const s = {
        n: questions.length,
        byLabel: {},
        rungs: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        own: 0,
        rated: 0,
        rungSum: 0,
        arms: Object.fromEntries(ARMS.map(a => [a.key, {right: 0, tested: 0}])),
        gaps: {},
    };
    const rungList = [];
    for (const q of questions) {
        s.byLabel[q.label] = (s.byLabel[q.label] || 0) + 1;
        if (q.wording === 'own') s.own += 1;
        if (q.rung) {
            s.rungs[q.rung] += 1;
            s.rated += 1;
            s.rungSum += q.rung;
            rungList.push(q.rung);
        }
        if (q.kind === 'data') {
            for (const a of ARMS) {
                const run = q.runs?.[a.key];
                if (run && run.verdict) {
                    s.arms[a.key].tested += 1;
                    if (run.correct) s.arms[a.key].right += 1;
                }
            }
        }
        if (q.rung && q.rung >= 3) {
            for (const g of q.grade?.gaps || []) s.gaps[g] = (s.gaps[g] || 0) + 1;
        }
    }
    rungList.sort((a, b) => a - b);
    s.meanRung = s.rated ? s.rungSum / s.rated : null;
    s.typicalRung = rungList.length ? rungList[Math.floor((rungList.length - 1) / 2)] : null;
    s.oneQuery = s.rated ? (s.rungs[1] + s.rungs[2]) / s.rated : null;
    s.real = s.byLabel.real || 0;
    for (const a of ARMS) {
        const x = s.arms[a.key];
        x.share = x.tested ? x.right / x.tested : null;
    }
    return s;
}

// One row per in-scope need with at least one question passing the filter.
export function needRows(data, filter = {}) {
    const rows = [];
    for (const b of data.branches) {
        if (filter.branch && filter.branch !== b.id) continue;
        for (const node of b.nodes) {
            for (const id of node.needs) {
                const qs = (data.byNeed[id] || []).filter(q => matches(q, filter));
                if (!qs.length) continue;
                rows.push({need: data.needs[id], node, branch: b, stats: statsFor(qs)});
            }
        }
    }
    return rows;
}

export function sortRows(rows, key) {
    const val = {
        ease: r => r.stats.meanRung ?? 9,
        common: r => -askers(r.need),
        real: r => -r.stats.real,
        questions: r => -r.stats.n,
        opus: r => r.stats.arms.opus.share ?? 2,
        oneQuery: r => -(r.stats.oneQuery ?? -1),
    }[key] || (r => r.stats.meanRung ?? 9);
    return [...rows].sort((a, b) => val(a) - val(b) || b.stats.n - a.stats.n);
}

// Distinct website users plus API keys a week on this need's logged query shapes.
export function askers(need) {
    const p = need?.prevalence || {};
    return (p.website_users || 0) + (p.api_keys || 0);
}

// The question to show first as a success, and as a failure: real users' questions first.
const LABEL_ORDER = ['real', 'logged', 'staff', 'published', 'synthetic'];

export function pinned(questions) {
    const ranked = [...questions].sort((a, b) => LABEL_ORDER.indexOf(a.label) - LABEL_ORDER.indexOf(b.label));
    const launch = q => q.runs?.[LAUNCH_ARM];
    const success = ranked.find(q => launch(q)?.correct);
    const failure = ranked.find(q => q.rung === 2) || ranked.find(q => launch(q)?.verdict && !launch(q).correct);
    return {success, failure};
}

export function pct(x) {
    return x == null ? '–' : `${Math.round(x * 100)}%`;
}

export function num(x) {
    return x ? x.toLocaleString('en-US') : '–';
}

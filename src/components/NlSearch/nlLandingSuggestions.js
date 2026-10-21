// Suggested queries under the homepage search box (oxjob #1744). The page shows three, picked
// once per page load, so each refresh offers new ideas. Most are questions from the jobs-to-be-done
// map (#1618) and the demo set already vetted live (work/demo_questions.md); a few are keyword
// searches and a few are systematic-review searches. Every entry was run live, twice, against
// POST /query/text on Wed 21 Oct 2026 and answered in under 12 s with a query and a non-zero count
// (oxjobs working/nl-search-page/work/landing_suggestions_check.jsonl). Keep the wording: it is
// what was tested.
//
// kind: 'question' (natural language), 'keyword' (a few words), 'review' (systematic-review style).
export const LANDING_SUGGESTIONS = [
  { text: 'How has research on large language models grown each year from 2018 to 2025?', kind: 'question' },
  { text: 'Quantum computing output broken down by country', kind: 'question' },
  { text: 'Which journals had the most retracted papers in 2023?', kind: 'question' },
  { text: 'Which countries lead perovskite solar cell research since 2015, with their mean FWCI?', kind: 'question' },
  { text: 'Which Sustainable Development Goals does the University of Cape Town publish on most since 2015?', kind: 'question' },
  { text: 'Papers about CRISPR with at least 1000 citations', kind: 'question' },
  { text: 'Who has published the most on marine microplastics since 2019, with their h-index?', kind: 'question' },
  { text: 'How do IIT Bombay, IIT Delhi and the Indian Institute of Science compare on output and mean FWCI since 2015?', kind: 'question' },
  { text: 'What share of Journal of Healthcare Engineering papers were retracted each year?', kind: 'question' },
  { text: 'What share of France\'s publications is open access each year from 2013 to 2025, by OA route?', kind: 'question' },
  { text: 'How many papers have the University of Oxford and the University of Cambridge co-authored each year?', kind: 'question' },
  { text: 'Which countries does Kenya co-author the most papers with?', kind: 'question' },
  { text: 'Which institutions co-author the most papers with ETH Zurich since 2020?', kind: 'question' },
  { text: 'Which institutions in Africa publish the most on malaria?', kind: 'question' },
  { text: 'Which German institutions publish the most papers mentioning the hippocampus?', kind: 'question' },
  { text: 'What share of the University of Leeds\' papers each year since 2019 are in the top 10% most cited?', kind: 'question' },
  { text: 'Which fields does UT Austin have the highest FWCI in?', kind: 'question' },
  { text: 'Which publishers put out the most papers about cryo-electron tomography?', kind: 'question' },
  { text: 'How has the number of papers on solid-state batteries changed each year from 2010 to 2025?', kind: 'question' },
  { text: 'Which countries publish the most research on AI companions?', kind: 'question' },
  { text: 'Which funders support the most research on Alzheimer\'s disease?', kind: 'question' },
  { text: 'What topics do France and Germany collaborate on with the highest FWCI?', kind: 'question' },
  { text: 'Who are the world experts on Macrocystis?', kind: 'question' },
  { text: 'Which countries cite Jennifer Doudna\'s papers the most?', kind: 'question' },
  { text: 'What is the open access uptake at Rutgers University?', kind: 'question' },
  { text: 'How is research on AI in healthcare since 2022 distributed across continents?', kind: 'question' },
  { text: 'What are the most relevant papers on microplastic contamination in freshwater fish?', kind: 'question' },
  { text: 'Recent papers on malaria vaccines by authors at the University of Oxford', kind: 'question' },
  { text: 'How many papers about ChatGPT were published in each field?', kind: 'question' },
  { text: 'microplastics', kind: 'keyword' },
  { text: 'kelp forests', kind: 'keyword' },
  { text: 'CRISPR base editing', kind: 'keyword' },
  { text: 'quantum error correction', kind: 'keyword' },
  { text: 'urban heat islands', kind: 'keyword' },
  { text: 'gut microbiome and depression', kind: 'keyword' },
  { text: 'long COVID', kind: 'keyword' },
  { text: 'Randomized controlled trials of mindfulness for anxiety in adults since 2015', kind: 'review' },
  { text: 'Systematic reviews of exercise interventions for depression', kind: 'review' },
  { text: 'Cohort studies on air pollution and dementia risk', kind: 'review' },
  { text: 'Meta-analyses of intermittent fasting and weight loss', kind: 'review' },
  { text: 'Systematic reviews on screen time and adolescent mental health', kind: 'review' },
  { text: 'Clinical trials of GLP-1 receptor agonists for weight loss since 2020', kind: 'review' },
  { text: 'Qualitative studies on burnout among nurses', kind: 'review' },
];

function draw(arr, rand) {
  const i = Math.min(arr.length - 1, Math.floor(rand() * arr.length));
  return arr[i];
}

function shuffle(arr, rand) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rand() * (i + 1)));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Chance that the third pick is a review search, so a few refreshes show one.
const REVIEW_SHARE = 0.4;

/**
 * Pick n distinct suggestions: at least one question and one keyword search (when the list has
 * them), the rest from any kind with review searches favoured, returned in random order.
 * Pass a seeded `rand` for a fixed result.
 */
export function pickSuggestions(list = LANDING_SUGGESTIONS, n = 3, rand = Math.random) {
  const picked = [];
  const left = () => list.filter((s) => !picked.includes(s));
  for (const kind of ['question', 'keyword']) {
    if (picked.length >= n) break;
    const pool = left().filter((s) => s.kind === kind);
    if (pool.length) picked.push(draw(pool, rand));
  }
  while (picked.length < n) {
    const rest = left();
    if (!rest.length) break;
    const reviews = rest.filter((s) => s.kind === 'review');
    const noReviewYet = !picked.some((s) => s.kind === 'review');
    const pool = noReviewYet && reviews.length && rand() < REVIEW_SHARE ? reviews : rest;
    picked.push(draw(pool, rand));
  }
  return shuffle(picked, rand);
}

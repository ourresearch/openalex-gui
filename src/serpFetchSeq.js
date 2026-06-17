// A monotonic run-sequencer for the SERP fetch watcher (oxjob #464 pillar A —
// Phase 1 drop-stale guard).
//
// The SERP fetch watcher (`src/views/Serp.vue`) is async and re-fires on every
// navigation, so several runs can be in flight at once (rapid clicks, the admin
// random-query dice, mid-edit navigations). If a SLOW run for an OLD query resolves
// AFTER a newer run, its late write clobbers the newer results — and, via the
// components that derive the URL from `resultsObject`, can `replaceState` the OLD
// query back over the URL. That is the #369 "random-query dice landed on the
// PREVIOUS query" race.
//
// Fix: each run claims a sequence number up front via `begin()`, which returns an
// `isStale()` predicate. After every `await`, the run calls `isStale()` and bails
// (writing nothing) if a newer run has since started. Only the latest run ever
// writes results / isLoading / the URL, so a superseded run can't clobber.
//
// Pure + framework-free so it unit-tests without mounting the component (this repo's
// test setup has no jsdom / @vue/test-utils). See serpFetchSeq.test.js.

export const createFetchSequencer = () => {
  let current = 0;
  // Start a run: bump the counter, capture this run's number, and return a
  // predicate that is true once any later run has begun.
  return function begin() {
    const seq = ++current;
    return () => seq !== current;
  };
};

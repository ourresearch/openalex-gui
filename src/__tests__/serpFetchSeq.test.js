// oxjob #464 pillar A — Phase 1 drop-stale guard.
//
// Unit-tests the run-sequencer that the SERP fetch watcher (src/views/Serp.vue)
// uses to drop a slow/superseded fetch's writes. The watcher itself can't be
// mounted here (this repo's vitest setup has no jsdom / @vue/test-utils), so the
// guard logic lives in a pure module and is exercised directly.

import { describe, it, expect } from "vitest";
import { createFetchSequencer } from "@/serpFetchSeq";

describe("createFetchSequencer", () => {
  it("a lone run is never stale", () => {
    const begin = createFetchSequencer();
    const isStale = begin();
    expect(isStale()).toBe(false);
    // Still latest no matter how many times we check.
    expect(isStale()).toBe(false);
  });

  it("starting a newer run makes the older run stale, the newer one fresh", () => {
    const begin = createFetchSequencer();
    const isStaleA = begin(); // run A
    const isStaleB = begin(); // run B supersedes A
    expect(isStaleA()).toBe(true); // A's late write would be dropped
    expect(isStaleB()).toBe(false); // B is the live run
  });

  it("each new run supersedes all prior runs", () => {
    const begin = createFetchSequencer();
    const a = begin();
    const b = begin();
    const c = begin();
    expect(a()).toBe(true);
    expect(b()).toBe(true);
    expect(c()).toBe(false);
  });

  it("models the dice race: a slow first fetch resolving after a fast second is dropped", async () => {
    const begin = createFetchSequencer();
    let committed = null;
    const commit = (isStale, value) => {
      // mirrors the watcher: after `await`, only write if still the latest run
      if (isStale()) return;
      committed = value;
    };

    // Run A (the previous query) — slow.
    const isStaleA = begin();
    const slow = new Promise((r) => setTimeout(() => r("PREVIOUS"), 20));
    // Run B (the new query) — fast, begins while A is still awaiting.
    const isStaleB = begin();
    const fast = Promise.resolve("CURRENT");

    // B resolves first and commits; then A resolves late and must NOT clobber.
    commit(isStaleB, await fast);
    expect(committed).toBe("CURRENT");
    commit(isStaleA, await slow);
    expect(committed).toBe("CURRENT"); // stale A dropped — the bug is gone
  });

  it("two sequencers are independent (per-component instance)", () => {
    const beginX = createFetchSequencer();
    const beginY = createFetchSequencer();
    const x1 = beginX();
    beginY(); // advancing Y must not affect X
    expect(x1()).toBe(false);
  });
});

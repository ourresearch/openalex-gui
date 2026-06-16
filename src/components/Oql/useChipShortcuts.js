// useChipShortcuts — the shared interaction shell for OQL value chips (oxjob #467).
// Every chip (text / entity / boolean / date / connector) shares one gesture set:
// single-click opens a context menu; an optional double-click action; Enter runs the
// chip's primary "edit" action; Cmd/Ctrl+Enter runs "new" (add a sibling to the right);
// Backspace/Delete = delete.
//
// KEY MAP (revised 2026-06-16, Jason): Enter = EDIT the selected chip (was: New);
// Cmd/Ctrl+Enter = NEW chip to the right (was: Enter). The ⌥-click "negate" gesture was
// REMOVED — negation is uncommon enough that it lives in the menu only, no shortcut.
//
// This composable owns ONLY the local UI mode (`menuOpen`) + that gesture logic. It is
// query-state-free: it takes plain callbacks the chip wires to its own emits and never
// imports v2/v2Edit/drafts. Pass a getter for the token id (`() => tok.id`) so the menu
// state resets when the token at this position is replaced (the parent v-for is index-
// keyed, so a server reorder can swap the token under a fixed slot).
//
// Disambiguation: if the chip has a double-click action, a lone click opens the menu
// only after a short timer; a second click within the window cancels it and runs the
// double action instead. Chips with no double action open the menu immediately.
//
// The returned `onKeydown` is meant to be bound to BOTH the display chip span (when it
// holds focus) and the teleported menu card (Vuetify moves focus into the open menu
// overlay, which is teleported out of the chip's subtree so its keydown can't bubble
// back). stopPropagation keeps the keys off the builder-level @keydown handler.
//
// DRAG-TO-DELETE (oxjob #467 Phase 4): the chip is `draggable`; dragging it OUTSIDE the
// builder card and releasing DELETES it (reuses the same `onDelete` intent as ⌫).
// Releasing INSIDE the builder is a deliberate no-op — cross-clause MOVES / reordering
// are OUT of scope here (their own follow-on job: drop zones + v2Edit moves).
//
// We decide inside-vs-outside by comparing the `dragend` pointer position against the
// `.builder` card's bounding rect (recomputed at release, so page-scroll during the drag
// is handled). This is independent of native drop-target plumbing — relying on a `drop`
// event proved unreliable (a real release outside any registered target fires NO drop, so
// the chip just snaps back and nothing deletes). Reading the dragend coordinates is the
// robust, standard technique. No DOM mutation, no parent / OqlQueryBuilder edits.
import { ref, watch, onBeforeUnmount } from "vue";
import { useChipDrag } from "@/components/Oql/useChipDrag";

export function useChipShortcuts({ idRef, onDouble, onEnter, onCmdEnter, onDelete }) {
  const menuOpen = ref(false);
  const dragging = ref(false);    // LOCAL to this chip — drives the dim while THIS chip drags
  const chipDrag = useChipDrag(); // SHARED singleton — lets the builder reveal its delete zone
  const hasDouble = typeof onDouble === "function";
  let clickTimer = null;
  const clearTimer = () => { if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; } };

  // --- drag-to-delete -------------------------------------------------------
  // Two delete paths, both ending in onDelete (the SAME `remove` intent as ⌫):
  //   1. Drop on the builder's delete zone — handled by the builder, which reads
  //      chipDrag.draggingId on the zone's `drop`. Reliable (a real registered target).
  //   2. Release ANYWHERE OUTSIDE the `.builder` card — handled here on dragend by
  //      comparing the release point to the builder rect (forgiving fallback).
  // Releasing inside the builder but not on the zone is a deliberate no-op.
  let builderEl = null;

  const onDragstart = (e) => {
    clearTimer();            // a drag must not leave a pending single-click menu-open
    menuOpen.value = false;
    dragging.value = true;
    chipDrag.begin(idRef?.());   // reveal the builder's delete zone for the drag's duration
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      // Firefox refuses to start a drag unless some data is set.
      try { e.dataTransfer.setData("text/plain", "oql-chip"); } catch (_) { /* noop */ }
    }
    builderEl = e.currentTarget?.closest?.(".builder") || null;
  };

  const onDragend = (e) => {
    dragging.value = false;
    const el = builderEl;
    builderEl = null;
    // If the delete zone already consumed this drop it clears draggingId first, so the
    // outside-rect fallback below is skipped (no double-remove). The zone sits inside the
    // builder rect anyway, so geometry alone would also make this a no-op — belt & braces.
    const consumed = chipDrag.draggingId.value == null;
    chipDrag.end();              // hide the delete zone
    if (consumed || !el) return;
    const x = e?.clientX ?? 0, y = e?.clientY ?? 0;
    // Some browsers report (0,0) when the release point is unknown — treat as inside
    // (no-op) rather than risk an accidental delete.
    if (x === 0 && y === 0) return;
    const r = el.getBoundingClientRect();
    const outside = x < r.left || x > r.right || y < r.top || y > r.bottom;
    if (outside) onDelete?.();
  };

  const onClick = (e) => {
    if (hasDouble) {
      if (clickTimer) return; // the 2nd click of a double-click — let onDblclick handle it
      clickTimer = setTimeout(() => { clickTimer = null; menuOpen.value = true; }, 220);
    } else {
      menuOpen.value = true;
    }
  };

  const onDblclick = () => {
    clearTimer();
    menuOpen.value = false;
    if (hasDouble) onDouble();
  };

  const onKeydown = (e) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault(); e.stopPropagation();
      menuOpen.value = false;
      onDelete?.();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl+Enter = NEW chip to the right.
      if (typeof onCmdEnter !== "function") return;
      e.preventDefault(); e.stopPropagation();
      menuOpen.value = false;
      onCmdEnter();
    } else if (e.key === "Enter") {
      // plain Enter = EDIT the selected chip (the chip's primary action).
      if (typeof onEnter !== "function") return;
      e.preventDefault(); e.stopPropagation();
      menuOpen.value = false;
      onEnter();
    }
  };

  watch(idRef, () => { menuOpen.value = false; clearTimer(); });
  onBeforeUnmount(() => { clearTimer(); builderEl = null; });

  return { menuOpen, dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend };
}

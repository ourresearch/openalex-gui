// useChipShortcuts — the shared interaction shell for OQL chips (oxjob #467; rebuilt
// for the toolbar-actions model, oxjob #428 2026-06-17).
//
// A chip's actions live in its single-click dropdown menu. The gesture set is (double-click
// was removed — Jason 2026-06-22):
//   • single-click  → SELECT this chip + open its dropdown menu.
//   • Enter → the chip's primary EDIT action (`onEdit`) — text focuses its in-place input;
//     a chooser/calendar chip asks the builder to open its editor.
//   • Cmd/Ctrl+Enter → NEW sibling value to the right (`onCmdEnter`).
//   • Backspace/Delete → delete (`onDelete`).
//   • Cmd/Ctrl/Shift-click → multi-select (#472) — build a set for the batch menu.
//
// This composable owns NO query state and no menu state anymore — just the gesture
// routing + drag-to-delete. Pass a getter for the token id so callbacks always read the
// live token at this slot (the parent v-for is index-keyed; a server reorder can swap the
// token under a fixed slot).
//
// The returned `onKeydown` binds to the chip span (which holds focus after a click).
// stopPropagation keeps the keys off the builder-level @keydown handler.
//
// DRAG-TO-DELETE (oxjob #467 Phase 4): the chip is `draggable`; dragging it OUTSIDE the
// builder card and releasing DELETES it (same `onDelete` intent as ⌫). Releasing INSIDE
// is a deliberate no-op. We compare the `dragend` pointer position to the `.builder`
// card's rect (recomputed at release, so page-scroll mid-drag is handled).
import { ref, onBeforeUnmount } from "vue";
import { useChipDrag } from "@/components/Oql/useChipDrag";

// MULTI-SELECT (oxjob #472): a chip can be SELECTED into an ephemeral set for a batch action
// ("Wrap as subclause" / "Delete"). You build it by Cmd/Ctrl-clicking a SECOND chip after
// touching a first: a plain click records the chip as the single selection / anchor, and a
// later Cmd/Ctrl-click folds it in too. The set lives in the builder; this shell only routes
// the GESTURES via optional callbacks:
//   onSelect({ id, mode, el }) — a click that touches the selection. mode "single" (plain
//                             click → highlight this one chip + show its toolbar actions),
//                             "toggle" (Cmd/Ctrl) or "range" (Shift). `el` anchors the menu.
//   onSelectClear()         — a PLAIN click on a non-selected chip while a MULTI selection is
//                             live: clear it, then fall through to single-select this chip.
//   selectedRef()/selectionActiveRef() — getters: is THIS chip in the multi-set / is a multi
//                             selection live.
export function useChipShortcuts({ idRef, onEdit, onCmdEnter, onDelete,
  selectedRef, selectionActiveRef, onSelect, onSelectClear }) {
  const dragging = ref(false);    // LOCAL to this chip — drives the dim while THIS chip drags
  const chipDrag = useChipDrag(); // SHARED singleton — lets the builder reveal its delete zone

  // --- drag-to-delete -------------------------------------------------------
  let builderEl = null;

  const onDragstart = (e) => {
    dragging.value = true;
    chipDrag.begin(idRef?.());   // reveal the builder's delete zone for the drag's duration
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", "oql-chip"); } catch (_) { /* noop */ }
    }
    builderEl = e.currentTarget?.closest?.(".builder") || null;
  };

  const onDragend = (e) => {
    dragging.value = false;
    const el = builderEl;
    builderEl = null;
    const consumed = chipDrag.draggingId.value == null;
    chipDrag.end();              // hide the delete zone
    if (consumed || !el) return;
    const x = e?.clientX ?? 0, y = e?.clientY ?? 0;
    if (x === 0 && y === 0) return;
    const r = el.getBoundingClientRect();
    const outside = x < r.left || x > r.right || y < r.top || y > r.bottom;
    if (outside) onDelete?.();
  };

  const onClick = (e) => {
    // A value-chip click SELECTS the value — it must NOT bubble to the `.bline` band handler
    // (which would override it with a row selection). Structural chips are inert and don't use
    // this composable anymore, so stopping here is always correct. (oxjob #475.)
    e.stopPropagation();
    // MULTI-SELECT gestures (#472) take precedence:
    if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      onSelect({ id: idRef?.(), mode: e.shiftKey ? "range" : "toggle", el: e.currentTarget });
      return;
    }
    if (selectionActiveRef?.()) {
      // A plain click while a MULTI selection is live (oxjob #475, Jason 2026-06-17):
      //   • on one of the SELECTED chips → collapse the set down to just THIS chip
      //     ("they all become unselected except the one you just clicked on");
      //   • on a NON-selected chip → drop the set, then single-select this chip.
      // Both fall through to the single-select below (which replaces any multi set).
      if (!selectedRef?.()) onSelectClear?.();
    }
    // SINGLE-SELECT: highlight this chip; the builder shows its actions in the toolbar.
    onSelect?.({ id: idRef?.(), mode: "single", el: e.currentTarget });
  };

  // DOUBLE-CLICK → EDIT (Jason 2026-06-24, #507 — brought back). Routes to the same `onEdit` as
  // the Enter key: a text chip edits in place, an entity re-picks, a date opens its calendar. The
  // two single-clicks that precede a dblclick are harmless (they select then toggle-off; edit mode
  // is independent of selection). stopPropagation keeps it off the row band's @dblclick.
  const onDblclick = (e) => {
    e?.stopPropagation?.();
    if (typeof onEdit === "function") onEdit();
  };

  const onKeydown = (e) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      // When a MULTI-selection is live, the just-clicked chip still holds DOM focus, so its
      // own ⌫ would delete ONLY itself and stopPropagation would starve the builder's
      // window-level handler that deletes the whole set. Let it bubble instead (oxjob #507
      // bug: multi-select + Backspace deleted just one). The window handler preventDefaults.
      if (selectionActiveRef?.()) return;
      e.preventDefault(); e.stopPropagation();
      onDelete?.();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (typeof onCmdEnter !== "function") return;
      e.preventDefault(); e.stopPropagation();
      onCmdEnter();
    } else if (e.key === "Enter") {
      if (typeof onEdit !== "function") return;
      e.preventDefault(); e.stopPropagation();
      onEdit();
    }
  };

  onBeforeUnmount(() => { builderEl = null; });

  return { dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend };
}

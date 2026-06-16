// useChipShortcuts — the shared interaction shell for OQL value chips (oxjob #467
// round 2). Every value chip (text / entity / boolean) converged on the same gesture
// set: single-click opens a context menu; an optional double-click action; an optional
// ⌥-click action (negate); Enter = "New" (add a sibling); Backspace/Delete = delete.
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
// builder and releasing DELETES it (reuses the same `onDelete` intent as ⌫). On
// dragstart we imperatively turn the chip's `.builder` ancestor into a drop zone (the
// only DOM mutation, fully torn down on dragend) so the native cursor reads "move" while
// over the builder and "no-drop" outside it, and so the `drop` event tells us where it
// landed. Dropping INSIDE the builder is a deliberate no-op — cross-clause MOVES /
// reordering are OUT of scope here (their own follow-on job: real drop zones + v2Edit
// moves). This keeps the gesture entirely chip-side: no parent / OqlQueryBuilder edits.
import { ref, watch, onBeforeUnmount } from "vue";

export function useChipShortcuts({ idRef, onDouble, onAltClick, onEnter, onDelete }) {
  const menuOpen = ref(false);
  const dragging = ref(false);
  const hasDouble = typeof onDouble === "function";
  let clickTimer = null;
  const clearTimer = () => { if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; } };

  // --- drag-to-delete -------------------------------------------------------
  // The `.builder` ancestor is registered as a drop target only for the duration of a
  // drag, then unregistered. While registered, dragover.preventDefault() marks it valid
  // (cursor = move); a drop on it sets `droppedInside` so dragend knows not to delete.
  let builderEl = null;
  let droppedInside = false;
  const onBuilderDragover = (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "move"; };
  const onBuilderDrop = (e) => { e.preventDefault(); droppedInside = true; };
  const teardownDrag = () => {
    if (builderEl) {
      builderEl.removeEventListener("dragover", onBuilderDragover);
      builderEl.removeEventListener("drop", onBuilderDrop);
      builderEl = null;
    }
  };

  const onDragstart = (e) => {
    clearTimer();            // a drag must not leave a pending single-click menu-open
    menuOpen.value = false;
    droppedInside = false;
    dragging.value = true;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      // Firefox refuses to start a drag unless some data is set.
      try { e.dataTransfer.setData("text/plain", "oql-chip"); } catch (_) { /* noop */ }
    }
    builderEl = e.currentTarget?.closest?.(".builder") || null;
    if (builderEl) {
      builderEl.addEventListener("dragover", onBuilderDragover);
      builderEl.addEventListener("drop", onBuilderDrop);
    }
  };

  const onDragend = () => {
    dragging.value = false;
    const inside = droppedInside;
    teardownDrag();
    // Released outside the builder (no in-builder drop fired) → delete. Inside = no-op.
    if (!inside) onDelete?.();
  };

  const onClick = (e) => {
    // ⌥-click = the alt action (negate), if this chip has one — skip the menu entirely.
    if (e?.altKey && onAltClick) { e.preventDefault(); onAltClick(); return; }
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
    } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && typeof onEnter === "function") {
      e.preventDefault(); e.stopPropagation();
      menuOpen.value = false;
      onEnter();
    }
  };

  watch(idRef, () => { menuOpen.value = false; clearTimer(); });
  onBeforeUnmount(() => { clearTimer(); teardownDrag(); });

  return { menuOpen, dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend };
}

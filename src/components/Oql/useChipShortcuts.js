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
import { ref, watch, onBeforeUnmount } from "vue";

export function useChipShortcuts({ idRef, onDouble, onAltClick, onEnter, onDelete }) {
  const menuOpen = ref(false);
  const hasDouble = typeof onDouble === "function";
  let clickTimer = null;
  const clearTimer = () => { if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; } };

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
  onBeforeUnmount(clearTimer);

  return { menuOpen, onClick, onDblclick, onKeydown };
}

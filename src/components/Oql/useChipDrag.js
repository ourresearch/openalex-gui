// useChipDrag — a module-level singleton shared between the value chips (which START and
// END a drag, via useChipShortcuts) and OqlQueryBuilder (which shows the delete drop-zone
// while a drag is in flight). oxjob #467 Phase 4 feedback.
//
// Why a shared singleton instead of props/emits: the chips sit several layers below the
// builder (OqlBrick → OqlValueChip → OqlTextChip/…), so threading a "drag active" boolean
// up and back down would mean prop drilling through components #428 owns. A tiny reactive
// singleton lets the builder render the zone reactively without touching the chip dispatch
// chain. It carries NO query state — just the transient UI fact "a value chip is being
// dragged, and here's its token id" so the zone's drop handler knows what to remove.
import { ref } from "vue";

const dragging = ref(false);     // true while ANY value chip is mid-drag
const draggingId = ref(null);    // the dragged chip's token id (for the zone's drop)

export function useChipDrag() {
  return {
    dragging,
    draggingId,
    begin(id) { dragging.value = true; draggingId.value = id ?? null; },
    end() { dragging.value = false; draggingId.value = null; },
  };
}

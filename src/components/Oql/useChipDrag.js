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

const dragging = ref(false);     // true while ANY value chip OR logical row is mid-drag
const draggingId = ref(null);    // the dragged node's id (for the zone's drop)
// What's being dragged: a value chip ('value') or a whole logical ROW ('row', oxjob #475).
// The trash drop-zone is shared by both; the row drop-indicators are row-only, and the
// zone's drop handler routes by kind (a value id → chip delete, a row id → removeNode).
const draggingKind = ref(null);

export function useChipDrag() {
  return {
    dragging,
    draggingId,
    draggingKind,
    begin(id, kind = "value") { dragging.value = true; draggingId.value = id ?? null; draggingKind.value = kind; },
    end() { dragging.value = false; draggingId.value = null; draggingKind.value = null; },
  };
}

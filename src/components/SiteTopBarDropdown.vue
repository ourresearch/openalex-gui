<template>
  <div
    ref="wrapEl"
    class="mega-dropdown"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusout="onFocusOut"
  >
    <button
      ref="triggerEl"
      type="button"
      class="mega-trigger"
      :class="{ 'is-open': open }"
      aria-haspopup="true"
      :aria-expanded="open ? 'true' : 'false'"
      @click="emit(open ? 'close' : 'open')"
    >
      <span>{{ label }}</span>
      <v-icon class="mega-caret" :class="{ 'is-flipped': open }">mdi-chevron-down</v-icon>
    </button>

    <transition name="mega">
      <!-- The wrap's padding-top is the visual gap below the bar; keeping it
           inside the hoverable element means the diagonal mouse path from
           trigger to panel never leaves the dropdown (no accidental close). -->
      <div v-if="open" class="mega-panel-wrap" @click="onPanelClick">
        <div class="mega-panel"><slot /></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';

defineOptions({ name: 'SiteTopBarDropdown' });

const props = defineProps({
  label: { type: String, required: true },
  // Open state lives in the parent so only one panel is ever open and moving
  // between triggers switches panels instantly.
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['open', 'close']);

const wrapEl = ref(null);
const triggerEl = ref(null);

// Hover intent: a short delay before opening (skimming the bar shouldn't pop
// panels) and a longer grace before closing (leaving briefly shouldn't lose
// the panel). Comps run roughly 50/200ms.
let openTimer = null;
let closeTimer = null;

function onEnter() {
  clearTimeout(closeTimer);
  if (!props.open) {
    openTimer = setTimeout(() => emit('open'), 60);
  }
}
function onLeave() {
  clearTimeout(openTimer);
  closeTimer = setTimeout(() => emit('close'), 220);
}
function onEsc() {
  emit('close');
  triggerEl.value?.focus();
}
function onFocusOut(e) {
  // Close when keyboard focus tabs out of the trigger+panel entirely.
  if (wrapEl.value && !wrapEl.value.contains(e.relatedTarget)) emit('close');
}
// A click on any link inside the panel closes it — covers same-route
// router-links (no route change to watch) and external _blank links.
function onPanelClick(e) {
  if (e.target.closest('a')) emit('close');
}

function onDocMousedown(e) {
  if (wrapEl.value && !wrapEl.value.contains(e.target)) emit('close');
}
// Esc must work no matter where focus is (hover-open leaves focus on <body>,
// so the wrap's own keydown never fires) — listen at the document while open.
function onDocKeydown(e) {
  if (e.key === 'Escape') onEsc();
}
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', onDocMousedown);
    document.addEventListener('keydown', onDocKeydown);
  } else {
    document.removeEventListener('mousedown', onDocMousedown);
    document.removeEventListener('keydown', onDocKeydown);
  }
});
onBeforeUnmount(() => {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  document.removeEventListener('mousedown', onDocMousedown);
  document.removeEventListener('keydown', onDocKeydown);
});
</script>

<style scoped lang="scss">
.mega-dropdown {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.mega-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 6px 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover,
  &.is-open {
    background-color: var(--ox-bg-muted);
    color: #1a1a1a;
  }
}

/* App.vue forces every .v-icon to 18px !important; win with higher
   specificity (see AGENTS.md "global CSS overrides"). */
.mega-trigger .mega-caret {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  color: var(--ox-text-muted);
  transition: transform var(--ox-duration-base) var(--ox-ease-default);

  &.is-flipped {
    transform: rotate(180deg);
  }
}

.mega-panel-wrap {
  position: absolute;
  top: 100%;
  left: -12px;
  /* Small gap: panel hangs just under the bar, close to its trigger. The
     padding is still the hoverable bridge so the pointer never leaves the
     dropdown crossing into the panel (Jason 2026-08-16: keep it tight). */
  padding-top: 4px;
}

.mega-panel {
  background: var(--ox-bg-base);
  border: 1px solid var(--ox-border-default);
  border-radius: var(--ox-radius-lg);
  box-shadow: var(--ox-elev-overlay);
  padding: var(--ox-space-2);
}

/* Quick fade + small rise on open; faster plain fade on close. Durations are
   tokens, so prefers-reduced-motion collapses them to instant. */
.mega-enter-active {
  transition: opacity var(--ox-duration-base) var(--ox-ease-out),
    transform var(--ox-duration-base) var(--ox-ease-out);
}
.mega-leave-active {
  transition: opacity var(--ox-duration-fast) var(--ox-ease-in);
}
.mega-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.mega-leave-to {
  opacity: 0;
}
</style>

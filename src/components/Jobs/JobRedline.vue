<template>
  <teleport to="body">
    <!-- Control pill -->
    <div v-if="results.length" class="redline-pill" data-redline="pill">
      <span class="redline-pill-count">Redline · {{ results.length }}</span>
      <span v-if="unanchored.length" class="redline-pill-warn" :title="'Unanchored: ' + unanchored.map(r => r.entry.id).join(', ')">
        ⚠ {{ unanchored.length }}
      </span>
      <button class="redline-pill-btn" @click="toggleHidden">{{ hidden ? 'Show' : 'Hide' }}</button>
    </div>

    <!-- Comment card -->
    <div
      v-if="active"
      ref="cardEl"
      class="redline-card"
      data-redline="card"
      :style="{ top: cardPos.top + 'px', left: cardPos.left + 'px' }"
    >
      <div class="redline-card-head">
        <span class="redline-card-id">{{ active.entry.id }}</span>
        <span class="redline-card-status" :class="'is-' + (active.entry.status || 'open')">{{ active.entry.status || 'open' }}</span>
        <span class="redline-card-meta">{{ active.entry.author }} · {{ active.entry.date }}</span>
        <button class="redline-card-close" @click="active = null">×</button>
      </div>
      <div v-if="active.entry.before && active.entry.after" class="redline-card-diff">
        <span class="redline-card-del">{{ active.entry.before }}</span>
        <span class="redline-card-ins">{{ active.entry.after }}</span>
      </div>
      <div v-else-if="active.entry.after" class="redline-card-diff">
        <span class="redline-card-ins">{{ active.entry.after }}</span>
      </div>
      <div v-else-if="active.entry.before" class="redline-card-diff">
        <span class="redline-card-del">{{ active.entry.before }}</span>
      </div>
      <p v-if="active.entry.comment" class="redline-card-comment">{{ active.entry.comment }}</p>
      <div v-for="(reply, i) in active.entry.replies || []" :key="i" class="redline-card-reply">
        <span class="redline-card-meta">{{ reply.author }} · {{ reply.date }}</span>
        <p>{{ reply.text }}</p>
      </div>
      <p class="redline-card-hint">
        Reply via Claude Code — e.g. “accept {{ active.entry.id }}” or “reject {{ active.entry.id }} because …”
      </p>
    </div>
  </teleport>
</template>

<script setup>
// On-page redline overlay for the job listing pages (oxjob #812).
//
// Reads jobs-redline.yaml (bundled at build time) and, after the page mounts,
// paints each entry over the live copy: insertions green, deletions
// struck-through red, comments highlighted, each with a numbered badge that
// opens a comment card. The page's real DOM is the source of truth — an entry
// whose text can't be found on the page is surfaced as "unanchored" in the
// control pill instead of being silently dropped or rendered as fiction.
//
// Matching is whitespace-normalized (template line wraps don't matter) and
// works across inline tags (<strong>, <a>) because it walks text nodes.
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { parse } from 'yaml';
import redlineSource from './jobs-redline.yaml';

const props = defineProps({
  page: { type: String, required: true }, // community-lead | operations-associate
});

const results = ref([]);   // [{ entry, mode, anchored, badgeEl }]
const unanchored = ref([]);
const active = ref(null);
const cardEl = ref(null);
const cardPos = ref({ top: 0, left: 0 });
const hidden = ref(false);

// ---- text search over rendered DOM ----------------------------------------

function collectHaystack(rootEl) {
  // Concatenated whitespace-normalized text of rootEl, with a per-character
  // map back to (textNode, offset). Skips our own injected nodes.
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      return n.parentElement && n.parentElement.closest('[data-redline]')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  let norm = '';
  const map = [];
  let lastWasSpace = true;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue;
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) {
        if (!lastWasSpace) {
          norm += ' ';
          map.push({ node, offset: i });
          lastWasSpace = true;
        }
      } else {
        norm += text[i];
        map.push({ node, offset: i });
        lastWasSpace = false;
      }
    }
  }
  return { norm, map };
}

function findRange(rootEl, needle) {
  const needleNorm = needle.replace(/\s+/g, ' ').trim();
  if (!needleNorm) return null;
  const { norm, map } = collectHaystack(rootEl);
  const idx = norm.indexOf(needleNorm);
  if (idx === -1) return null;
  const start = map[idx];
  const end = map[idx + needleNorm.length - 1];
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset + 1);
  return range;
}

function wrapRange(range, className, entryId) {
  // Wrap every text-node slice inside the range (safe across inline tags).
  const rootNode = range.commonAncestorContainer;
  const scope = rootNode.nodeType === Node.TEXT_NODE ? rootNode.parentNode : rootNode;
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  const targets = [];
  while (walker.nextNode()) {
    if (range.intersectsNode(walker.currentNode)) targets.push(walker.currentNode);
  }
  const spans = [];
  for (const n of targets) {
    const r = document.createRange();
    r.selectNodeContents(n);
    if (n === range.startContainer) r.setStart(n, range.startOffset);
    if (n === range.endContainer) r.setEnd(n, range.endOffset);
    if (r.collapsed) continue;
    const span = document.createElement('span');
    span.className = className;
    span.dataset.redline = entryId;
    r.surroundContents(span);
    spans.push(span);
  }
  return spans;
}

function makeDelSpan(text, entryId) {
  const del = document.createElement('span');
  del.className = 'redline-del';
  del.dataset.redline = entryId;
  del.textContent = text.replace(/\s+/g, ' ').trim();
  return del;
}

function makeBadge(n, entryId) {
  const badge = document.createElement('sup');
  badge.className = 'redline-badge';
  badge.dataset.redline = entryId;
  badge.textContent = n;
  return badge;
}

// ---- applying entries ------------------------------------------------------

function applyEntry(entry, n) {
  const rootEl =
    (entry.section && document.getElementById(entry.section)) || document.body;
  let spans = [];
  let mode = null;

  if (entry.before && entry.after) {
    let range = findRange(rootEl, entry.after);
    if (range) {
      mode = 'change';
      spans = wrapRange(range, 'redline-ins', entry.id);
      if (spans.length) spans[0].before(makeDelSpan(entry.before, entry.id));
    } else {
      // Page may show the original (e.g. rejected + reverted): anchor there.
      range = findRange(rootEl, entry.before);
      if (range) {
        mode = 'proposed';
        spans = wrapRange(range, 'redline-proposed', entry.id);
      }
    }
  } else if (entry.after) {
    const range = findRange(rootEl, entry.after);
    if (range) {
      mode = 'insertion';
      spans = wrapRange(range, 'redline-ins', entry.id);
    }
  } else if (entry.before) {
    // Pure deletion: the old text is gone; anchor on surrounding context —
    // `context` = text just before the deletion spot, `context_after` = text
    // just after it (for deletions at the start of a block).
    const after = !entry.context && entry.context_after;
    const range = findRange(rootEl, entry.context || entry.context_after || '');
    if (range) {
      mode = 'deletion';
      range.collapse(!!after);
      const del = makeDelSpan(entry.before, entry.id);
      range.insertNode(del);
      if (!after) {
        // Several deletions can share one context point; each insertNode lands
        // before the previous one, reversing document order. Push the new span
        // past any redline marks already sitting there (and the empty text nodes
        // Range.insertNode's split leaves behind) so YAML order = display order.
        let sib = del.nextSibling;
        while (
          sib &&
          ((sib.nodeType === Node.TEXT_NODE && !sib.textContent.trim()) ||
            (sib.dataset && sib.dataset.redline))
        ) {
          sib.after(del);
          sib = del.nextSibling;
        }
      }
      spans = [del];
    }
  } else if (entry.anchor) {
    const range = findRange(rootEl, entry.anchor);
    if (range) {
      mode = 'comment';
      spans = wrapRange(range, 'redline-comment', entry.id);
    }
  }

  const anchored = spans.length > 0;
  let badgeEl = null;
  if (anchored) {
    badgeEl = makeBadge(n, entry.id);
    spans[spans.length - 1].after(badgeEl);
    const open = (e) => {
      e.stopPropagation();
      openCard(entry, badgeEl, mode, anchored);
    };
    badgeEl.addEventListener('click', open);
    spans.forEach((s) => s.addEventListener('click', open));
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[redline] entry ${entry.id} could not be anchored on this page`, entry);
  }
  return { entry, mode, anchored, badgeEl };
}

function openCard(entry, badgeEl, mode, anchored) {
  const rect = badgeEl.getBoundingClientRect();
  const width = Math.min(380, window.innerWidth - 24);
  const left = Math.max(
    12,
    Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - width - 12)
  );
  cardPos.value = { top: rect.bottom + window.scrollY + 8, left };
  active.value = { entry, mode, anchored };
}

function toggleHidden() {
  hidden.value = !hidden.value;
  document.body.classList.toggle('redline-hidden', hidden.value);
  if (hidden.value) active.value = null;
}

function onDocClick(e) {
  if (!active.value) return;
  if (e.target.closest && e.target.closest('[data-redline]')) return;
  active.value = null;
}

onMounted(async () => {
  await nextTick();
  // Guard against double-application (dev HMR remounts).
  if (document.querySelector('[data-redline]:not([data-redline="pill"]):not([data-redline="card"])')) return;
  let entries = [];
  try {
    entries = (parse(redlineSource) || {}).entries || [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[redline] failed to parse jobs-redline.yaml', err);
    return;
  }
  const mine = entries.filter((e) => e.page === props.page);
  const applied = mine.map((entry, i) => applyEntry(entry, i + 1));
  results.value = applied;
  unanchored.value = applied.filter((r) => !r.anchored);
  document.addEventListener('click', onDocClick, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true);
  document.body.classList.remove('redline-hidden');
});
</script>

<style>
/* Global (unscoped) on purpose: the marks are injected into the page's DOM
   outside this component's scope, and the card/pill are teleported to body. */

.redline-ins {
  background: rgba(52, 168, 83, 0.12);
  text-decoration: underline;
  text-decoration-color: #34a853;
  text-underline-offset: 2px;
  cursor: pointer;
}
.redline-del {
  background: rgba(217, 48, 37, 0.07);
  color: #b3261e;
  text-decoration: line-through;
  cursor: pointer;
  margin-right: 2px;
}
.redline-comment {
  background: rgba(251, 188, 4, 0.28);
  cursor: pointer;
}
.redline-proposed {
  text-decoration: underline dotted;
  text-decoration-color: #f9ab00;
  text-underline-offset: 2px;
  cursor: pointer;
}
.redline-badge {
  display: inline-block;
  min-width: 16px;
  padding: 0 4px;
  margin-left: 2px;
  border-radius: 8px;
  background: #fbbc04;
  color: #1a1a1a;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  cursor: pointer;
  user-select: none;
}

/* Hide toggle: page reads clean, pill stays. */
.redline-hidden .redline-ins,
.redline-hidden .redline-comment,
.redline-hidden .redline-proposed {
  background: transparent;
  text-decoration: none;
  cursor: inherit;
}
.redline-hidden .redline-del,
.redline-hidden .redline-badge {
  display: none;
}

.redline-pill {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 4000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #1a1a1a;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}
.redline-pill-warn {
  color: #fbbc04;
  cursor: help;
}
.redline-pill-btn {
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  padding: 1px 10px;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.redline-card {
  position: absolute;
  z-index: 4001;
  width: min(380px, calc(100vw - 24px));
  padding: 12px 14px;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  background: #fff;
  color: #1a1a1a;
  font-size: 13.5px;
  line-height: 1.5;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
}
.redline-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.redline-card-id {
  font-weight: 700;
}
.redline-card-status {
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.redline-card-status.is-open { background: rgba(251, 188, 4, 0.25); color: #7a5d00; }
.redline-card-status.is-accepted { background: rgba(52, 168, 83, 0.15); color: #137333; }
.redline-card-status.is-rejected { background: rgba(217, 48, 37, 0.12); color: #b3261e; }
.redline-card-meta {
  color: #71717a;
  font-size: 12px;
}
.redline-card-close {
  margin-left: auto;
  border: none;
  background: none;
  font-size: 18px;
  line-height: 1;
  color: #71717a;
  cursor: pointer;
}
.redline-card-diff {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #fafafa;
}
.redline-card-del {
  color: #b3261e;
  text-decoration: line-through;
  margin-right: 6px;
}
.redline-card-ins {
  color: #137333;
}
.redline-card-comment {
  margin: 0 0 8px;
}
.redline-card-reply {
  margin: 0 0 8px;
  padding: 6px 10px;
  border-left: 3px solid #e4e4e7;
}
.redline-card-reply p {
  margin: 2px 0 0;
}
.redline-card-hint {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  color: #71717a;
  font-size: 12px;
}
</style>

<template>
  <div class="hiring-md" v-html="html" />
</template>

<script setup>
// Markdown block for applicant-authored content (resumes) and notes
// (transcripts, AI assessments). marked + sanitize-html only load in this
// lazy admin chunk — keep them out of the initial bundle (#860 rules).
import { computed } from 'vue';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const props = defineProps({
  source: { type: String, default: '' },
});

const html = computed(() => {
  const raw = marked.parse(props.source || '', { breaks: true });
  // Applicant-supplied markdown is untrusted input: strip scripts/handlers,
  // keep document-ish tags. No images (a tracking pixel in a resume shouldn't
  // fire when an admin opens the page).
  return sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter((t) => t !== 'img'),
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener nofollow' }),
    },
  });
});
</script>

<style lang="scss" scoped>
.hiring-md {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.87);
  overflow-wrap: break-word;

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    font-size: 15px;
    font-weight: 600;
    margin: 16px 0 6px;
    line-height: 1.3;
  }
  :deep(h1) { font-size: 17px; }
  :deep(h2) { font-size: 16px; }
  :deep(p) { margin: 0 0 10px; }
  :deep(ul), :deep(ol) { margin: 0 0 10px; padding-left: 22px; }
  :deep(li) { margin-bottom: 2px; }
  :deep(code) {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 12.5px;
  }
  :deep(pre) {
    background: rgba(0, 0, 0, 0.04);
    border-radius: 6px;
    padding: 10px 12px;
    overflow-x: auto;
    margin: 0 0 10px;

    code { background: none; padding: 0; }
  }
  :deep(blockquote) {
    border-left: 3px solid rgba(0, 0, 0, 0.15);
    margin: 0 0 10px;
    padding: 2px 0 2px 12px;
    color: rgba(0, 0, 0, 0.6);
  }
  :deep(table) {
    border-collapse: collapse;
    margin: 0 0 10px;

    th, td { border: 1px solid rgba(0, 0, 0, 0.12); padding: 4px 8px; }
  }
  :deep(a) { color: #1976d2; }
  :deep(hr) { border: none; border-top: 1px solid rgba(0, 0, 0, 0.12); margin: 14px 0; }
}
</style>

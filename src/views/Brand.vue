<template>
  <v-container class="page brand-page">
    <v-card rounded flat>
      <div class="text-h1">Brand</div>
      <div class="text-h5 mt-4">
        OpenAlex logos, colors, and type — free to use. Grab what you need below.
      </div>
    </v-card>

    <!-- LOGO -->
    <h4 class="text-h4 section-head" id="logo">
      Logo
      <v-btn icon variant="text" size="small" to="#logo"><v-icon>mdi-link</v-icon></v-btn>
    </h4>
    <p>
      Our logo comes as a full lockup (mark + wordmark) and as the standalone tricon mark.
      Use the dark versions on light backgrounds and the white versions on dark or photographic
      backgrounds. Please give the logo a little breathing room and don't recolor, stretch, or
      add effects to it.
    </p>

    <div class="logo-grid">
      <div v-for="asset in logoAssets" :key="asset.file" class="logo-card">
        <div class="logo-tile" :class="asset.dark ? 'tile-dark' : 'tile-light'">
          <img :src="asset.src" :alt="asset.label" />
        </div>
        <div class="logo-meta">
          <span class="logo-label">{{ asset.label }}</span>
          <a :href="asset.src" :download="asset.file" class="download-link">
            <v-icon size="small">mdi-tray-arrow-down</v-icon> PNG
          </a>
        </div>
      </div>
    </div>

    <!-- COLORS -->
    <h4 class="text-h4 section-head" id="colors">
      Colors
      <v-btn icon variant="text" size="small" to="#colors"><v-icon>mdi-link</v-icon></v-btn>
    </h4>
    <p>
      It's black. How much more black could it be? None — none more black. Click a swatch to
      copy its hex value.
    </p>
    <div class="swatch-grid">
      <button
        v-for="color in colors"
        :key="color.hex"
        class="swatch"
        type="button"
        @click="copyHex(color.hex)"
      >
        <span class="swatch-chip" :style="{ background: color.hex, border: color.border ? '1px solid #e2e2e2' : 'none' }"></span>
        <span class="swatch-name">{{ color.name }}</span>
        <span class="swatch-hex">
          {{ copied === color.hex ? 'Copied!' : color.hex }}
        </span>
        <span class="swatch-rgb">{{ color.rgb }}</span>
      </button>
    </div>

    <!-- TYPOGRAPHY -->
    <h4 class="text-h4 section-head" id="type">
      Typography
      <v-btn icon variant="text" size="small" to="#type"><v-icon>mdi-link</v-icon></v-btn>
    </h4>
    <p>
      OpenAlex is set in <a href="https://rsms.me/inter/" target="_blank" rel="noopener noreferrer">Inter</a>,
      a free and open-source typeface by Rasmus Andersson. It's available on
      <a href="https://fonts.google.com/specimen/Inter" target="_blank" rel="noopener noreferrer">Google Fonts</a>.
    </p>
    <div class="type-specimen">
      <div class="type-name">Inter</div>
      <div class="type-alphabet">AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz 0123456789</div>
      <div class="type-weights">
        <span style="font-weight:400">Regular</span>
        <span style="font-weight:500">Medium</span>
        <span style="font-weight:600">Semibold</span>
        <span style="font-weight:700">Bold</span>
      </div>
    </div>

    <!-- DOWNLOAD -->
    <h4 class="text-h4 section-head" id="download">
      Download
      <v-btn icon variant="text" size="small" to="#download"><v-icon>mdi-link</v-icon></v-btn>
    </h4>
    <p>
      Grab everything in one go — all logo variants as PNGs, including a square version for
      social avatars.
    </p>
    <v-btn
      color="primary"
      variant="flat"
      href="/brand-assets/openalex-brand.zip"
      download="openalex-brand.zip"
      prepend-icon="mdi-folder-zip-outline"
    >
      Download all assets (.zip)
    </v-btn>

    <!-- USAGE -->
    <h4 class="text-h4 section-head" id="usage">
      Usage
      <v-btn icon variant="text" size="small" to="#usage"><v-icon>mdi-link</v-icon></v-btn>
    </h4>
    <p>
      OpenAlex is an open, nonprofit project, and we're glad to have our name and logo used to
      refer to us. You're welcome to use the OpenAlex logo — without asking — for academic,
      educational, journalistic, and community purposes: to link to us, to credit us as a data
      source, in presentations and papers, in articles about OpenAlex, and at community events.
    </p>
    <p>
      We just ask that you:
    </p>
    <ul>
      <li>don't modify the logo (no recoloring, stretching, rotating, or adding effects);</li>
      <li>don't use it in a way that suggests OpenAlex endorses or is affiliated with your
        product, organization, or viewpoint when it isn't; and</li>
      <li>get in touch first for commercial uses (for example, selling merchandise that features
        the mark).</li>
    </ul>
    <p>
      Not sure whether your use is okay? Just
      <a href="https://openalex.zendesk.com/hc/requests/new" target="_blank" rel="noopener noreferrer">ask us</a> —
      we're friendly.
    </p>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useHead } from '@unhead/vue';

defineOptions({
  name: 'BrandPage',
});

useHead({ title: 'Brand' });

const logoAssets = ref([
  { label: 'Logo lockup', file: 'openalex-lockup.png', src: '/brand-assets/openalex-lockup.png', dark: false },
  { label: 'Logo lockup (white)', file: 'openalex-lockup-white.png', src: '/brand-assets/openalex-lockup-white.png', dark: true },
  { label: 'Tricon mark', file: 'openalex-mark.png', src: '/brand-assets/openalex-mark.png', dark: false },
  { label: 'Tricon mark (white)', file: 'openalex-mark-white.png', src: '/brand-assets/openalex-mark-white.png', dark: true },
]);

const colors = ref([
  { name: 'Black', hex: '#000000', rgb: 'rgb(0, 0, 0)' },
  { name: 'Ink', hex: '#171717', rgb: 'rgb(23, 23, 23)' },
  { name: 'White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', border: true },
]);

const copied = ref(null);
const copyHex = (hex) => {
  navigator.clipboard?.writeText(hex);
  copied.value = hex;
  setTimeout(() => {
    if (copied.value === hex) copied.value = null;
  }, 1200);
};
</script>

<style scoped lang="scss">
.brand-page {
  max-width: 900px;
}

.section-head {
  padding-top: 50px;
}

/* Logo grid */
.logo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 16px;
}

@media (max-width: 600px) {
  .logo-grid { grid-template-columns: 1fr; }
}

.logo-card {
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.logo-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  min-height: 160px;
}

.logo-tile img {
  max-width: 80%;
  max-height: 90px;
  object-fit: contain;
}

.tile-light { background: #fafafa; }
.tile-dark { background: #171717; }

.logo-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.logo-label {
  font-size: 13px;
  font-weight: 500;
  color: #3f3f3f;
}

.download-link {
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Color swatches */
.swatch-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

@media (max-width: 600px) {
  .swatch-grid { grid-template-columns: 1fr; }
}

.swatch {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 16px;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  font-family: inherit;
}

.swatch:hover {
  border-color: #d4d4d4;
  box-shadow: 0 3px 6px -2px rgba(0, 0, 0, 0.06);
}

.swatch-chip {
  width: 100%;
  height: 56px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.swatch-name {
  font-size: 14px;
  font-weight: 600;
  color: #171717;
}

.swatch-hex {
  font-size: 13px;
  font-weight: 500;
  color: #5c5c5c;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}

.swatch-rgb {
  font-size: 12px;
  color: #8a8a8a;
}

/* Type specimen */
.type-specimen {
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  padding: 28px;
  margin-top: 16px;
}

.type-name {
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.type-alphabet {
  font-size: 18px;
  color: #3f3f3f;
  margin-top: 12px;
  word-break: break-word;
}

.type-weights {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  font-size: 18px;
  color: #171717;
}
</style>

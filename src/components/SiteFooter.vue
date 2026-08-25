<template>
  <v-footer color="#fff" class="site-footer" style="padding: 0 0 100px; z-index: 1500;">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10">
          <div class="footer-top">
            <router-link to="/" class="footer-logo-link">
              <img
                src="/brand-assets/openalex-lockup.png"
                class="footer-logo"
                alt="OpenAlex"
              />
            </router-link>

            <div class="trust-badges">
              <div
                v-for="badge in trustBadges"
                :key="badge.name"
                class="trust-badge"
              >
                <v-icon v-if="badge.icon" class="trust-badge-icon">{{ badge.icon }}</v-icon>
                <img
                  v-else-if="badge.img"
                  :src="badge.img"
                  class="trust-badge-img"
                  :alt="badge.name"
                />
                <span class="trust-badge-label">{{ badge.name }}</span>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col
          cols="6"
          sm="4"
          md="2"
          v-for="col in navConfigs"
          :key="col.name"
        >
          <div class="text-body-2 font-weight-bold mb-4">{{ col.name }}</div>
          <div
            v-for="link in col.links"
            :key="link.name"
          >
            <router-link
              v-if="link.to"
              :to="link.to"
            >
              {{ link.name }}
            </router-link>
            <a
              v-else-if="link.href"
              :href="link.href"
              target="_blank"
              rel="noopener"
            >
              {{ link.name }}
            </a>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>


<script setup>
import {navConfigs, trustBadges} from "@/navConfigs";

defineOptions({ name: 'SiteFooter' });
</script>


<style scoped lang="scss">
.site-footer {
  line-height: 1.8;
  border-top: 0.5px solid rgba(0, 0, 0, 0.12) !important;
  padding-top: 50px !important;

  a {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.footer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 36px;
}

.footer-logo {
  height: 28px;
  display: block;
}

.trust-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 28px;
}

.site-footer .trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1a1a1a !important;

  .trust-badge-icon {
    font-size: 18px !important;
    width: 18px !important;
    height: 18px !important;
    color: #1a1a1a !important;

    // The OSI keyhole glyph is drawn with a very thin line at this size —
    // thicken its outline so it doesn't get lost next to the other marks.
    &.mdi-open-source-initiative {
      -webkit-text-stroke: 0.8px #1a1a1a;
    }
  }

  .trust-badge-img {
    height: 18px;
    width: 18px;
    display: block;
  }

  .trust-badge-label {
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.01em;
    line-height: 1.2;
    white-space: nowrap;
  }
}
</style>

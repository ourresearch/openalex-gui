<template>
  <v-footer color="#fff" class="site-footer" style="padding: 0 0 100px; z-index: 1500;">
    <v-container>
      <div class="footer-top">
        <router-link to="/" class="footer-logo-link">
          <img
            src="@/assets/openalex-logo.png"
            class="footer-logo"
            alt="OpenAlex"
          />
        </router-link>

        <div class="trust-badges">
          <template v-for="badge in trustBadges" :key="badge.name">
            <router-link
              v-if="badge.to"
              :to="badge.to"
              class="trust-badge"
            >
              <v-icon class="trust-badge-icon">{{ badge.icon }}</v-icon>
              <span class="trust-badge-text">
                <span class="trust-badge-eyebrow">{{ badge.eyebrow }}</span>
                <span class="trust-badge-label">{{ badge.name }}</span>
              </span>
            </router-link>
            <a
              v-else
              :href="badge.href"
              target="_blank"
              rel="noopener"
              class="trust-badge"
            >
              <v-icon class="trust-badge-icon">{{ badge.icon }}</v-icon>
              <span class="trust-badge-text">
                <span class="trust-badge-eyebrow">{{ badge.eyebrow }}</span>
                <span class="trust-badge-label">{{ badge.name }}</span>
              </span>
            </a>
          </template>
        </div>
      </div>

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
  margin-bottom: 48px;
}

.footer-logo {
  height: 38px;
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
  gap: 9px;
  color: rgba(0, 0, 0, 0.55) !important;
  transition: color 0.15s ease;

  &:hover {
    text-decoration: none;
    color: rgba(0, 0, 0, 0.87) !important;
  }

  .trust-badge-icon {
    font-size: 24px !important;
    width: 24px !important;
    height: 24px !important;
    color: inherit !important;
  }

  .trust-badge-text {
    display: flex;
    flex-direction: column;
  }

  .trust-badge-eyebrow {
    font-size: 9px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    line-height: 1.3;
    opacity: 0.85;
  }

  .trust-badge-label {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.2;
    white-space: nowrap;
  }
}
</style>

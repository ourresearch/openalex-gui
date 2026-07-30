<template>
  <v-footer color="#fff" class="site-footer" style="padding: 0 0 100px; z-index: 1500;">
    <v-container>
      <v-row>
        <v-col
          cols="6"
          sm="4"
          md="2"
          v-for="col in navConfigs"
          :key="col.name"
        >
          <div class="text-body-2 mb-4">{{ col.name }}</div>
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

      <div class="trust-badges mt-10">
        <template v-for="badge in trustBadges" :key="badge.name">
          <router-link
            v-if="badge.to"
            :to="badge.to"
            class="trust-badge"
          >
            <v-icon class="trust-badge-icon mr-2">{{ badge.icon }}</v-icon>
            <span>{{ badge.name }}</span>
          </router-link>
          <a
            v-else
            :href="badge.href"
            target="_blank"
            rel="noopener"
            class="trust-badge"
          >
            <v-icon class="trust-badge-icon mr-2">{{ badge.icon }}</v-icon>
            <span>{{ badge.name }}</span>
          </a>
        </template>
      </div>
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

.trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.site-footer .trust-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6) !important;

  &:hover {
    text-decoration: none;
    border-color: rgba(0, 0, 0, 0.35);
    color: rgba(0, 0, 0, 0.87) !important;
  }

  .trust-badge-icon {
    color: inherit !important;
  }
}
</style>

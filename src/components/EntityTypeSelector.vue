<template>
  <span>
    <v-btn
      v-if="isMobile"
      rounded
      text
      x-large
      :id="myId"
      class="pl-0 pr-0"
    >
      <v-icon>{{ entityTypeConfig.icon }}</v-icon>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>

    <v-btn
      v-else
      rounded
      text
      class="text-capitalize elevation-0 entity-type-select-btn"
      :id="myId"
      x-large
    >
      <v-icon>{{ entityTypeConfig.icon }}</v-icon>
      <span class="ml-2">{{ entityTypeConfig.displayName }}</span>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>

    <v-menu
      v-model="isDialogOpen"
      :activator="`#${myId}`"
      rounded
      offset-y
    >
      <v-card flat rounded>
        <v-card-text class="pa-0">
          <v-list>
            <v-subheader>What are you looking for?</v-subheader>
            <v-list-item
              v-for="entityOption in entityTypeOptions"
              :key="entityOption.name"
              @click="setEntityType(entityOption.name)"
            >
              <span>
                <v-icon>{{ entityOption.icon }}</v-icon>
              </span>
              <v-list-item-title class="text-capitalize">
                <span>{{ entityOption.displayName }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>{{ entityOption.descr }}</v-list-item-subtitle>
              <span v-if="entityType === entityOption.name">
                <v-icon>mdi-check</v-icon>
              </span>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-menu>
  </span>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { entityConfigs, getEntityConfig, getEntityConfigs } from "../entityConfigs";
import { url } from "@/url";

export default defineComponent({
  name: "SearchBox",
  props: {
    inline: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const { mobile } = useDisplay();

    const isDialogOpen = ref(false);
    const entityType = ref(route.params.entityType);
    const myId = `my-id-${Math.random().toString().replace(".", "")}`;

    const entityTypeOptions = computed(() => getEntityConfigs().filter(c => c.hasSerp));
    const entityTypeConfig = computed(() => getEntityConfig(entityType.value));

    const setEntityType = (type: string) => {
      entityType.value = type;
      url.pushToRoute(router, { name: "Serp", params: { entityType: type } });
      isDialogOpen.value = false;
    };

    watch(() => route.params.entityType, (newEntityType) => {
      entityType.value = newEntityType;
    });

    return {
      isDialogOpen,
      entityType,
      entityTypeOptions,
      entityTypeConfig,
      isMobile: mobile,
      myId,
      setEntityType,
    };
  },
});
</script>

<style lang="scss" scoped>
.card-button {
  background-color: rgba(0, 0, 0, 0.05) !important;

  &:hover {
    background-color: rgba(0, 0, 0, .08) !important;
  }

  &.selected {
    background-color: #444 !important;
  }
}
</style>

<template>
  <v-chip
    label
    variant="text"
    class="menu-chip"
    :style="{'border-bottom-color': buttonColorHex}"
    @click="$emit('click', $event)"
  >
    <template v-if="columnConfig.objectEntity">
      <template v-if="entityData">
        <b>{{ filters.truncate(entityData.display_name || 'Untitled', 50) }}</b>
      </template>
      <template v-else>
        Loading...
      </template>
    </template>
    <template v-else-if="columnConfig.type === 'boolean'">
      <b>{{ value ? 'true' : 'false' }}</b>
    </template>
    <template v-else-if="columnConfig.id === 'related_to_text'">
      {{ filters.truncate(value || '', 50) }}
    </template> 
    <template v-else>
      <b>{{columnConfig.isCurrency ? '$' : ''}}{{ filters.truncate(value || '', 50) }}</b>
    </template>
  </v-chip>
</template>


<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useStore } from "vuex";
import { api } from "@/api";
import filters from "@/filters";

defineOptions({
  name: "QueryFilterValueChip"
});

const props = defineProps({
  columnConfig: Object,
  value: [String, Number, Boolean],
  isLabelFilter: Boolean,
  isEditable: Boolean,
  subjectEntity: String,
  isSentence: Boolean
});

const store = useStore();

const entityData = ref(null);
const isLoading = ref(false);

const buttonColorHex = computed(() => "#AAA");

async function getEntity() {
  if (!props.columnConfig.objectEntity) {
    return;
  } else if (props.isLabelFilter) {
    const collection = store.getters["user/getCollection"](props.value);
    entityData.value = {
      display_name: collection.name
    };
  } else {
    isLoading.value = true;
    const response = await api.getEntity(props.value);
    entityData.value = response;
    isLoading.value = false;
  }
}

watch(
  () => props.value,
  (newValue) => {
    if (newValue) {
      getEntity();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!props.value) {
    console.log("QueryFilterValueChip: no value");
  }
});
</script>

<style scoped lang="scss">
.v-icon {
  margin-left: 4px;
}
</style>
<template>
  <v-card rounded :loading="isLoading">
    <v-card-title>{{ editId ? 'Edit Label' : `Create${idsArray.length ? ' and apply' : ''} Label` }}</v-card-title>
    <v-card-text>
      <form>
          <v-text-field
              variant="solo-filled"
              flat
              rounded
              class="mt-0"
              name="name"
              id="name"
              type="name"
              v-model="name"
              autofocus
              placeholder="Label name"
              hide-details
              @keydown.enter.prevent="createLabel"
          >
          </v-text-field>
          <template v-if="full">
            <div style="position: relative;"> <!-- for catching events on a disabled select -->
              <v-select
                v-model="entity_type"
                :items="entity_types"
                label="Type"
                item-title="text"
                item-value="value"
                variant="solo-filled"
                flat
                rounded
                class="mt-4"
                required
                hide-details
                :disabled="isChangeTypeDisabled"
              ></v-select>
              <div
                v-if="isChangeTypeDisabled"
                @click.prevent="handleDisabledSelectClick"
                style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"
              ></div>
            </div>
            <v-textarea
              v-model="description"
              label="Description (optional)"
              variant="solo-filled"
              flat
              rounded
              class="mt-4"
              hide-details
              rows="3"
            ></v-textarea>
          </template>
      </form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn :disabled="isLoading" rounded variant="text" @click="$emit('close')">Cancel</v-btn>
      <v-btn
          color="primary"
          variant="flat"
          rounded
          :disabled="!name || isLoading"
          @click="createLabel">
        {{ editId ? "Save" : "Create" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { getEntityConfigs } from '@/entityConfigs';

defineOptions({ name: 'LabelCreate' });

const props = defineProps({
  full: { type: Boolean, default: false },
  ids: { type: Array, default: () => [] },
  entityType: { type: String, default: 'authors' },
  editId: { type: String, default: null }
});

const emit = defineEmits(['close']);

const store = useStore();

const name = ref('');
const description = ref('');
const entity_type = ref(props.entityType);
const isLoading = ref(false);
const idsArray = ref(props.ids?.length ? props.ids : []);

const entity_types = computed(() =>
  getEntityConfigs()
    .filter(c => c.hasAutocomplete)
    .map((config) => ({
      text: config.displayName,
      value: config.name
    }))
);

const isChangeTypeDisabled = computed(() => {
  if (!props.editId) return false;
  const label = store.getters['user/getCollection'](props.editId);
  return label && label.ids.length > 0;
});

const snackbar = (val) => store.commit('snackbar', val);

const createCollection = (payload) => store.dispatch('user/createCollection', payload);
const updateCollection = (payload) => store.dispatch('user/updateCollection', payload);

const createLabel = async () => {
  if (!name.value) return;

  isLoading.value = true;

  const payload = {
    ids: idsArray.value,
    name: name.value,
    entity_type: entity_type.value,
  };

  if (description.value) {
    payload.description = description.value;
  }

  if (props.editId) {
    await updateCollection({
      id: props.editId,
      name: name.value,
      description: description.value,
      entity_type: entity_type.value
    });
    snackbar({ msg: 'Label updated' });
  } else {
    await createCollection(payload);
    snackbar({ msg: 'Label created' + (idsArray.value.length ? ' and applied' : '') });
  }

  isLoading.value = false;
  closeDialog();
};

const closeDialog = () => {
  name.value = '';
  description.value = '';
  idsArray.value = [];
  emit('close');
};

const handleDisabledSelectClick = () => {
  snackbar({ msg: 'To change label type, please delete existing items first.' });
};

onMounted(() => {
  if (props.editId) {
    const collection = store.getters['user/getCollection'](props.editId);
    if (collection) {
      name.value = collection.name;
      description.value = collection.description || '';
      entity_type.value = collection.entity_type;
    }
  }
});
</script>


<style scoped lang="scss">

</style>
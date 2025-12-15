<template>
  <Card class="rounded-lg">
    <CardHeader>
      <CardTitle>{{ editId ? 'Edit Label' : `Create${idsArray.length ? ' and apply' : ''} Label` }}</CardTitle>
    </CardHeader>
    <CardContent>
      <form class="space-y-4">
        <Input
          v-model="name"
          autofocus
          placeholder="Label name"
          @keydown.enter.prevent="createLabel"
        />
        <template v-if="full">
          <div class="relative">
            <Select v-model="entity_type" :disabled="isChangeTypeDisabled">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="type in entity_types" :key="type.value" :value="type.value">
                  {{ type.text }}
                </SelectItem>
              </SelectContent>
            </Select>
            <div
              v-if="isChangeTypeDisabled"
              @click.prevent="handleDisabledSelectClick"
              class="absolute inset-0"
            ></div>
          </div>
          <Textarea
            v-model="description"
            placeholder="Description (optional)"
            :rows="3"
          />
        </template>
      </form>
    </CardContent>
    <CardFooter class="flex justify-end gap-2">
      <Button :disabled="isLoading" variant="outline" @click="$emit('close')">Cancel</Button>
      <Button
        :disabled="!name || isLoading"
        @click="createLabel"
      >
        <template v-if="isLoading">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        </template>
        {{ editId ? "Save" : "Create" }}
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { getConfigs } from '@/oaxConfigs';

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
  Object.keys(getConfigs()).map((type) => ({
    text: type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value: type
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


<style scoped>
/* Styles handled via Tailwind classes */
</style>
<template>
  <v-card rounded :loading="isLoading">
    <div>
      <v-card-title class="d-flex">
        <div>Apply a correction</div>
        <v-spacer />
        <div>
          <v-chip
              v-if="currentStep"
              size="small"
              variant="outlined"
              label
              class="mr-2"
          >
            Step {{ currentStep }} of 4
          </v-chip>
          <v-chip
              v-if="isLoading"
              color="primary"
              class="mr-2"
          >
            Loading...
          </v-chip>
        </div>

      </v-card-title>
      <v-card-subtitle class="pb-0">
        to {{ ids.length }} selected works.
      </v-card-subtitle>
    </div>
    <v-card-text class="text-body-1 pa-0">

      <v-divider class="my-4"></v-divider>
      <div class="step step-1 d-flex px-4">
        <div class="pr-2">
          <v-icon>mdi-numeric-1-circle</v-icon>
        </div>
        <div>
          What property to you want to change?
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                 
                  v-bind="props"
                  variant="text"
                  class="d-block px-2"
              >
                <!--            <v-icon left v-if="selectedPropToModify">{{ selectedPropToModify.icon }}</v-icon>-->
                {{ selectedPropToModify?.displayName || "select property" }}
                <v-icon end>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                  v-for="prop in propToModifyOptions"
                  :key="prop.id"
                  @click="selectedPropToModify = prop"
              >
                <v-icon>{{ prop.icon }}</v-icon>
                <v-list-item-title>{{ prop.displayName }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>

      <v-divider v-if="selectedPropToModify" class="my-4"></v-divider>
      <div v-if="selectedPropToModify" class="step step-2 d-flex px-4">
        <div class="pr-2">
          <v-icon>mdi-numeric-2-circle</v-icon>
        </div>
        <div>
          What do you want to do?
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                 
                  v-bind="props"
                  variant="text"
                  class="d-block px-2"
              >
                <!--            <v-icon left v-if="selectedAction">{{ selectedAction.icon }}</v-icon>-->
                <template v-if="!selectedAction">Select an action</template>
                <template v-else>
                  {{ selectedAction.id }} an
                  {{ filters.pluralize(selectedPropToModify.displayName, 1) }}
                </template>
                <v-icon end>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                  v-for="myAction in actionOptions"
                  :key="myAction.id"
                  @click="selectedAction = myAction"
              >
                <v-icon>{{ myAction.icon }}</v-icon>
                <v-list-item-title>
                  {{ myAction.id }} an {{ filters.pluralize(selectedPropToModify.displayName, 1) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

      </div>
      <v-divider class="my-4" v-if="selectedAction"></v-divider>
      <div class="step step-3 d-flex px-4" v-if="selectedAction">
        <div class="pr-2">
          <v-icon>mdi-numeric-3-circle</v-icon>
        </div>
        <div class="flex-grow-1">
          What {{ filters.pluralize(selectedPropToModify.displayName, 1) }} do you want to {{ selectedAction.id }}?
          <entity-autocomplete
              class="mt-3"
              :entity-type="selectedPropToModify.objectEntity"
              @entity-selected="selectedValue = $event"

          />
        </div>
      </div>
      <v-divider class="my-4" v-if="selectedValue"></v-divider>
      <div class="step step-4 d-flex px-4" v-if="selectedValue">
        <div class="pr-2">
          <v-icon>mdi-numeric-4-circle</v-icon>
        </div>
        <div class="flex-grow-1">
          Any comments (optional)?
          <v-textarea
              variant="filled"
              density="compact"
              rounded
              class="mt-4"
              v-model="comments"
              label="Comments"
              placeholder="Comments"
              hide-details
              @keydown.enter.prevent="create"
              style="width: 100%;"
            ></v-textarea>

        </div>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn :disabled="isLoading" rounded variant="text" @click="$emit('close')">Cancel</v-btn>
      <v-btn
          color="primary"
          rounded
          :disabled="isLoading || currentStep < 4"
          @click="create">
        Submit correction
      </v-btn>
    </v-card-actions>
  </v-card>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import filters from '@/filters';
import EntityAutocomplete from '@/components/EntityAutocomplete.vue';

defineOptions({
  name: 'CorrectionCreate'
});

// Props
defineProps({
  ids: {
    type: Array,
    required: false,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['close']);

// Store
const store = useStore();
const snackbar = (msg) => store.commit('snackbar', msg);

// State
const isLoading = ref(false);
const selectedPropToModify = ref(null);
const propToModifyOptionIds = [
  'authorships.institutions.id',
  'authorships.author.id',
  // 'open_access.is_oa',
];
const selectedAction = ref(null);
const actionOptions = [
  { id: 'remove', displayName: 'removing', icon: 'mdi-delete' },
  { id: 'add', displayName: 'adding', icon: 'mdi-plus' },
];
const selectedValue = ref(null);
const comments = ref('');

// Computed
const propToModifyOptions = computed(() => {
  // Hardcoded options since the correction feature is not yet implemented
  return [
    { id: 'authorships.institutions.id', displayName: 'Institution' },
    { id: 'authorships.author.id', displayName: 'Author' },
  ].filter(prop => propToModifyOptionIds.includes(prop.id));
});

const currentStep = computed(() => {
  if (!selectedPropToModify.value) return 1;
  if (!selectedAction.value) return 2;
  if (!selectedValue.value) return 3;
  if (!comments.value) return 4;
  return 0;
});

// Methods
async function create() {
  // Placeholder logic
  snackbar({ msg: "this doesn't do anything yet..." });
  close();
}

function close() {
  emit('close');
}
</script>
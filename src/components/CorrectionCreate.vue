<template>
  <Card class="rounded-lg">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Apply a correction</CardTitle>
        <div class="flex gap-2">
          <Badge v-if="currentStep" variant="outline">
            Step {{ currentStep }} of 4
          </Badge>
          <Badge v-if="isLoading">
            Loading...
          </Badge>
        </div>
      </div>
      <CardDescription>
        to {{ ids.length }} selected works.
      </CardDescription>
    </CardHeader>
    <CardContent class="p-0">

      <Separator class="my-4" />
      <div class="flex px-4">
        <div class="pr-2">
          <div class="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</div>
        </div>
        <div>
          What property to you want to change?
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="block px-2">
                {{ selectedPropToModify?.displayName || "select property" }}
                <ChevronDown class="h-4 w-4 ml-1 inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                  v-for="prop in propToModifyOptions"
                  :key="prop.id"
                  @click="selectedPropToModify = prop"
              >
                {{ prop.displayName }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator v-if="selectedPropToModify" class="my-4" />
      <div v-if="selectedPropToModify" class="flex px-4">
        <div class="pr-2">
          <div class="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</div>
        </div>
        <div>
          What do you want to do?
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="block px-2">
                <template v-if="!selectedAction">Select an action</template>
                <template v-else>
                  {{ selectedAction.id }} an
                  {{ filters.pluralize(selectedPropToModify.displayName, 1) }}
                </template>
                <ChevronDown class="h-4 w-4 ml-1 inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                  v-for="myAction in actionOptions"
                  :key="myAction.id"
                  @click="selectedAction = myAction"
              >
                {{ myAction.id }} an {{ filters.pluralize(selectedPropToModify.displayName, 1) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
      <Separator class="my-4" v-if="selectedAction" />
      <div class="flex px-4" v-if="selectedAction">
        <div class="pr-2">
          <div class="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</div>
        </div>
        <div class="flex-1">
          What {{ filters.pluralize(selectedPropToModify.displayName, 1) }} do you want to {{ selectedAction.id }}?
          <entity-autocomplete
              class="mt-3"
              :entity-type="selectedPropToModify.objectEntity"
              @entity-selected="selectedValue = $event"

          />
        </div>
      </div>
      <Separator class="my-4" v-if="selectedValue" />
      <div class="flex px-4" v-if="selectedValue">
        <div class="pr-2">
          <div class="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">4</div>
        </div>
        <div class="flex-1">
          Any comments (optional)?
          <Textarea
              class="mt-4 w-full"
              v-model="comments"
              placeholder="Comments"
              @keydown.enter.prevent="create"
            />

        </div>
      </div>
    </CardContent>
    <CardFooter class="flex justify-end gap-2">
      <Button :disabled="isLoading" variant="outline" @click="$emit('close')">Cancel</Button>
      <Button
          :disabled="isLoading || currentStep < 4"
          @click="create">
        Submit correction
      </Button>
    </CardFooter>
  </Card>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { ChevronDown } from 'lucide-vue-next';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

import filters from '@/filters';
import { getConfigs } from '@/oaxConfigs';
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
  return Object.values(getConfigs().works.properties)
    .filter(prop => propToModifyOptionIds.includes(prop.id));
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
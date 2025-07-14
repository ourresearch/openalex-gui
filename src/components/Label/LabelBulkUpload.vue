<template>
  <v-card rounded>
    <v-card-title>Upload {{ filters.capitalize(labelData.entity_type) }} List</v-card-title>
    <v-card-text>
      <template v-if="!checked">
        <v-textarea
          v-model="bulkInput"
          :auto-grow="false"
          hide-details
          rows="6"
          no-resize
          variant="outlined"
          :placeholder="`Paste or type ${acceptedIdsNames} separated by new lines or commas`"
        ></v-textarea>
        <div v-if="idType !== 'openalex'" class="text-caption text-grey mt-1" style="font-size: 12px;">
          Reading inputs as {{ idType.toUpperCase() }}
        </div>

      </template>
      <template v-else>
        <div v-if="invalidIds.length">
          <div class="mt-4 font-weight-bold unrecognized-header">{{ invalidIds.length }} {{ entitySingularOrPlural(invalidIds.length) }} not recognized</div>
          <v-textarea
            v-model="recheckInput"
            rows="4"
            variant="outlined"
            no-resize
            hide-details
            class="mt-1"
          ></v-textarea>
          <div class="button-align-right">
            <v-btn color="primary" class="mt-2" @click="onRecheck" :loading="checking" :disabled="checking || !canRecheck">
              Recheck
            </v-btn>
          </div>
        </div>
        <div v-if="validIds.length">
          <div class="font-weight-bold recognized-header">{{ validIds.length }} {{ entitySingularOrPlural(validIds.length) }} recognized</div>
          <div class="recognized-id-list mt-1">
            <div v-for="item in validIds" :key="item.id" class="recognized-id-list-item recognized-id-row">
              <span>{{ item.id }} <span class="text-grey">({{ item.display_name }})</span></span>
              <v-icon size="small" class="remove-id-btn" @click="removeRecognizedId(item.id)">mdi-close</v-icon>
            </div>
          </div>
          <div class="button-align-right">
            <v-btn color="success" class="mb-4" @click="onAddRecognized">
              Add {{ validIds.length }} {{ labelData.entity_type }}
            </v-btn>
          </div>
        </div>
      </template>
    </v-card-text>
    <v-card-actions>
      <v-btn v-if="checked" variant="text" color="primary" @click="onBack" class="mr-auto">
        <v-icon start>mdi-arrow-left</v-icon>Back
      </v-btn>
      <v-spacer />
      <template v-if="!checked">
        <v-btn rounded variant="text" @click="$emit('close')">Cancel</v-btn>
        <v-btn 
          color="primary" 
          variant="flat"
          rounded
          @click="onCheckIds" 
          :loading="checking" 
          :disabled="checking"
        >
          Check IDs
        </v-btn>
      </template>
      <template v-else>
        <v-btn rounded variant="text" @click="$emit('close')">Cancel</v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import filters from '@/filters';
import { getConfigs } from '@/oaxConfigs';

defineOptions({ name: 'LabelBulkUpload' });

const props = defineProps({
  labelId: { type: String, required: true }
});

const emit = defineEmits(['close']);
const store = useStore();

// Reactive state
const bulkInput = ref('');
const recheckInput = ref('');
const lastCheckedRecheckInput = ref('');
const originalInput = ref('');
const checking = ref(false);
const checked = ref(false);
const validIds = ref([]);
const invalidIds = ref([]);
const idType = ref('openalex');

const userCollections = computed(() => store.getters['user/userCollections']);
const labelData = computed(() => userCollections.value.find(coll => coll.id === props.labelId));
const canRecheck = computed(() => recheckInput.value !== lastCheckedRecheckInput.value);
const acceptedIdsNames = computed(() => {
  switch (labelData.value.entity_type) {
    case 'works': return 'OpenAlex IDs or DOIs';
    case 'authors': return 'OpenAlex IDs or ORCIDs';
    case 'institutions': return 'OpenAlex IDs or ROR IDs';
    default: return 'OpenAlex IDs';
  }
});

const snackbar = (val) => store.commit('snackbar', val);
const updateCollectionIds = (payload) => store.dispatch('user/updateCollectionIds', payload);

const parseIds = (input) => {
  const entityType = labelData.value.entity_type;
  const entityPrefix = entityType ? entityType[0].toUpperCase() : '';
  const ids = input.split(/\n|,/).map(id => id.trim()).filter(Boolean);
  return idType.value === 'openalex'
    ? ids.map(id => (/^\d/.test(id) ? entityPrefix + id : id))
    : ids;
};

const getIdType = (id) => {
  if (/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(id)) return 'orcid';
  if (id.length === 9 && id.startsWith('0')) return 'ror';
  if (id.startsWith('10.')) return 'doi';
  return 'openalex';
};

const buildApiUrl = (entityType, ids) => {
  const filterKey = idType.value === 'openalex' ? 'ids.openalex' : idType.value;
  const selectFields = ['id', 'display_name'];
  if (idType.value !== 'openalex') selectFields.push(idType.value);
  const filter = ids.map(id => encodeURIComponent(id)).join('%7C');
  return `https://api.openalex.org/${entityType}?filter=${filterKey}:${filter}&select=${selectFields.join(',')}`;
};

const extractBadIdFromError = (message) => {
  const match = message && message.match(/'([^']+)' is not a valid OpenAlex ID/);
  return match ? match[1] : null;
};

const stripIdFromUrl = (url) => {
  if (!url) return '';
  try {
    let path = url.replace(/^https?:\/\/[\w.]+\//, '');
    return path.startsWith('/') ? path.slice(1) : path;
  } catch {
    return url;
  }
};

const validateIdsWithRetry = async (entityType, ids) => {
  let badIds = [];
  let results = [];
  while (ids.length) {
    const url = buildApiUrl(entityType, ids);
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        results = data.results || [];
        break;
      }
      const badId = extractBadIdFromError(data.message);
      if (badId) {
        badIds.push(badId);
        ids = ids.filter(id => id !== badId);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return { results, badIds, remainingIds: ids };
};

const checkIds = async (input) => {
  checking.value = true;
  const ids = parseIds(input);
  if (!ids.length) {
    validIds.value = [];
    invalidIds.value = [];
    checking.value = false;
    return;
  }
  const { results, badIds } = await validateIdsWithRetry(labelData.value.entity_type, ids);
  const valid = results.map(r => {
    if (idType.value === 'openalex') {
      const openalex_id = r.id.replace('https://openalex.org/', '');
      return { id: openalex_id, display_name: r.display_name, openalex_id };
    } else {
      const rawId = r[idType.value] ? stripIdFromUrl(r[idType.value]) : null;
      return {
        id: rawId,
        display_name: r.display_name,
        openalex_id: r.id ? r.id.replace('https://openalex.org/', '') : null
      };
    }
  });
  const foundIds = new Set(valid.map(r => r.id));
  const invalid = [...badIds, ...parseIds(input).filter(id => !foundIds.has(id) && !badIds.includes(id))];
  validIds.value = valid;
  invalidIds.value = invalid;
  checking.value = false;
};

const onCheckIds = async () => {
  checked.value = false;
  validIds.value = [];
  invalidIds.value = [];
  recheckInput.value = '';
  originalInput.value = bulkInput.value;
  await checkIds(bulkInput.value);
  checked.value = true;
  recheckInput.value = invalidIds.value.join('\n');
  lastCheckedRecheckInput.value = recheckInput.value;
};

const onRecheck = async () => {
  checked.value = false;
  const oldValid = [...validIds.value];
  await checkIds(recheckInput.value);
  const allValid = [...oldValid, ...validIds.value];
  const seen = new Set();
  validIds.value = allValid.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  checked.value = true;
  recheckInput.value = invalidIds.value.join('\n');
  lastCheckedRecheckInput.value = recheckInput.value;
};

const onAddRecognized = async () => {
  const ids = validIds.value.map(item => `${labelData.value.entity_type}/${item.openalex_id}`);
  const newIds = Array.from(new Set([...labelData.value.ids, ...ids]));
  try {
    await updateCollectionIds({ collectionId: labelData.value.id, ids: newIds });
    emit('close');
    snackbar(`${ids.length} ${labelData.value.entity_type} added to ${labelData.value.name}`);
  } catch (e) {
    snackbar(`Failed to add IDs: ${e.message || e}`);
  }
};

const removeRecognizedId = (id) => {
  validIds.value = validIds.value.filter(item => item.id !== id);
};

const onBack = () => {
  checked.value = false;
  bulkInput.value = originalInput.value;
};

const entitySingularOrPlural = (count) => {
  if (count !== 1) return labelData.value.entity_type;
  return getConfigs()[labelData.value.entity_type].displayNameSingular;
};

// Watchers
watch(bulkInput, (val) => {
  const firstId = val.split(/\n|,/).map(x => x.trim()).find(Boolean);
  idType.value = firstId ? getIdType(firstId) : 'openalex';
});
</script>


<style scoped>
.recognized-id-list {
  border: 1px solid black;
  border-radius: 4px;
  padding: 6px 0;
  margin-bottom: 12px;
  min-height: 48px;
  max-height: 170px;
  background: #fafafa;
  overflow-y: scroll;
}
.recognized-id-list-item {
  color: black;
  font-size: 16px;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 12px;
  padding-right: 12px;
}
.recognized-id-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.recognized-id-row:hover {
  background-color: #f2f2f2;
}
.recognized-id-row .remove-id-btn:hover {
  opacity: 1;
  color: #b71c1c;
}
.recognized-header {
  color: #388e3c;
}
.unrecognized-header {
  color: #c62828;
}
:deep .v-textarea__slot textarea {
  max-height: 170px !important;
  overflow-y: auto !important;
}
.button-align-right {
  display: flex;
  justify-content: flex-end;
}
</style>
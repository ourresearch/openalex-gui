<template>
  <v-card rounded>
    <v-card-title>Upload {{ labelData.entity_type | capitalize }} List</v-card-title>
    <v-card-text>
      <template v-if="!checked">
        <v-textarea
          v-model="bulkInput"
          :auto-grow="false"
          hide-details
          rows="6"
          no-resize
          outlined
          :placeholder="`Paste or type ${acceptedIdsNames} separated by new lines or commas`"
        ></v-textarea>
        <div v-if="idType !== 'openalex'" class="caption grey--text mt-1" style="font-size: 12px;">
          Reading inputs as {{ idType.toUpperCase() }}
        </div>

      </template>
      <template v-else>
        <div v-if="invalidIds.length">
          <div class="mt-4 font-weight-bold unrecognized-header">{{ invalidIds.length }} {{ entitySingularOrPlural(invalidIds.length) }} not recognized</div>
          <v-textarea
            v-model="recheckInput"
            rows="4"
            outlined
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
              <span>{{ item.id }} <span class="grey--text">({{ item.display_name }})</span></span>
              <v-icon small class="remove-id-btn" @click="removeRecognizedId(item.id)">mdi-close</v-icon>
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
      <v-btn v-if="checked" text color="primary" @click="onBack" class="mr-auto">
        <v-icon left>mdi-arrow-left</v-icon>Back
      </v-btn>
      <v-spacer />
      <template v-if="!checked">
        <v-btn rounded text @click="$emit('close')">Cancel</v-btn>
        <v-btn color="primary" @click="onCheckIds" :loading="checking" :disabled="checking">
          Check IDs
        </v-btn>
      </template>
      <template v-else>
        <v-btn rounded text @click="$emit('close')">Cancel</v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";

export default {
  name: 'LabelBulkUpload',
  props: {
    labelId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      bulkInput: '',
      recheckInput: '',
      lastCheckedRecheckInput: '',
      originalInput: '',
      checking: false,
      checked: false,
      validIds: [], // {id, display_name}
      invalidIds: [],
      idType: "openalex", // "orcid", "ror", "doi", "openalex"
    };
  },
  computed: {
    ...mapGetters('user', [
      'userCollections'
    ]),
    labelData() {
      return this.userCollections.find(coll => coll.id === this.labelId);
    },    
    canRecheck() {
      return this.recheckInput !== this.lastCheckedRecheckInput;
    },
    acceptedIdsNames() {
      switch (this.labelData.entity_type) {
        case 'works':
          return 'OpenAlex IDs or DOIs';
        case 'authors':
          return 'OpenAlex IDs or ORCIDs';
        case 'ror':
          return 'OpenAlex IDs or ROR IDs';
        default:
          return 'OpenAlex IDs';
      }
    }
  },
  methods: {
    ...mapMutations(["snackbar"]),
    ...mapActions("user", [
      "updateCollectionIds",
    ]),
    parseIds(input) {
      const idType = this.idType;
      const entityType = this.labelData.entity_type;
      const entityPrefix = entityType && entityType.length > 0 ? entityType[0].toUpperCase() : '';
      let ids = input.split(/\n|,/).map(id => id.trim()).filter(Boolean);
      if (idType === 'openalex') {
        return ids.map(id => (/^\d/.test(id) ? entityPrefix + id : id));
      } else {
        // For orcid/doi/ror, do not prepend anything
        return ids;
      }
    },
    getIdType(id) {
      // ORCID: four groups of four digits separated by hyphens (e.g., 0000-0001-2345-6789)
      if (/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(id)) {
        return "orcid";
      }
      // ROR: starts with 0, 9 digits
      if (id.length === 9 && id.startsWith("0")) {
        return "ror";
      }
      // DOI: starts with 10.
      if (id.startsWith("10.")) {
        return "doi";
      }
      return "openalex";
    },
    buildApiUrl(entityType, ids) {
      const filterKey = this.idType === 'openalex' ? 'ids.openalex' : this.idType;
      const selectFields = ['id', 'display_name'];
      if (this.idType !== 'openalex') selectFields.push(this.idType);
      const filter = ids.map(id => encodeURIComponent(id)).join('%7C');
      return `https://api.openalex.org/${entityType}?filter=${filterKey}:${filter}&select=${selectFields.join(',')}`;
    },
    extractBadIdFromError(message) {
      const match = message && message.match(/'([^']+)' is not a valid OpenAlex ID/);
      return match ? match[1] : null;
    },
    async validateIdsWithRetry(entityType, ids) {
      let badIds = [];
      let results = [];
      while (ids.length) {
        const url = this.buildApiUrl(entityType, ids);
        let response, data;
        try {
          response = await fetch(url);
          data = await response.json();
        } catch {
          break; // Network or parsing error: abort
        }
        if (response.ok) {
          results = data.results || [];
          break;
        }
        const badId = this.extractBadIdFromError(data && data.message);
        if (badId) {
          badIds.push(badId);
          ids = ids.filter(id => id !== badId);
        } else {
          break; // Unknown error, abort
        }
      }
      return { results, badIds, remainingIds: ids };
    },
    async checkIds(input) {
      this.checking = true;
      let ids = this.parseIds(input);
      if (!ids.length) {
        this.validIds = [];
        this.invalidIds = [];
        this.checking = false;
        return;
      }
      const entityType = this.labelData.entity_type;
      const idType = this.idType;
      const { results, badIds } = await this.validateIdsWithRetry(entityType, ids);
      let valid = [];
      if (idType === 'openalex') {
        valid = (results || []).map(r => ({
          id: r.id.replace('https://openalex.org/', ''),
          display_name: r.display_name,
          openalex_id: r.id.replace('https://openalex.org/', '')
        }));
      } else {
        valid = (results || []).map(r => {
          let rawId = r[idType] ? this.stripIdFromUrl(r[idType]) : null;
          return {
            id: rawId,
            display_name: r.display_name,
            openalex_id: r.id ? r.id.replace('https://openalex.org/', '') : null
          };
        });
      }
      // For matching, use the rawId (for orcid/doi/ror) or openalex id
      const foundIds = new Set(valid.map(r => r.id));
      const invalid = [
        ...badIds,
        ...this.parseIds(input).filter(id => !foundIds.has(id) && !badIds.includes(id))
      ];
      this.validIds = valid;
      this.invalidIds = invalid;
      this.checking = false;
    },
    stripIdFromUrl(url) {
      // Remove protocol and domain, then leading slash
      if (!url) return '';
      try {
        let path = url.replace(/^https?:\/\/[\w.]+\//, '');
        // If still a slash, remove
        if (path.startsWith('/')) path = path.slice(1);
        return path;
      } catch {
        return url;
      }
    },
    async onCheckIds() {
      this.checked = false;
      this.validIds = [];
      this.invalidIds = [];
      this.recheckInput = '';
      this.originalInput = this.bulkInput;
      await this.checkIds(this.bulkInput);
      this.checked = true;
      this.recheckInput = this.invalidIds.join('\n');
      this.lastCheckedRecheckInput = this.recheckInput;
    },
    async onRecheck() {
      this.checked = false;
      const oldValidIds = this.validIds.slice();
      await this.checkIds(this.recheckInput);
      // Merge new validIds with old, deduplicating by id
      const allValid = [...oldValidIds, ...this.validIds];
      const seen = new Set();
      this.validIds = allValid.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      this.checked = true;
      this.recheckInput = this.invalidIds.join('\n');
      this.lastCheckedRecheckInput = this.recheckInput;
    },
    async onAddRecognized() {
      // Only use OpenAlex IDs for saving
      const recognizedFullIds = this.validIds
        .map(item => item.openalex_id)
        .filter(id => !!id) // filter out null/undefined
        .map(openalexId => `${this.labelData.entity_type}/${openalexId}`);
      const idSet = new Set([...this.labelData.ids, ...recognizedFullIds]);
      const newIds = Array.from(idSet);
      try {
        await this.updateCollectionIds({
          collectionId: this.labelData.id,
          ids: newIds,
        });
        this.$emit('close');
        this.snackbar(`${recognizedFullIds.length} ${this.labelData.entity_type} added to ${this.labelData.name}`);
      } catch (e) {
        this.snackbar(`Failed to add IDs: ${e.message || e}`);
      }
    },
    removeRecognizedId(id) {
      this.validIds = this.validIds.filter(item => item.id !== id);
    },
    onBack() {
      // Go back to initial state, restoring original input
      this.checked = false;
      this.bulkInput = this.originalInput;
    },
    entitySingularOrPlural(count) {
      if (count !== 1) {
        return this.labelData.entity_type;
      }
      const config = getConfigs()[this.labelData.entity_type];
      return config.displayNameSingular;
    }
  
  },
  watch: {
    bulkInput(val) {
      // Auto-detect ID type from the first non-empty value
      const firstId = (val || '').split(/\n|,/).map(x => x.trim()).find(x => x.length > 0);
      if (firstId) {
        this.idType = this.getIdType(firstId);
      } else {
        this.idType = 'openalex';
      }
    }
  },
}
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
::v-deep .v-textarea__slot textarea {
  max-height: 170px !important;
  overflow-y: auto !important;
}
.button-align-right {
  display: flex;
  justify-content: flex-end;
}
</style>
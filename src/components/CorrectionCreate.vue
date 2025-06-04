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
                <v-icon end>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                  v-for="prop in propToModifyOptions"
                  :key="prop.id"
                  @click="selectedPropToModify = prop"
              >
                <v-list-item-icon>
                  <v-icon>{{ prop.icon }}</v-icon>
                </v-list-item-icon>
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
                <v-icon end>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                  v-for="myAction in actionOptions"
                  :key="myAction.id"
                  @click="selectedAction = myAction"
              >
                <v-list-item-icon>
                  <v-icon>{{ myAction.icon }}</v-icon>
                </v-list-item-icon>
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
              full-width
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

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import filters from "@/filters";
import {getConfigs} from "@/oaxConfigs";

import EntityAutocomplete from "@/components/EntityAutocomplete.vue";

export default {
  name: "CorrectionCreate",
  components: {
    EntityAutocomplete,
  },
  props: {
    ids: {
      type: Array,
      required: false,
      default: () => [],
    }
  },
  data() {
    return {
      isLoading: false,
      propToModify: null,
      action: "remove",
      value: null,
      selectedPropToModify: null,
      propToModifyOptionIds: [
        "authorships.institutions.id",
        "authorships.author.id",
        // "open_access.is_oa",
      ],
      selectedAction: null,
      actionOptions: [
        {id: "remove", displayName: "removing", icon: "mdi-delete"},
        {id: "add", displayName: "adding", icon: "mdi-plus"},
      ],
      selectedValue: null,
      comments: "",
      filters,
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
    ]),
    propToModifyOptions() {
      return Object.values(getConfigs().works.properties)
          .filter(prop => this.propToModifyOptionIds.includes(prop.id))
    },
    currentStep() {
      if (!this.selectedPropToModify) return 1
      if (!this.selectedAction) return 2
      if (!this.selectedValue) return 3
      if (!this.comments) return 4
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
      "createCollection"
    ]),
    async create() {
      // if (!this.name) return
      //
      // this.isLoading = true
      // await this.createCollection({ids: this.idsArray, name: this.name})
      // this.isLoading = false
      // this.snackbar({msg: "Label created" + (this.idsArray.length ? " and applied" : "")})
      this.snackbar({msg: "this doesn't do anything yet..."})
      this.close()
    },
    close() {
      // this.name = ""
      // this.description = ""
      // this.idsArray = []
      this.$emit('close')
    }
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>
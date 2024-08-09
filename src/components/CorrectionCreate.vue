<template>
  <v-card rounded :loading="isLoading">
    <v-card-title>Apply a correction</v-card-title>
    <v-card-text class="body-1">
      <div>
        You've selected {{ ids.length }} works. What about these works do you want to correct?
        <div>
          <v-menu>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                  v-bind="attrs"
                  v-on="on"
                  text
                  class=" px-2"
              >
                <!--            <v-icon left v-if="selectedPropToModify">{{ selectedPropToModify.icon }}</v-icon>-->
                {{ selectedPropToModify?.displayName || "select property" }}
                <v-icon right>mdi-menu-down</v-icon>
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

      <div v-if="selectedPropToModify" class="">
        <v-divider class="my-4"></v-divider>
        <div>
          How do you want to correct it?
        </div>

        <!-- change a boolean prop -->
        <template v-if="selectedPropToModify?.newType === 'boolean'">

          <v-menu>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                  v-bind="attrs"
                  v-on="on"
                  text
                  class="d-inline"
              >
                <template v-if="selectedValue === null">Select an action</template>
                <template v-else>
                  set it to {{ selectedValue }}
                </template>
                <v-icon right>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                  v-for="(myValue, i) in [true, false]"
                  :key="i"
                  @click="selectedValue = myValue"
              >
                <v-list-item-icon>
                  <v-icon>{{ myValue ? "mdi-check" : "mdi-close" }}</v-icon>
                </v-list-item-icon>
                <v-list-item-title>set it to {{ myValue }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>


        <!-- change a non-boolean prop -->
        <template v-else>
          <v-menu>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                  v-bind="attrs"
                  v-on="on"
                  text
                  class="d-inline px-2"
              >
                <!--            <v-icon left v-if="selectedAction">{{ selectedAction.icon }}</v-icon>-->
                <template v-if="!selectedAction">Select an action</template>
                <template v-else>
                  {{ selectedAction.id }} an
                  {{ selectedPropToModify.displayName | pluralize(1) }}
                </template>
                <v-icon right>mdi-menu-down</v-icon>
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
                  {{ myAction.id }} an {{ selectedPropToModify.displayName | pluralize(1) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <div v-if="selectedAction">
            <v-divider class="my-4"></v-divider>
            <div>
              Which value do you want to {{ selectedAction.id }}?
            </div>
            <div>
              <v-text-field
                  filled
                  dense
                  rounded
                  class="mt-4"
                  v-model="value"
                  label="Paste an OpenAlex ID"
                  placeholder="Paste an OpenAlex ID"
                  hide-details
                  @keydown.enter.prevent="create"
              ></v-text-field>
            </div>

          </div>

        </template>


        <!--      <form>-->
        <!--        <v-select-->
        <!--            filled-->
        <!--            rounded-->
        <!--            class="mt-0"-->
        <!--            v-model="propToModify"-->
        <!--            :items="propToModifyOptions"-->
        <!--            label="Property to modify"-->
        <!--            placeholder="Select a property"-->
        <!--            hide-details-->
        <!--        ></v-select>-->
        <!--        <v-select-->
        <!--            filled-->
        <!--            rounded-->
        <!--            class="mt-4"-->
        <!--            v-model="action"-->
        <!--            :items="actionsOptions"-->
        <!--            label="Action"-->
        <!--            placeholder="Select an action"-->
        <!--            hide-details-->
        <!--        ></v-select>-->

        <!--        <v-text-field-->
        <!--            filled-->
        <!--            rounded-->
        <!--            class="mt-4"-->

        <!--            name="name"-->
        <!--            id="name"-->
        <!--            type="name"-->

        <!--            v-model="value"-->
        <!--            autofocus-->
        <!--            :label=""-->
        <!--            placeholder="Label name"-->
        <!--            hide-details-->
        <!--            @keydown.enter.prevent="create"-->
        <!--        >-->
        <!--        </v-text-field>-->
        <!--      </form>-->

      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn :disabled="isLoading" rounded text @click="$emit('close')">Cancel</v-btn>
      <v-btn
          color="primary"
          rounded
          :disabled="!propToModify || !value || isLoading"
          @click="create">
        Submit correction
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {oaxConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    ids: {
      type: Array,
      required: false,
      default: () => [],
    }
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      propToModify: null,
      action: "remove",
      value: null,
      comments: "",

      selectedPropToModify: null,
      propToModifyOptionIds: [
        "authorships.institutions.id",
        "authorships.author.id",
        "open_access.is_oa",
      ],

      selectedAction: null,
      actionOptions: [
        {id: "remove", displayName: "removing", icon: "mdi-delete"},
        {id: "add", displayName: "adding", icon: "mdi-plus"},
      ],

      selectedValue: null,

    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    propToModifyOptions() {
      return Object.values(oaxConfigs.works.properties)
          .filter(prop => this.propToModifyOptionIds.includes(prop.id))
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
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
<template>
  <div>
    <v-container>
      <v-row>
        <v-col>
          <div class="d-inline-flex align-center mt-2">
            <link-entity-roles-list
                v-if="data.roles"
                :roles="data.roles"
                :selected="myEntityConfig.nameSingular"
            />
            <template v-else>
              <v-icon left>{{ myEntityConfig.icon }}</v-icon>
              {{ myEntityConfig.displayNameSingular | capitalize }}
            </template>
          </div>
          <div class="text-h4">
            {{ data.display_name }}
          </div>


          <div class="d-flex mt-4">
            <v-btn
                :to="data.id | entityWorksLink"
                color="primary"
                class="mr-3"
                rounded
            >
              View works
            </v-btn>
            <v-btn
                :href="data.homepage_url"
                v-if="data.homepage_url"
                icon
                target="_blank"
            >
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>
          </div>

        </v-col>
      </v-row>

      <v-row class="mt-9">
        <v-col cols="4" v-if="alternateNamesString">
          <v-card flat rounded outlined>
            <v-card-title>
              Alternate names
            </v-card-title>
            <v-card-text>
              {{ alternateNamesString }}
            </v-card-text>

          </v-card>
        </v-col>
        <v-col cols="4" v-if="abstract">
          <v-card flat rounded outlined>
            <v-card-title>
              Abstract
            </v-card-title>
            <v-card-text>
              {{ abstract }}
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="4" v-if="data.authorships">
          <v-card flat rounded outlined>
            <v-card-title>
              Authors
            </v-card-title>
            <v-list>
              <entity-work-author
                v-for="author in data.authorships"
                :key="author.id"
                :author="author"
              />
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="2">
          <v-card flat rounded outlined>
            <v-card-title>
              Metrics
            </v-card-title>
            <v-divider />
            <v-simple-table dense>
              <tbody>
              <tr key="cited_by_count">
                <td>Citations</td>
                <td>{{ data.cited_by_count | toPrecision }}</td>
              </tr>
              <tr v-for="(val, key) in data.summary_stats" :key="key">
                <td>{{ key.replace("_", " ") }}</td>
                <td>{{ val | toPrecision }}</td>
              </tr>

              </tbody>
            </v-simple-table>

          </v-card>
        </v-col>


        <v-col cols="2">
          <v-card flat rounded outlined>
            <v-card-title>
              Links
            </v-card-title>
            <id-list :data="data.ids"></id-list>
          </v-card>
        </v-col>


      </v-row>


    </v-container>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getEntityConfig} from "@/entityConfigs";
import {entityTypeFromId, unravel} from "@/util";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import IdList from "@/components/IdList.vue";
import EntityWorkAuthor from "@/components/Entity/EntityWorkAuthor.vue";

export default {
  name: "Template",
  components: {
    LinkEntityRolesList,
    IdList,
    EntityWorkAuthor,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myEntityType(){
      return entityTypeFromId(this.data.id)
    },
    myEntityConfig(){
      return getEntityConfig(this.myEntityType)
    },
    alternateNamesString() {
      return [
        ...this.data.display_name_alternatives ?? [],
        ...this.data.display_name_acronyms ?? [],
        ...this.data.alternate_titles ?? [],

      ].join("; ")
    },

    abstract() {
      if (!this.data?.open_access?.is_oa) return
      return unravel(this.data.abstract_inverted_index)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


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
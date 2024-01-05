<template>
  <div>
    <v-container >
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

          <div class="subtitle">
            <template v-if="myEntityType === 'works'">
              <span v-if="data.publication_year">{{ data.publication_year }}</span>
              <span v-if="data.publication_year && data.type"> · </span>
              <span v-if="data.type">{{ data.type }}</span>
              <span v-if="data.primary_location?.source?.display_name"> · </span>
              <span v-if="data.primary_location?.source?.display_name" class="font-italic">
                {{ data.primary_location?.source?.display_name }}
              </span>
            </template>
            <template v-else>

            </template>
          </div>

          <div v-if="myEntityType === 'works'" class="d-flex mt-4">
            <work-linkouts :data="data" />
          </div>


          <div v-else class="d-flex mt-4">
            <v-btn
                :to="data.id | entityWorksLink"
                color="primary"
                class="mr-3"
                rounded
            >
              View works
            </v-btn>
            <v-btn
                v-if="data?.ids?.wikipedia"
                :href="data?.ids?.wikipedia"
                icon
                target="_blank"
            >
              <v-icon>mdi-wikipedia</v-icon>
            </v-btn>
            <v-btn
                v-if="mapLink"
                :href="mapLink"
                icon
                target="_blank"
            >
              <v-icon>mdi-map-marker-outline</v-icon>
            </v-btn>
            <v-btn
                :href="data.homepage_url"
                v-if="data.homepage_url"
                icon
                target="_blank"
            >
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>

            <entity-ids-menu-item :ids="data.ids" />

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
        <v-col cols="4">
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
import WorkLinkouts from "@/components/WorkLinkouts.vue";
import EntityIdsMenuItem from "@/components/Entity/EntityIdsMenuItem.vue";

export default {
  name: "Template",
  components: {
    LinkEntityRolesList,
    IdList,
    EntityWorkAuthor,
    WorkLinkouts,
    EntityIdsMenuItem,
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

    mapLink() {
      if (!this.data?.geo?.latitude || !this.data?.geo?.longitude) return
      return `https://www.openstreetmap.org/?mlat=${this.data.geo.latitude}&mlon=${this.data.geo.longitude}`
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
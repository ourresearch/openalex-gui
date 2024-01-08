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
              <router-link
                  v-if="data.primary_location?.source?.display_name && data?.primary_location?.source?.id"
                  :to="data.primary_location.source.id | entityZoomLink"
                  class=""
              >
                {{ data.primary_location?.source?.display_name }}
              </router-link>
            </template>
            <template v-else>

            </template>
          </div>

          <div v-if="myEntityType === 'works'" class="d-flex mt-4">
            <work-linkouts :data="data" />
            <entity-ids-menu-item :ids="data.ids" />
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
        <v-col cols="12" md="6" lg="4" xl="3" v-if="alternateNamesString">
          <v-card rounded flat class="factoid-card">
            <v-card-title>
              Alternate names
            </v-card-title>
            <v-card-text>
              {{ alternateNamesString }}
            </v-card-text>

          </v-card>
        </v-col>
        <v-col  cols="12" md="6" lg="4" xl="3" v-if="abstract">
          <v-card rounded flat class="factoid-card">
            <v-card-title>
              Abstract
            </v-card-title>
            <v-card-text>
              {{ abstract | truncate(isMore.abstract ? 9999999999 : 200) }}
            </v-card-text>
            <v-card-actions>
              <v-btn text rounded small @click="isMore.abstract = !isMore.abstract">
                {{ isMore.abstract ? "Less" : "More" }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col  cols="12" md="6" lg="4" xl="3" v-if="authorshipsCount">
          <v-card rounded flat class="factoid-card">
            <v-card-title>
              Authors ({{ authorshipsCount}})
            </v-card-title>
            <v-list color="#eee">
              <entity-work-author
                v-for="authorship in authorships"
                :key="authorship.id"
                :author="authorship"
              />
            </v-list>
            <v-card-actions v-if="authorshipsCount > maxAuthorships">
              <v-btn text rounded small @click="isMore.authorships = !isMore.authorships">
                {{ isMore.authorships ? "Less" : "More" }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col  cols="12" md="6" lg="4" xl="33" v-if="myEntityType !== 'works'">
          <v-card rounded flat class="factoid-card">
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

        <v-col  cols="12" md="6" lg="4" xl="3" v-if="myEntityType === 'works'">
          <v-row>
            <v-col cols="12">
              <v-card
                  :to="url.makeFilterRoute(entityType, 'cited_by', data.id)"
                  rounded
                  outlined
                  class="pa-3 text-right button-card"
              >
                <div class="text-h4">{{ data.cited_by_count | toPrecision }}</div>
                <div class="body-2">Incoming citations</div>
              </v-card>
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="6">
              <v-card
                  :to="url.makeFilterRoute(entityType, 'cites', data.id)"
                  rounded
                  outlined
                  class="pa-3 text-right button-card"
              >
                <div class="text-h4">{{ data.referenced_works_count.toLocaleString() }}</div>
                <div class="body-2">References</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card
                  :to="url.makeFilterRoute(entityType, 'related_to', data.id)"
                  rounded
                  outlined
                  class="pa-3 text-right button-card"
              >
                <div class="text-h4">{{ data.related_works?.length }}</div>
                <div class="body-2">Related works</div>
              </v-card>
            </v-col>

          </v-row>
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
import {url} from "@/url";

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
      maxAuthorships: 3,
      url,
      isMore: {
        abstract: false,
        authorships: false,
      }
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
    authorships(){
      if (!this.data?.authorships?.length) return []
      return this.isMore.authorships ?
          this.data.authorships :
          this.data.authorships.slice(0, this.maxAuthorships)
    },
    authorshipsCount(){
      return this.data?.authorships?.length
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
<template>
  <v-container>
    <v-row>
      <v-col cols="12" lg="8" xl="6">
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
          <template v-else-if="myEntityType === 'authors'">
            {{ data.last_known_institutions?.map(i => i.display_name).join(", ") }}
          </template>
          <template v-else-if="myEntityType === 'institutions'">
            {{ getLocationString(data) }}
          </template>
        </div>

        <div v-if="myEntityType === 'works'" class="d-flex mt-4">
          <work-linkouts :data="data"/>
          <entity-ids-menu-item :ids="data.ids"/>
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

          <entity-ids-menu-item v-if="Object.keys(data.ids).length > 1" :ids="data.ids"/>

        </div>


      </v-col>
      <v-col v-if="$vuetify.breakpoint.lgAndUp" lg="4" xl="6" class="pr-8">
        <entity-work-count-cards v-if="myEntityType === 'works'" :data="data" />
          <works-graph
              v-else
              :counts-by-year="data.counts_by_year"
              :works-count="data.works_count"
              :id="data.id"
          />
      </v-col>



    </v-row>

    <v-card rounded flat class="color-3">

      <v-row class="mt-9 px-4">
        <v-col v-if="$vuetify.breakpoint.mdAndDown" lg="4" xl="6" class="pr-8">
        <entity-work-count-cards v-if="myEntityType === 'works'" :data="data" />
          <works-graph
              v-else
              :counts-by-year="data.counts_by_year"
              :works-count="data.works_count"
              :id="data.id"
          />
      </v-col>
        <v-col cols="12" md="6" lg="4" xl="3" v-if="alternateNamesList?.length > 0">
          <v-card rounded flat outlined class="factoid-card" color="">
            <v-card-title>
              Alternate names ({{ alternateNamesList?.length }})
            </v-card-title>
            <v-card-text>
              <v-chip outlined label v-for="name in alternateNamesList" :key="name" class="mr-1 mb-1">
                {{ name }}
              </v-chip>
            </v-card-text>

          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4" xl="3" v-if="abstract">
          <v-card rounded flat class="factoid-card">
            <v-card-title>
              Abstract
            </v-card-title>
            <v-card-text>
              {{ abstract | truncate(isMore.abstract ? 9999999999 : 200) }}
            </v-card-text>
            <v-card-actions class="white">
              <v-btn text rounded small @click="isMore.abstract = !isMore.abstract">
                {{ isMore.abstract ? "Less" : "More" }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4" xl="3" v-if="authorshipsCount">
          <v-card rounded flat class="factoid-card">
            <v-card-title>
              Authors ({{ authorshipsCount }})
            </v-card-title>
            <v-list color="color-2">
              <entity-work-author
                  v-for="(authorship, i) in authorships"
                  :key="i"
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
        <v-col cols="12" md="6" lg="4" xl="33" v-if="myEntityType !== 'works'">
          <v-card rounded flat outlined class="factoid-card" color="">
            <v-card-title>
              Metrics
            </v-card-title>
            <v-divider/>
            <v-simple-table dense style=";">
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

        <v-col cols="12" md="6" lg="4" xl="33" v-if="data.affiliations?.length">
          <v-card rounded flat class="factoid-card">
            <v-card-title>
              Affiliations ({{ data.affiliations.length }})
            </v-card-title>
            <v-list color="color-2">
              <v-list-item
                  :to="affil.institution.id | entityZoomLink"
                  v-for="(affil, i) in data.affiliations.slice(0, (isMore.affiliations ? 9999 : 3))"
                  :key="i"
              >
                <v-list-item-icon>
                  <v-icon>mdi-town-hall</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ affil.institution.display_name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <template v-if="affil.years.length === 1">
                      {{ affil.years[0] }}
                    </template>
                    <template v-else>
                      {{ affilYearsRangeStr(affil) }}
                    </template>
                  </v-list-item-subtitle>

                </v-list-item-content>

              </v-list-item>
            </v-list>
            <v-card-actions v-if="data.affiliations.length > 3">
              <v-btn text rounded small @click="isMore.affiliations = !isMore.affiliations">
                {{ isMore.affiliations ? "Less" : "More" }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

<!--        <v-col v-if="$vuetify.breakpoint.mdAndDown && myEntityType === 'works' "  cols="12" md="6" lg="4" xl="3" >-->
<!--          <entity-work-count-cards :data="data" />-->
<!--        </v-col>-->


      </v-row>
    </v-card>
  </v-container>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getEntityConfig, getLocationString} from "@/entityConfigs";
import {entityTypeFromId, unravel} from "@/util";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import IdList from "@/components/IdList.vue";
import EntityWorkAuthor from "@/components/Entity/EntityWorkAuthor.vue";
import WorkLinkouts from "@/components/WorkLinkouts.vue";
import EntityIdsMenuItem from "@/components/Entity/EntityIdsMenuItem.vue";
import {url} from "@/url";
import WorksGraph from "@/components/WorksGraph.vue";
import EntityWorkCountCards from "@/components/Entity/EntityWorkCountCards.vue";

export default {
  name: "Template",
  components: {
    LinkEntityRolesList,
    IdList,
    EntityWorkAuthor,
    WorkLinkouts,
    EntityIdsMenuItem,
    WorksGraph,
    EntityWorkCountCards,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
      maxAuthorships: 3,
      getLocationString,
      url,
      isMore: {
        abstract: false,
        authorships: false,
        affiliations: false,
      }
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myEntityType() {
      return entityTypeFromId(this.data.id)
    },
    myEntityConfig() {
      return getEntityConfig(this.myEntityType)
    },
    alternateNamesString() {
      return this.alternateNamesList.join("; ")
    },
    alternateNamesList() {
      return [
        ...this.data.display_name_alternatives ?? [],
        ...this.data.display_name_acronyms ?? [],
        ...this.data.alternate_titles ?? [],

      ]
    },

    abstract() {
      if (!this.data?.open_access?.is_oa) return
      return unravel(this.data.abstract_inverted_index)
    },
    authorships() {
      if (!this.data?.authorships?.length) return []
      return this.isMore.authorships ?
          this.data.authorships :
          this.data.authorships.slice(0, this.maxAuthorships)
    },
    authorshipsCount() {
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

    affilYearsRangeStr(affil) {
      const years = affil.years.filter(x => !isNaN(x))
      const minYear = Math.min(...years)
      const maXYear = Math.max(...years)
      return `${minYear} - ${maXYear}`
    },


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
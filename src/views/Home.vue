<template>
  <div class="home">

    <v-container style="min-height: 75vh;" class="d-flex align-center">
      <v-row>
        <v-col cols="2" class="hidden-xs-only"></v-col>
        <v-col>
          <v-card flat class="">
            <div class="text-h5 text-center mb-4">Search scholarly works, people, places, and more</div>
            <search-box is-alone-on-page />
            <div class="d-flex justify-center" v-if="0">
              <v-menu offset-y content-class="no-highlight" min-width="150">
                <template v-slot:activator="{on}">
                  <v-btn large v-on="on">
                    I'm feeling lucky
                    <v-icon>mdi-menu-down</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-subheader>View a random entity:</v-subheader>
                  <v-list-item
                      v-for="(config, k) in entityConfigs"
                      :to="`/${config.name}/random`"
                      :key="config.name"
                      class="text-capitalize"
                  >
                    <span class="mr-2">{{config.icon}}</span>
                    {{config.name}}
                  </v-list-item>
                </v-list>
              </v-menu>

            </div>
            <div>
            </div>
          </v-card>

        </v-col>
        <v-col cols="2" class="hidden-xs-only"></v-col>

      </v-row>

    </v-container>



  </div>


</template>

<script>

import axios from "axios";
import {entityConfigs} from "../entityConfigs";
import {mapGetters} from "vuex";

export default {
  name: 'home',
  components: {
  },
  metaInfo: {
    title: "OpenAlex GUI",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      results: [],
      entityConfigs,


    }
  },
  computed: {
    ...mapGetters([
    ]),
  },
  methods: {
    goSearch() {
      // this.$router.push(this.serpUrl)
    }
  },
  beforeMount() {
    // this.doSearch()
    console.log("mounting the home page")
    this.$store.commit("resetSearch")
  },
}
</script>

<style lang="scss">

.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>

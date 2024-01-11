<template>
  <div style="padding-bottom: 150px;">
    <v-container class="">
      <v-row class="above-the-fold flex-column align-center" style="height: 100vh;">
        <v-col cols="3"></v-col>
        <v-col class="flex-grow-0">
          <!-- logo -->
          <v-card color="transparent" flat :height="logoHeight" class="landing-page-logo">
            <img
                src="@/assets/openalex-logo-icon-black-and-white.png"
                class="logo-icon mr-0 colorizable"
            />
            <span
                class="logo-text colorizable"
                :style="'font-size:' + logoHeight * .75 + 'px'"
            >
                OpenAlex
              </span>

          </v-card>
        </v-col>
        <v-col>
          <v-card flat rounded class="color-2 pa-0" max-width="600" style="margin: 0 auto;">
            <div class="pa-5 pb-0 px-6 d-flex align-center">
              Search and analyze the world's research.
              <!--               <vue-typer-->
              <!--                   class="font-weight-bold"-->
              <!--                   :text="textToType"-->
              <!--                   :pre-erase-delay='1000'-->
              <!--               />-->
              <v-spacer></v-spacer>
              <v-btn icon @click="$vuetify.goTo('#learn-more')">
                <v-icon>mdi-information-outline</v-icon>

              </v-btn>

            </div>
            <div class="pa-5">
              <search-bar/>
            </div>

          </v-card>


        </v-col>
        <v-spacer></v-spacer>
        <v-btn text rounded class="mb-3" @click="$vuetify.goTo('#learn-more')">
          <v-icon>mdi-chevron-down</v-icon>
          Learn more
        </v-btn>
      </v-row>

      <!--        <p style="">-->
      <!--          Inspired by the ancient library of Alexandria, OpenAlex catalogs 250M scholarly works, along with their-->
      <!--          citations, authors, institutional affiliations, and more &mdash; and we're 100% free and open source.-->
      <!--        </p>-->

      <v-row class="" id="learn-more">
        <v-col cols="12" lg="4" class="">
          <v-card rounded flat class="color-3">
            <v-card-title>
              <v-icon left color="black">mdi-earth-plus</v-icon>
              Industry-leading coverage
            </v-card-title>
            <v-card-text class="body-1">
              <p>
                We index over <strong>250M</strong> works from 250k sources, with extra coverage of humanities, non-English languages, and the Global South.
              </p>
              <p>
                We link these works to 90M disambiguated authors and 100k institutions, as well as enriching them with
                topic information, SDGs, citation counts, and much more.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn text rounded href="https://help.openalex.org/the-data/entities-overview" target="_blank">
                Coverage stats
                <v-icon right small>mdi-open-in-new</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4" class="">
          <v-card rounded flat class="color-3">
            <v-card-title>
              <v-icon left color="black">mdi-lock-open-variant</v-icon>
              Open, top to bottom
            </v-card-title>
            <v-card-text class="body-1">
              <p>
                Download up to 100k rows at a time from the web; if you need more use our free API or download the whole database. It's all CC0-licensed so you can share and reuse it as you like! And of course all our our source code is open, too.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn text rounded href="https://github.com/ourresearch" target="_blank">
                Code
                <v-icon right small>mdi-open-in-new</v-icon>
              </v-btn>
              <v-btn text rounded href="https://docs.openalex.org/" target="_blank">
                API
                <v-icon right small>mdi-open-in-new</v-icon>
              </v-btn>
              <v-btn text rounded href="https://docs.openalex.org/download-all-data/openalex-snapshot" target="_blank">
                Dataset
                <v-icon right small>mdi-open-in-new</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4" class="">
          <v-card rounded flat class="color-3">
            <v-card-title>
              <v-icon left color="black">mdi-hand-heart</v-icon>
              Sustainably not-for-profit
            </v-card-title>
            <v-card-text class="body-1">
              <p>
                OpenAlex is made by OurResearch, a nonprofit dedicated to making research open. And we've got a decade's experience keeping tools like Unpaywall sustainably open via premium upgrades.
              </p>
              <p>
                Our OpenAlex Premium service gets you upgraded support and higher API limits, and has dozens of subscribers already.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn text rounded href="https://ourresearch.org/" target="_blank">
                OurResearch
                <v-icon right small>mdi-open-in-new</v-icon>
              </v-btn>
              <v-btn text rounded href="https://help.openalex.org/upgrade" target="_blank">
                Upgrade
                <v-icon right small>mdi-open-in-new</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>


      </v-row>

    </v-container>
  </div>


  <!--        <homepage-user-logos/>-->

  <!--        <homepage-selling-points />-->

  <!--        <homepage-testimonials />-->


</template>

<script>

import FilterBar from "@/components/FilterBar/FilterBar.vue";
import SearchBar from "@/components/SearchBar.vue";
import {VueTyper} from 'vue-typer'

export default {
  name: 'home',
  components: {
    SearchBar,
    VueTyper,
  },
  metaInfo: {
    title: "OpenAlex: The open catalog to the global research system",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      userEmail: "",
      errorMsg: "",
      textToType: [
        "the world's research ecosystem",
        "Tim Berners-Lee",
        "Sorbonne",
        "solar power",
        "doi:10.7717/peerj.4375",
      ]
    }
  },
  computed: {
    logoHeight() {
      return 75

      return this.$vuetify.breakpoint.mobile ?
          50 :
          75
    }
  },
  methods: {},
  mounted() {
  },
}
</script>

<style lang="scss" scoped>
.landing-page-logo {

  display: flex;
  align-items: center;
  justify-content: center;

  .logo-icon {
    height: 100%;
  }

  .logo-text {
    margin: 0;
    line-height: 1.2;
    color: #000;
    font-family: Dosis;
    padding-left: .3em;
    font-weight: 500;
  }
}


.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>

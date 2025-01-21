<template>

  <div style="padding-bottom: 0px;">
    <v-container class="">
      <v-row class="above-the-fold flex-column align-center" style="">
        <v-col class="d-flex justify-center align-center">
          <home-content />
        </v-col>
      </v-row>

    </v-container>
  </div>


</template>

<script>

import {VueTyper} from 'vue-typer'
import {mapActions, mapGetters, mapMutations} from "vuex";
import OqlBox from "@/components/OqlBox.vue";
import axios from "axios";
import HomeContent from "@/components/Home/HomeContent.vue";


export default {
  name: 'Home',
  components: {
    OqlBox,
    VueTyper,
    HomeContent,
  },
  metaInfo: {
    title: "OpenAlex: The open catalog to the global research system",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      userEmail: "",
      errorMsg: "",
      natLangQuery: "",
      isNatLangLoading: false,
      textToType: [
        "the research ecosystem.",
        "researchers.",
        "scholarly journals.",
        "research institutions.",
        "citations.",
      ]
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "userSavedSearches",
    ]),
    logoHeight() {
      return 75

      return this.$vuetify.breakpoint.mobile ?
          50 :
          75
    }
  },
  methods: {
    ...mapActions([
      "createSearch",
    ]),
    ...mapActions("search", [
        "createSearch",
    ]),
  },
  mounted() {
    this.$store.commit("user/setActiveSearchId", null)
  },
}
</script>

<style lang="scss" scoped>
.landing-page-logo {
  $logo-link-height: 77px;
  display: flex;
  justify-content: center;

  .logo-icon {
    height: $logo-link-height;
  }

  .logo-text {
    margin: 0;
    line-height: 1.2;
    color: #000;
    font-family: Dosis;
    padding-left: .3em;
    font-size: $logo-link-height * 0.75;
    font-weight: 500;

  }
}
.user-logo-container {
  &.mobile {
    .user-logo {
      height: 30px;

      &.tall {
        height: 35px;
      }

      &.short {
        height: 25px;
      }
    }

  }

  .user-logo {
    height: 50px;
    margin: 20px;
    filter: grayscale(1);
    opacity: .66;

    &.tall {
      height: 70px;
    }

    &.short {
      height: 40px;
    }
  }

}
.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>

<template>
  <v-footer color="#fff" class="site-footer" style=" padding:0 0 100px;">
<!--    <svg style="margin-bottom: 50px;" _ngcontent-vqb-c18="" aria-hidden="true" width="100%" height="8" fill="none"-->
<!--         xmlns="http://www.w3.org/2000/svg">-->
<!--      <pattern _ngcontent-vqb-c18="" id="a" width="91" height="8" patternUnits="userSpaceOnUse">-->
<!--        <g _ngcontent-vqb-c18="" clip-path="url(#clip0_2426_11367)">-->
<!--          <path _ngcontent-vqb-c18=""-->
<!--                d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0"-->
<!--                stroke="#E1E3E1" stroke-linecap="square"></path>-->
<!--        </g>-->
<!--      </pattern>-->
<!--      <rect _ngcontent-vqb-c18="" width="100%" height="100%" fill="url(#a)" style="-->
<!--    display: n;-->
<!--"></rect>-->
<!--    </svg>-->
    <v-container>
      <v-row>
        <v-col cols="12" sm="5" class="">
          <div>
            <img
                src="@/assets/openalex-logo-icon-black-and-white.png"
                class="logo-icon mr-0 colorizable"
                style="height: 35px;"
            />
          </div>
          OpenAlex is a free index of the world's research ecosystem. It's made by <a
            href="https://ourresearch.org">OurResearch</a> with support from

          <a href="https://www.arcadiafund.org.uk/">Arcadia</a>&mdash;a
          charitable fund of Lisbet Rausing and Peter Baldwin.
        </v-col>
        <v-spacer/>
        <v-col
            cols="12"
            sm="2"
            v-for="col in navConfigs"
            :key="col.name"
        >
          <div class=" mb-4">{{ col.name }}</div>
          <div
              v-for="link in col.links"
              :key="link.name"
          >
            <router-link
                v-if="link.to"
                :to="link.to"
            >
              {{ link.name }}
            </router-link>
            <a
                v-if="link.href"
                :href="link.href"
                target="_blank"
            >
              {{ link.name }}
              <v-icon small color="primary">mdi-open-in-new</v-icon>
            </a>
          </div>
        </v-col>

      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
import {navConfigs} from "@/navConfigs";

export default {
  name: "SiteFooter",
  data() {
    return {
      navConfigs,
    }
  }
}
</script>

<style scoped lang="scss">
.site-footer {
  line-height: 1.8;
  //margin-top: 150px;
  border-top: 1px solid #ddd !important;
  padding-top: 50px !important;

  .body-2 {
    font-family: Inconsolata;
  }

  a {
    text-decoration: none;
    //color: #fff;

    &:hover {
      text-decoration: underline;
    }
  }
}

img.site-footer-logo {
  width: 70px;
  opacity: 1;

}
</style>
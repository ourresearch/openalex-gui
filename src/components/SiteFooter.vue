<template>
  <v-footer  color="#fff" class="site-footer" style="padding:0 0 100px; z-index: 1500;">
    <v-container>
      <v-row>
        <v-col cols="12" sm="5" class="">
          <div>
            <img
              src="@/assets/logo-full-small.png"
              class="logo-icon mt-1 mb-2 colorizable"
              style="height: 25px;"
            />
          </div>

          Supported by

          <a href="https://www.arcadiafund.org.uk/">Arcadia, </a> 
           <a href="https://www.navigation.org/">The Navigation Fund, </a> 
           and <a href="https://wellcome.org/">The Wellcome Trust</a>.
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
            </a>
          </div>
        </v-col>

      </v-row>
    </v-container>
  </v-footer>
</template>


<script setup>
import {navConfigs} from "@/navConfigs";

defineOptions({ name: 'SiteFooter' });
</script>


<style scoped lang="scss">
.site-footer {
  line-height: 1.8;
  //margin-top: 150px;
  //border-top: 1px solid #ddd !important;
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
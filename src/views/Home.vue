<template>
  <div style="padding-bottom: 0px;">
    <v-container>
      <v-row class="above-the-fold flex-column align-center" style="height: calc(100vh - 70px);">
        <v-col cols="3" style="margin-bottom: -3px"></v-col>
        <v-col>
          <div style="max-width: 800px; margin: 0 auto;" class="d-flex">
            <div class="flex-grow-1">
              <div class="text-h5 ml-3 mb-3">
                Search and analyze the world's research.
              </div>
              <shortcut-box :show-examples="true" :autofocus="true" />
            </div>
          </div>
        </v-col>
        <v-spacer></v-spacer>
        
        <v-btn id="learn-more" text rounded elevation="0" style="" class="mb-3" @click="scrollToLearnMore">
          <v-icon>mdi-chevron-down</v-icon>
          Learn more
        </v-btn>
        
      </v-row>
    </v-container>

    
    <v-divider />
    <div class="color-3 lighten-5 py-4 mb-12">
      <div class="text-center body-2 grey--text pb-2">
        Trusted by hundreds of institutions worldwide, including
      </div>
      <div class="d-flex align-center justify-center flex-wrap user-logo-container" :class="{ mobile: isMobile }">
        <img class="user-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Logo_of_Sorbonne_University.svg/320px-Logo_of_Sorbonne_University.svg.png" alt="">
        <img class="user-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Grammarly_logo.svg/320px-Grammarly_logo.svg.png" alt="">
        <img class="user-logo tall" src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/American_Chemical_Society_logo.svg/240px-American_Chemical_Society_logo.svg.png" alt="">
        <img class="user-logo short" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Logo_EPFL_2019.svg/320px-Logo_EPFL_2019.svg.png" alt="">
        <img class="user-logo tall" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Logo_Bayer.svg/240px-Logo_Bayer.svg.png" alt="">
        <img class="user-logo" src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Jisc_logo.png" alt="">
        <img class="user-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Chan_Zuckerberg_Initiative.svg/320px-Chan_Zuckerberg_Initiative.svg.png" alt="">
      </div>
    </div>

    <v-container>
      <v-row>
        <v-col cols="12" lg="4">
          <v-card rounded flat class="color-3 fill-height d-flex flex-column">
            <v-card-title class="color-2 mb-3">
              <v-icon left color="black" icon="mdi-earth-plus"></v-icon>
              Industry-leading coverage
            </v-card-title>
            <v-card-text class="body-1 flex-grow-1">
              <p>
                We index over <strong>250M</strong> scholarly works from 250k sources, with extra coverage of
                humanities, non-English languages, and the Global South.
              </p>
              <p>
                We link these works to 90M disambiguated authors and 100k institutions, as well as enriching them with
                topic information, SDGs, citation counts, and much more.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text rounded href="https://help.openalex.org" target="_blank">
                <v-icon left icon="mdi-chart-bar"></v-icon>
                About the data
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card rounded flat class="color-3 fill-height d-flex flex-column">
            <v-card-title class="color-2 mb-3">
              <v-icon left color="black" icon="mdi-lock-open-variant"></v-icon>
              Open, top to bottom
            </v-card-title>
            <v-card-text class="body-1 flex-grow-1">
              <p>
                Export all your search results for free. For more flexibility use our API or even download the whole
                dataset. It's all CC0-licensed so you can share and reuse it as you like!
              </p>
              <p>
                Want to see how it works? 100% of our source code is open, too.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text rounded href="https://docs.openalex.org/" target="_blank">
                <v-icon left icon="mdi-cog-outline"></v-icon>
                API
              </v-btn>
              <v-btn text rounded href="https://docs.openalex.org/download-all-data/openalex-snapshot" target="_blank">
                <v-icon left icon="mdi-database-outline"></v-icon>
                Data
              </v-btn>
              <v-btn text rounded href="https://github.com/ourresearch" target="_blank">
                <v-icon left icon="mdi-code-braces"></v-icon>
                Code
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card rounded flat class="color-3 fill-height d-flex flex-column">
            <v-card-title class="color-2 mb-3">
              <v-icon left color="black" icon="mdi-hand-heart"></v-icon>
              Sustainably not-for-profit
            </v-card-title>
            <v-card-text class="body-1 flex-grow-1">
              <p>
                OpenAlex is made by OurResearch, a nonprofit dedicated to making research open. And we've got a
                decade's experience keeping tools like Unpaywall sustainably open with a freemium business model.
              </p>
              <p>
                If you'd like to upgrade your OpenAlex experience, check our our Premium subscription.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text rounded href="https://ourresearch.org/" target="_blank">
                <v-icon left icon="mdi-account-multiple-outline"></v-icon>
                About us
              </v-btn>
              <v-btn text rounded href="https://help.openalex.org/pricing" target="_blank">
                <v-icon left icon="mdi-diamond-stone"></v-icon>
                Upgrade
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import ShortcutBox from "@/components/ShortcutBox.vue";

const { xs, smAndDown } = useDisplay();
const isMobile = computed(() => xs.value || smAndDown.value);

const scrollToLearnMore = () => {
  const element = document.getElementById('learn-more');
  if (element) element.scrollIntoView({ behavior: 'smooth' , inline: 'start', block: 'start'});
};
</script>

<style lang="scss" scoped>
.v-application .v-card-actions .v-btn {
    margin-left: 8px;
}

.v-application .v-card-actions>.v-btn.v-btn .v-icon--left {
    margin-left: 4px;
}


.v-icon[left] {
    margin-right: 8px;
}
.v-divider {
  border-color: rgba(0, 0, 0, .12);
    display: block;
    flex: 1 1 0px;
    max-width: 100%;
    height: 1px;
    max-height: 0;
    border: solid;
    border-width: thin 0 0 0;
    transition: inherit;
    overflow: visible;
    width: 100%;
}

.v-card-title {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    font-size: 1.25rem;
    font-weight: 500;
    letter-spacing: .0125em;
    line-height: 2rem;
    word-break: break-all;
    padding: 16px;
}

body .v-application .v-card--rounded {
    border-radius: 15px !important;
}

#learn-more{
  scroll-margin-top: 15px;
}
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

.v-application p {
    margin-bottom: 16px;
} 

.theme--light.v-card {
  background-color: #fff;
  color: rgba(0,0,0,.87)
}
.v-card .v-card-text {
  line-height: 24px;
}

.v-theme--light .v-card-text {
    color: rgba(0,0,0,.6);
    
    
}
.v-icon.v-icon {
    align-items: center;
    display: inline-flex;
    font-feature-settings: "liga";
    font-size: 24px;
    justify-content: center;
    letter-spacing: normal;
    line-height: 1;
    /* position: relative; */
    text-indent: 0;
    transition: .3s cubic-bezier(.25,.8,.5,1), visibility 0s;
    vertical-align: middle;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}

.v-card-actions .v-icon.v-icon{
    font-size: 18px;
    height: 18px;
    width: 18px;
}

.v-card__title {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    font-size: 1.25rem;
    font-weight: 500;
    letter-spacing: .0125em;
    line-height: 2rem;
    word-break: break-all;
}

// .above-the-fold {
//   /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
//   //background: linear-gradient(0deg, #eee 20%, #fff 20%);
// }


</style>

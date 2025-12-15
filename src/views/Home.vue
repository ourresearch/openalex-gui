<template>
  <div class="pb-0 bg-white">
    <div class="container mx-auto px-4">
      <div class="flex flex-col items-center justify-center" style="height: calc(100vh - 65px);">
        <div class="flex-1"></div>
        
        <div class="w-full max-w-[800px] mx-auto">
          <div class="flex-1">
            <div class="text-xl md:text-2xl font-bold ml-3 mb-3">
              Search and analyze the world's research.
            </div>
            <shortcut-box show-examples autofocus />
          </div>
        </div>

        <div class="flex-1"></div>
        
        <Button variant="ghost" class="mb-3" @click="scrollToLearnMore">
          <ChevronDown class="h-4 w-4 mr-1" />
          Learn more
        </Button>
      </div>
    </div>
    
    <Separator id="learn-more" />
    
    <div class="bg-white py-4 mb-12">
      <div class="text-center text-sm text-muted-foreground pb-2">
        Trusted by hundreds of institutions worldwide, including
      </div>
      <div class="flex items-center justify-center flex-wrap user-logo-container"
           :class="{mobile: smAndDown}">
        <img class="user-logo"
             src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Logo_of_Sorbonne_University.svg/320px-Logo_of_Sorbonne_University.svg.png"
             alt="">
        <img class="user-logo tall"
             src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/American_Chemical_Society_logo.svg/240px-American_Chemical_Society_logo.svg.png"
             alt="">
        <img class="user-logo short"
             src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Logo_EPFL_2019.svg/320px-Logo_EPFL_2019.svg.png"
             alt="">
        <img class="user-logo" src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Jisc_logo.png" alt="">
        <img class="user-logo"
             src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Chan_Zuckerberg_Initiative.svg/320px-Chan_Zuckerberg_Initiative.svg.png"
             alt="">
      </div>
    </div>

    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card class="flex flex-col">
          <CardHeader class="bg-secondary">
            <CardTitle class="flex items-center gap-2">
              <Globe class="h-5 w-5" />
              Industry-leading coverage
            </CardTitle>
          </CardHeader>
          <CardContent class="flex-1 pt-4">
            <p class="mb-4">
              We index over <strong>250M</strong> scholarly works from 250k sources, with extra coverage of
              humanities, non-English languages, and the Global South.
            </p>
            <p>
              We link these works to 90M disambiguated authors and 100k institutions, as well as enriching them with
              topic information, SDGs, citation counts, and much more.
            </p>
          </CardContent>
          <CardFooter class="justify-end">
            <Button variant="ghost" as="a" href="https://help.openalex.org" target="_blank">
              <BarChart3 class="h-4 w-4 mr-2" />
              About the data
            </Button>
          </CardFooter>
        </Card>

        <Card class="flex flex-col">
          <CardHeader class="bg-secondary">
            <CardTitle class="flex items-center gap-2">
              <Unlock class="h-5 w-5" />
              Open, top to bottom
            </CardTitle>
          </CardHeader>
          <CardContent class="flex-1 pt-4">
            <p class="mb-4">
              Export all your search results for free. For more flexibility use our API or even download the whole
              dataset. It's all CC0-licensed so you can share and reuse it as you like!
            </p>
            <p>
              Want to see how it works? 100% of our source code is open, too.
            </p>
          </CardContent>
          <CardFooter class="justify-end gap-2">
            <Button variant="ghost" as="a" href="https://docs.openalex.org/" target="_blank">
              <Settings class="h-4 w-4 mr-2" />
              API
            </Button>
            <Button variant="ghost" as="a" href="https://docs.openalex.org/download-all-data/openalex-snapshot" target="_blank">
              <Database class="h-4 w-4 mr-2" />
              Data
            </Button>
            <Button variant="ghost" as="a" href="https://github.com/ourresearch" target="_blank">
              <Code class="h-4 w-4 mr-2" />
              Code
            </Button>
          </CardFooter>
        </Card>

        <Card class="flex flex-col">
          <CardHeader class="bg-secondary">
            <CardTitle class="flex items-center gap-2">
              <Heart class="h-5 w-5" />
              Sustainably not-for-profit
            </CardTitle>
          </CardHeader>
          <CardContent class="flex-1 pt-4">
            <p class="mb-4">
              OpenAlex is made by OurResearch, a nonprofit dedicated to making research open. And we've got a
              decade's experience keeping tools like Unpaywall sustainably open with a freemium business model.
            </p>
            <p>
              If you'd like to upgrade your OpenAlex experience, check our our Premium subscription.
            </p>
          </CardContent>
          <CardFooter class="justify-end gap-2">
            <Button variant="ghost" as="a" href="https://ourresearch.org/" target="_blank">
              <Users class="h-4 w-4 mr-2" />
              About us
            </Button>
            <Button variant="ghost" as="a" href="https://help.openalex.org/pricing" target="_blank">
              <Gem class="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>


<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import { useBreakpoints } from '@/composables/useBreakpoints';

import { 
  ChevronDown, Globe, BarChart3, Unlock, Settings, Database, 
  Code, Heart, Users, Gem 
} from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import ShortcutBox from "@/components/ShortcutBox.vue";

const store = useStore();
const { smAndDown } = useBreakpoints();

useHead({
  title: 'OpenAlex: The open catalog to the global research system',
  titleTemplate: undefined
});

function scrollToLearnMore() {
  const element = document.getElementById('learn-more');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

onMounted(() => {
  store.commit("user/setActiveSearchId", null);
});
</script>

<style scoped>
.user-logo-container.mobile .user-logo {
  height: 30px;
}
.user-logo-container.mobile .user-logo.tall {
  height: 35px;
}
.user-logo-container.mobile .user-logo.short {
  height: 25px;
}
.user-logo {
  height: 50px;
  margin: 20px;
  filter: grayscale(1);
  opacity: 0.66;
}
.user-logo.tall {
  height: 70px;
}
.user-logo.short {
  height: 40px;
}
</style>
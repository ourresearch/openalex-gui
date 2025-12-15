<template>
  <footer class="bg-white border-t border-border pt-12 pb-24 z-[1500]">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 sm:col-span-5">
          <div>
            <img
              src="@/assets/tricon.png"
              class="h-6 mt-1 mb-2"
              alt="OpenAlex"
            />
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Supported by
            <a href="https://www.arcadiafund.org.uk/" class="text-primary hover:underline">Arcadia</a>, 
            <a href="https://www.navigation.org/" class="text-primary hover:underline">The Navigation Fund</a>, 
            and <a href="https://wellcome.org/" class="text-primary hover:underline">The Wellcome Trust</a>.
          </p>
        </div>
        <div class="hidden sm:block sm:col-span-1"></div>
        <div
          class="col-span-12 sm:col-span-2"
          v-for="col in navConfigs"
          :key="col.name"
        >
          <div class="text-sm font-medium mb-4">{{ col.name }}</div>
          <div
            v-for="link in col.links"
            :key="link.name"
            class="text-sm text-muted-foreground leading-relaxed"
          >
            <router-link
              v-if="link.to"
              :to="link.to"
              class="hover:underline hover:text-foreground"
            >
              {{ link.name }}
            </router-link>
            <a
              v-if="link.href"
              :href="link.href"
              target="_blank"
              class="hover:underline hover:text-foreground"
            >
              {{ link.name }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>


<script setup>
import {navConfigs} from "@/navConfigs";

defineOptions({ name: 'SiteFooter' });
</script>


<style scoped>
/* Minimal scoped styles */
</style>
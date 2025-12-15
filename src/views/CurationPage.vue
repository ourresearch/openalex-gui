<template>
  <div class="py-0 sm:py-12 min-h-[70vh]" ref="scrollContainer">
    <div class="container mx-auto px-0 sm:px-4 max-w-[900px]">
      <h1 class="text-3xl font-bold mb-2">
        Unpaywall Curation
      </h1>

      <p class="text-base text-muted-foreground mb-8">
        Submit curation requests to Unpaywall. Changes will show up within two days.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <router-link to="/curate/works" class="block">
          <Card class="p-4 flex items-center bg-blue-500 hover:bg-blue-400 transition-colors cursor-pointer text-white">
            <FileText class="h-10 w-10 ml-3 mr-3 text-blue-100" />
            <div>
              <CardTitle class="text-[28px] mb-0 text-white">
                Works
              </CardTitle>
              <p class="text-base opacity-90">Correct Open Access links and licenses</p>
            </div>
          </Card>
        </router-link>

        <router-link to="/curate/sources" class="block">
          <Card class="p-4 flex items-center bg-blue-500 hover:bg-blue-400 transition-colors cursor-pointer text-white">
            <BookOpen class="h-10 w-10 ml-3 mr-3 text-blue-100" />
            <div>
              <CardTitle class="text-[28px] mb-0 text-white">
                Sources
              </CardTitle>
              <p class="text-base opacity-90">Correct Open Access status</p>
            </div>
          </Card>
        </router-link>
      </div>
    </div>
  </div>
</template>


<script setup>
import { FileText, BookOpen } from 'lucide-vue-next';

import { Card, CardTitle } from '@/components/ui/card';
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>

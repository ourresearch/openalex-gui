<template>
  <div>
    <h1 class="text-xl font-bold mb-6">Tags</h1>
    
    <Card class="bg-white">
      <CardContent class="text-center py-12">
        <Tag class="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <div class="text-lg text-muted-foreground">Coming soon...</div>
        <div class="text-sm text-muted-foreground mt-2">
          Manage your custom tags for organizing works and entities.
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue';

import { Tag } from 'lucide-vue-next';

import { Card, CardContent } from '@/components/ui/card';

defineOptions({ name: 'MeTags' });

useHead({ title: 'Tags' });
</script>

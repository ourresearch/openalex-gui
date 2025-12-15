<template>
  <div class="container mx-auto px-4 flex items-center justify-center min-h-[90vh]">
    <Card class="p-6 rounded-xl max-w-[560px]">
      <div class="text-center mb-4">
        <FlaskConical class="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 class="text-2xl font-bold">OpenAlex Analytics Alpha Testing</h1>
      </div>
      <Separator class="mb-4" />
      <div class="text-muted-foreground">
        <p>
          OpenAlex Analytics is currently available to invited alpha testers.
          If you'd like to request an invitation, please send an email to
          <span class="font-medium text-primary">
            <a href="mailto:brett@ourresearch.org">brett@ourresearch.org</a>
          </span>
          including:
        </p>
        <ul class="pl-6 mt-5 space-y-3">
          <li>A short description of your work, role, and what you hope OpenAlex Analytics can help you with.</li>
          <li>The email address associated with your OpenAlex account.</li>
        </ul>
      </div>
    </Card>
  </div>
</template>


<script setup>
import { FlaskConical } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

defineOptions({
  name: 'AnalyticsTesting',
});
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
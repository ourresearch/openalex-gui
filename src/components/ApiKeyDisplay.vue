<template>
  <div 
    v-if="apiKey" 
    class="inline-flex items-center cursor-pointer group"
    @click="copyToClipboard"
  >
    <code class="font-mono text-base text-foreground bg-transparent p-0 select-all">{{ apiKey }}</code>
    <Copy class="h-3 w-3 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
  </div>
  <span v-else class="text-muted-foreground">—</span>
</template>

<script setup>
import { useStore } from 'vuex';
import { Copy } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast';

defineOptions({ name: 'ApiKeyDisplay' });

const props = defineProps({
  apiKey: {
    type: String,
    default: null
  }
});

const store = useStore();
const { toast } = useToast();

async function copyToClipboard() {
  if (!props.apiKey) return;
  
  try {
    await navigator.clipboard.writeText(props.apiKey);
    toast({ title: 'API key copied to clipboard' });
  } catch (err) {
    console.error('Failed to copy:', err);
    toast({ title: 'Failed to copy API key', variant: 'destructive' });
  }
}
</script>

<style scoped>
/* Minimal scoped styles */
</style>

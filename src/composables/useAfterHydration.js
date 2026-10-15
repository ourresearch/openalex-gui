// oxjob #1689 Nuxt trial: a ref that is false on the server and during hydration,
// true after mount (and immediately true on client-rendered SPA routes).
import { ref, onMounted } from 'vue';
import { hasBrowser, isHydrating } from '@/utils/env';

export function useAfterHydration() {
  const ready = ref(hasBrowser && !isHydrating());
  if (!ready.value) onMounted(() => { ready.value = true; });
  return ready;
}

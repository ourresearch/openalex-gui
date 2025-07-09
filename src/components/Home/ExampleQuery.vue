<template>
  <v-card rounded="xl" flat class="example-query fill-height d-flex flex-column py-3 px-4">
    <div class="text-body-1 text-weight-bold mb-4 question-link" @click="handleQueryClick(query)">
      {{ question }}
    </div>
    <div v-if="error" style="margin: 0 20px 10px;">``
      <b>Error:</b> {{ error }}
    </div>
    <v-spacer />
    <div>
      <v-chip 
        v-for="(label, index) in [['type', type], ['category', category]]"
        :key="index"
        label
        size="small"
        variant="tonal"
        @click="emit('set-filter', { [label[0]]: label[1] })" 
        :color="chipColor(label[1])"
      >
        <b>{{label[1]}}</b>
      </v-chip>
    </div>
  </v-card>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import filters from '@/filters';

defineOptions({ name: 'ExampleQuery' });

defineProps({
  question: String,
  type: String,
  category: String,
  error: String,
  query: Object
});

const emit = defineEmits(['set-filter']);

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);
const createSearchFromQuery = (query) => store.dispatch('search/createSearchFromQuery', query);

const chipColor = (category) => {
  const colors = {
    works: 'catBlueDark',
    authors: 'catGreenDark',
    sources: 'catTealDark',
    institutions: 'catPurpleDark',
    topics: 'catTealDark',
    sdgs: 'catRedDark',
    funders: 'catBlueDark',
    keywords: 'catGreenDark',
    fields: 'catOrangeDark',
    countries: 'catPurpleDark',
    discovery: 'catRedDark',
    metrics: 'catRedDark',
    compliance: 'catBlueDark',
    'trend detection': 'catTealDark',
    'expert discovery': 'catPurpleDark',
    'open access': 'catPurpleDark',
    recommenders: 'catTealDark',
    rankings: 'catRedDark',
    collaboration: 'catBlueDark'
  };

  return colors[category] || 'primary';
};

const handleQueryClick = (query) => {
  if (!userId.value) {
    router.push({
      name: 'Login',
      query: { redirect: '/analytics' }
    });
    return;
  }
  createSearchFromQuery(query);
};
</script>


<style lang="scss" scoped>

.v-card__title {
  padding-bottom: 10px;
}
.question-link {
  text-decoration: none;
  word-break: normal;
  line-height: 1.6rem;
  font-size: 16px;
  cursor: pointer;
}
.v-card__actions {
  padding: 0px 15px 15px 15px;
  /*background-color: $color-3;*/
}
.v-chip {
  margin-right: 6px;
} 
.v-chip.v-chip--outlined.v-chip.v-chip {
  background-color: white !important;
}
</style>
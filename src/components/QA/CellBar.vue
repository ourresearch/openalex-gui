<template>

  <div class="cell-bar d-flex">
    <div class="bg-blue-grey" :style="{ width: percent + '%', height: '24px' }">
      <div v-if="percent > 50" class="mr-2 text-caption text-white text-right d-flex align-center justify-end" style="height: 100%;">
        {{ percent }}%
      </div>  
    </div>
    <div class="bg-grey-lighten-2" :style="{ width: 100 - percent + '%', height: '24px' }">
      <div v-if="percent <= 50" class="ml-2 text-caption text-left d-flex align-center justify-start" style="height: 100%;">
        {{ percent }}%
      </div>                      
    </div>
  </div>
</template>


<script setup>

defineOptions({
  name: 'CellBar'
});

defineProps({
  percent: {
    type: Number,
    required: true
  }
});

</script>

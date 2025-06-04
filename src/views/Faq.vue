<template>
<v-container class="page">
  <h3 class="text-h3">FAQ</h3>

  <h6 id="sources" class="text-h6 font-weight-bold">What are your sources?</h6>
  <p>
    Answer!
  </p>

  <h6 id="coverage-compared-to-mag" class="text-h6 font-weight-bold">How does your coverage compare to that of Microsoft Academic Graph (MAG)?</h6>
  <p>
    Answer!
  </p>

  <h6 id="requester-pays" class="text-h6 font-weight-bold">If this is open data, why do I have to pay $10 to download it?</h6>
  <p>
    Answer!
  </p>
  <h6 id="sustainability" class="text-h6 font-weight-bold">How is this project sustainable?</h6>
  <p>
    Answer!
  </p>




</v-container>
</template>

<script>
import { useHead } from '@unhead/vue';

export default {
  name: "Faq",
  created() {
    useHead({ title: 'FAQ' });
  }
}
</script>

<style scoped>

</style>
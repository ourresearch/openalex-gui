<template>
  <div>
    <v-menu offset-y>
      <template v-slot:activator="{ on }">
        <v-btn icon v-on="on">
          <v-icon>mdi-monitor-dashboard</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(option, index) in uiOptions"
          :key="index"
          class="ui-variant-option"
          @click="setUiVariant(option.value)"
        >
          <v-list-item-icon v-if="uiVariant === option.value">
            <v-icon color="primary">mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-icon v-else class="invisible-icon">
            <v-icon>mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ option.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex';

export default {
  name: 'UiVariantSelector',
  data() {
    return {
      uiOptions: [
        { value: null, text: 'Top Columns' },
        { value: 'sentence', text: 'Sentence (Entity First)' },
        { value: 'sentence-worksfirst', text: 'Sentence (Works First)' },
        { value: 'side', text: 'Side (Entity First)' },
        { value: 'worksfirst', text: 'Side (Works First)' }
      ]
    };
  },
  computed: {
    ...mapState(['uiVariant'])
  },
  methods: {
    ...mapMutations(['setUiVariant'])
  }
};
</script>

<style scoped>
.ui-variant-option {
  cursor: pointer;
  padding: 0px 15px;
}
.invisible-icon {
  opacity: 0;
}
</style>
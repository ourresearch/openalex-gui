<template>
  <div class="discover-search-box" :class="{ compact }">
    <div class="search-container">
      <v-textarea
        v-model="localValue"
        :placeholder="placeholder"
        :rows="compact ? 2 : 3"
        auto-grow
        :max-rows="6"
        variant="outlined"
        hide-details
        class="search-textarea"
        @keydown="handleKeydown"
      />
      <v-btn
        :icon="true"
        color="primary"
        class="submit-btn"
        :loading="loading"
        :disabled="!localValue?.trim()"
        @click="submit"
      >
        <v-icon>mdi-arrow-up</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

defineOptions({ name: 'DiscoverSearchBox' });

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: 'Describe what you\'re looking for...',
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const localValue = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal;
});

function handleKeydown(event) {
  // Submit on Enter (without Shift for newline)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
}

function submit() {
  if (!localValue.value?.trim()) return;
  emit('update:modelValue', localValue.value);
  emit('submit', localValue.value);
}
</script>

<style lang="scss" scoped>
.discover-search-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-container {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-textarea {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.v-input__control) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.v-field) {
    flex: 1;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    padding-right: 56px;
    background: #fff;

    &:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &.v-field--focused {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
  }

  :deep(.v-field__field) {
    flex: 1;
  }

  :deep(.v-field__outline) {
    --v-field-border-width: 1px;
    color: #E5E7EB;
  }

  :deep(.v-field--focused .v-field__outline) {
    --v-field-border-width: 2px;
    color: #1A1A1A;
  }

  :deep(textarea) {
    font-size: 15px;
    line-height: 1.5;
    color: #1A1A1A;

    &::placeholder {
      color: #9CA3AF;
    }
  }
}

.submit-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 40px;
  height: 40px;
  min-width: 40px;
}

.compact {
  .search-textarea {
    :deep(.v-field) {
      border-radius: 12px;
    }
  }
}
</style>

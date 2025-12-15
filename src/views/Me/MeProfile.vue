<template>
  <div>
    <h1 class="text-xl font-bold mb-6">Profile</h1>
    <SettingsSection title="Profile">
      <SettingsRow
        label="Name"
        description="Your display name"
      >
        <Input
          v-model="editableName"
          type="text"
          class="w-[200px]"
          placeholder="Enter your name"
          @blur="saveName"
          @keydown.enter="$event.target.blur()"
        />
      </SettingsRow>

      <SettingsRow
        label="Email"
        description="Your account email address"
      >
        <span class="text-sm">{{ userEmail || '—' }}</span>
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="Account">
      <SettingsRow
        label="Sign out"
        description="Sign out of your OpenAlex account"
      >
        <Button
          variant="ghost"
          @click="logout"
        >
          Sign out
        </Button>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'MeAbout' });

useHead({ title: 'About' });

const store = useStore();
const router = useRouter();

const userName = computed(() => store.state.user.name);
const userEmail = computed(() => store.state.user.email);

const editableName = ref(userName.value || '');

watch(userName, (newVal) => {
  editableName.value = newVal || '';
});

const saveName = async () => {
  const trimmedName = editableName.value.trim();
  if (trimmedName && trimmedName !== userName.value) {
    await store.dispatch('user/updateName', trimmedName);
  } else if (!trimmedName) {
    editableName.value = userName.value || '';
  }
};

const logout = () => {
  store.commit('user/logout');
  store.commit('snackbar', "You're logged out");
  router.push('/');
};
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>

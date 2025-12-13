<template>
  <div>
    <SettingsSection title="Profile">
      <SettingsRow
        label="Name"
        description="Your display name"
      >
        <input
          v-model="editableName"
          type="text"
          class="settings-text-input"
          placeholder="Enter your name"
          @blur="saveName"
          @keydown.enter="$event.target.blur()"
        />
      </SettingsRow>

      <SettingsRow
        label="Email"
        description="Your account email address"
      >
        <span class="text-body-2">{{ userEmail || '—' }}</span>
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="Account">
      <SettingsRow
        label="Sign out"
        description="Sign out of your OpenAlex account"
      >
        <v-btn
          variant="text"
          class="settings-action"
          @click="logout"
        >
          Sign out
        </v-btn>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
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
.settings-text-input {
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  background: #FFFFFF;
  color: #1A1A1A;
  min-width: 200px;
  outline: none;
  transition: border-color 0.15s;
}

.settings-text-input:hover {
  border-color: #D0D0D0;
}

.settings-text-input:focus {
  border-color: #1A1A1A;
}

.settings-text-input::placeholder {
  color: #9CA3AF;
}
</style>

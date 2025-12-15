<template>
  <div class="flex items-center">
    <!-- User account menu -->
    <DropdownMenu v-if="userId">
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" class="rounded-full">
          <Avatar class="h-8 w-8">
            <AvatarFallback :style="{ backgroundColor: avatarColor }" class="text-white text-sm font-medium">
              {{ userInitial }}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuLabel>{{ userName }}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem as="router-link" to="/settings">
          <Settings class="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem v-if="isAdmin" as="router-link" to="/admin">
          <Crown class="mr-2 h-4 w-4" />
          Admin
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="logout">
          <LogOut class="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <div v-else>
      <!-- Login / Sign up links-->
      <template v-if="smAndDown">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon">
              <Menu class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuItem as="router-link" to="/signup">
              <UserPlus class="mr-2 h-4 w-4" />
              <div>
                <div class="font-medium">Sign Up</div>
                <div class="text-xs text-muted-foreground">Create a new account</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem as="router-link" to="/login">
              <LogIn class="mr-2 h-4 w-4" />
              <div>
                <div>Log In</div>
                <div class="text-xs text-muted-foreground">Access your existing account</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem as="a" href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
              <MessageCircleQuestion class="mr-2 h-4 w-4" />
              Contact support
            </DropdownMenuItem>
            <DropdownMenuItem as="a" href="https://help.openalex.org/" target="_blank">
              <HelpCircle class="mr-2 h-4 w-4" />
              Visit help center
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
      <template v-else>
        <Button variant="ghost" as="router-link" to="/login">
          Log In
        </Button>
        <Button variant="ghost" as="router-link" to="/signup">
          Sign Up
        </Button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useBreakpoints } from '@/composables/useBreakpoints';

import { 
  Settings, Crown, LogOut, Menu, UserPlus, LogIn, 
  MessageCircleQuestion, HelpCircle 
} from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

defineOptions({ name: 'UserToolbarMenu' });

const store = useStore();

const { smAndDown } = useBreakpoints();

const userId = computed(() => store.getters['user/userId']);
const userName = computed(() => store.getters['user/userName']);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const userEmail = computed(() => store.getters['user/userEmail']);

const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

const userInitial = computed(() => {
  if (userName.value) return userName.value.charAt(0).toUpperCase();
  if (userEmail.value) return userEmail.value.charAt(0).toUpperCase();
  return '?';
});

const avatarColor = computed(() => {
  const str = userId.value || userEmail.value || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
});

const logout = () => {
  store.dispatch('user/logout');
};
</script>


<style scoped>
/* Minimal scoped styles */
</style>
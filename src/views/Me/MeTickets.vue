<template>
  <!-- My Tickets list (oxjob #823) — the read half of the support-portal
       wrapper. users-api proxies Zendesk live, so a just-filed ticket shows
       up immediately; the user never touches Zendesk. -->
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h5 font-weight-bold">Support requests</h1>
      <v-spacer />
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-plus"
        @click="showNewRequest = true"
      >
        New request
      </v-btn>
    </div>

    <!-- New request dialog (#823 follow-up): the same form as /support, filed
         without leaving the list. The v-if remounts the form on each open so a
         filed state doesn't linger into the next open (an unsent draft still
         survives — the form persists it to localStorage). -->
    <v-dialog v-model="showNewRequest" max-width="720">
      <v-card rounded="lg" class="new-request-card">
        <v-card-text class="pa-8">
          <div class="d-flex align-start">
            <div>
              <h2 class="nr-title">Contact support</h2>
              <p class="nr-intro">
                Found a problem in the data, or stuck on something? Send us a note and
                we'll take a look.
              </p>
            </div>
            <v-spacer />
            <v-btn
              icon
              variant="text"
              size="small"
              aria-label="Close"
              @click="showNewRequest = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <support-request-form v-if="showNewRequest" @filed="onFiled" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-card flat variant="outlined" class="bg-white">
      <v-card-text v-if="isLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-4 text-grey">Loading your requests...</div>
      </v-card-text>

      <v-card-text v-else-if="error" class="py-8">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="!tickets.length" class="py-8 text-center text-grey">
        You haven't filed any support requests yet.
        <div class="mt-2">
          <a href="#" @click.prevent="showNewRequest = true">Contact support</a>
          if something's not right.
        </div>
      </v-card-text>

      <v-table v-else>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Status</th>
            <th>Last activity</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ticket in tickets"
            :key="ticket.id"
            class="ticket-row"
            @click="openTicket(ticket)"
          >
            <td>
              <router-link
                :to="{ name: 'settings-ticket-detail', params: { ticketId: ticket.id } }"
                class="ticket-subject"
                @click.stop
              >
                {{ ticket.subject || 'Support request ' + ticket.id }}
              </router-link>
            </td>
            <td>
              <v-chip size="small" :color="statusColor(ticket)" variant="tonal">
                {{ statusLabel(ticket) }}
              </v-chip>
            </td>
            <td>
              <v-tooltip location="top" aria-label="Exact date">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="cursor-pointer">
                    {{ formatRelativeTime(ticket.updated_at || ticket.created_at) }}
                  </span>
                </template>
                {{ formatExactDate(ticket.updated_at || ticket.created_at) }}
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { format as formatTimeago } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';
import { ticketStatusLabel, ticketStatusColor } from '@/ticketStatus';
import SupportRequestForm from '@/components/SupportRequestForm.vue';

defineOptions({ name: 'MeTickets' });

useHead({ title: 'Support requests' });

const router = useRouter();

const tickets = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showNewRequest = ref(false);

// The list endpoint is real-time (no index lag), so refetching right after
// filing is what makes the new ticket appear behind the dialog.
function onFiled() {
  fetchTickets();
}

onMounted(fetchTickets);

async function fetchTickets() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await axios.get(
      `${urlBase.userApi}/users/me/tickets`,
      axiosConfig({ userAuth: true })
    );
    tickets.value = response.data.tickets || [];
  } catch (err) {
    console.error('Error fetching tickets:', err);
    error.value = 'Unable to load your support requests. Please try again later.';
    tickets.value = [];
  } finally {
    isLoading.value = false;
  }
}

function openTicket(ticket) {
  router.push({ name: 'settings-ticket-detail', params: { ticketId: ticket.id } });
}

const statusLabel = (ticket) => ticketStatusLabel(ticket.status);
const statusColor = (ticket) => ticketStatusColor(ticket.status);

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  return formatTimeago(new Date(dateString));
};

const formatExactDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
</script>

<style scoped lang="scss">
.ticket-row {
  cursor: pointer;
}

.ticket-subject {
  font-weight: 500;
}

.nr-title {
  font-size: 22px;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 6px;
}

.nr-intro {
  font-size: 15px;
  line-height: 1.6;
  color: #52525b;
  margin: 0 0 20px;
}
</style>

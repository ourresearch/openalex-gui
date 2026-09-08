<template>
  <!-- Support-request detail + reply (oxjob #823). The conversation comes from
       users-api, which reads Zendesk's Requests API — public comments only by
       construction, so private agent notes can never appear here. Closed
       tickets are immutable in Zendesk: render read-only and point at
       /support for a new request (the slim portal has no follow-up flow). -->
  <div>
    <div class="d-flex align-center mb-6">
      <v-btn
        icon
        variant="text"
        size="small"
        class="mr-2"
        :to="{ name: 'settings-tickets' }"
        aria-label="Back to support requests"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1 class="text-h5 font-weight-bold">
        {{ ticket ? (ticket.subject || 'Support request ' + ticket.id) : 'Support request' }}
      </h1>
      <v-spacer />
      <v-chip v-if="ticket" size="small" :color="statusColor" variant="tonal">
        {{ statusLabel }}
      </v-chip>
    </div>

    <v-card flat variant="outlined" class="bg-white">
      <v-card-text v-if="isLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-4 text-grey">Loading your request...</div>
      </v-card-text>

      <v-card-text v-else-if="error" class="py-8">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else class="py-4">
        <div
          v-for="comment in ticket.comments"
          :key="comment.id"
          class="comment"
          :class="{ 'comment--mine': comment.is_me }"
        >
          <div class="comment-meta">
            <span class="comment-author">{{ comment.is_me ? 'You' : comment.author_name }}</span>
            <v-tooltip location="top" aria-label="Exact date">
              <template v-slot:activator="{ props }">
                <span v-bind="props" class="comment-date cursor-pointer">
                  {{ formatRelativeTime(comment.created_at) }}
                </span>
              </template>
              {{ formatExactDate(comment.created_at) }}
            </v-tooltip>
          </div>
          <div class="comment-body">{{ comment.body }}</div>
          <div v-if="comment.attachment_names.length" class="comment-attachments">
            <v-icon size="small" class="mr-1">mdi-paperclip</v-icon>
            {{ comment.attachment_names.join(', ') }}
            <span class="text-grey">(attachments are available in the email version of this message)</span>
          </div>
        </div>

        <!-- Reply, or the closed notice -->
        <div v-if="ticket.is_closed" class="closed-notice">
          This request is closed and can't be reopened.
          <router-link :to="{ name: 'Support' }">File a new request</router-link>
          if you need anything else.
        </div>

        <form v-else class="reply-form" @submit.prevent="submitReply">
          <v-textarea
            v-model="replyBody"
            variant="outlined"
            rows="4"
            auto-grow
            hide-details
            placeholder="Write a reply..."
            :disabled="submitting"
          />
          <div class="d-flex align-center mt-3">
            <span v-if="replyError" class="text-error text-body-2">{{ replyError }}</span>
            <v-spacer />
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              :loading="submitting"
              :disabled="!replyBody.trim()"
            >
              Send reply
            </v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { format as formatTimeago } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';
import { ticketStatusLabel, ticketStatusColor } from '@/ticketStatus';

defineOptions({ name: 'MeTicketDetail' });

const props = defineProps({
  ticketId: { type: [String, Number], required: true },
});

useHead({ title: 'Support request' });

const ticket = ref(null);
const isLoading = ref(true);
const error = ref(null);

const replyBody = ref('');
const submitting = ref(false);
const replyError = ref('');

const statusLabel = computed(() => ticketStatusLabel(ticket.value?.status));
const statusColor = computed(() => ticketStatusColor(ticket.value?.status));

onMounted(fetchTicket);

async function fetchTicket() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await axios.get(
      `${urlBase.userApi}/users/me/tickets/${props.ticketId}`,
      axiosConfig({ userAuth: true })
    );
    ticket.value = response.data;
  } catch (err) {
    console.error('Error fetching ticket:', err);
    error.value = err.response?.status === 404
      ? "We couldn't find that support request."
      : 'Unable to load this support request. Please try again later.';
  } finally {
    isLoading.value = false;
  }
}

async function submitReply() {
  const body = replyBody.value.trim();
  if (!body || submitting.value) return;
  submitting.value = true;
  replyError.value = '';
  try {
    await axios.post(
      `${urlBase.userApi}/users/me/tickets/${props.ticketId}/comments`,
      { body },
      axiosConfig({ userAuth: true })
    );
    replyBody.value = '';
    await fetchTicket();
  } catch (err) {
    console.error('Error sending reply:', err);
    replyError.value = err.response?.status === 409
      ? "This request is closed and can't be reopened."
      : "We couldn't send your reply. Please try again.";
  } finally {
    submitting.value = false;
  }
}

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
.comment {
  padding: 14px 16px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #fafafa;

  + .comment { margin-top: 12px; }

  &--mine {
    background: #fff;
  }
}

.comment-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: #0a0a0a;
}

.comment-date {
  font-size: 13px;
  color: #71717a;
}

.comment-body {
  font-size: 15px;
  line-height: 1.6;
  color: #27272a;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.comment-attachments {
  margin-top: 8px;
  font-size: 13px;
  color: #52525b;
}

.closed-notice {
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #fafafa;
  font-size: 14px;
  color: #52525b;
}

.reply-form {
  margin-top: 20px;
}
</style>

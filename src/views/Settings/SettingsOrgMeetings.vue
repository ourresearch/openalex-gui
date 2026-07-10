<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-bold">Quarterly Member Meetings</h1>
      <v-btn variant="text" :href="NOTES_REPO_URL" target="_blank">
        Past meeting notes
        <v-icon end size="small">mdi-open-in-new</v-icon>
      </v-btn>
    </div>

    <v-card variant="outlined" class="mb-6">
      <v-card-text>
        <p class="text-body-2 mb-0">
          90-minute open forum meetings where members discuss priorities for future development
          roadmaps directly with our product team. Open to everyone at Member, Member+, and
          Partner institutions — additional attendees from your institution are always welcome.
        </p>
      </v-card-text>
    </v-card>

    <!-- Next meeting -->
    <v-card v-if="nextMeeting" variant="outlined" class="mb-6">
      <v-card-text>
        <div class="text-subtitle-1 font-weight-bold mb-1">Next meeting</div>
        <div class="text-h6 mb-1">{{ nextMeeting.label }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          90 minutes, on Zoom. The same link is used for every meeting.
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-calendar-plus" class="mr-2" @click="downloadIcs(nextMeeting)">
          Add to calendar
        </v-btn>
        <v-btn variant="outlined" :href="ZOOM_URL" target="_blank" prepend-icon="mdi-video-outline">
          Join Zoom meeting
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Later meetings -->
    <v-card v-if="laterMeetings.length" variant="outlined" class="mb-6">
      <v-card-text>
        <div class="text-subtitle-1 font-weight-bold mb-2">Coming up</div>
        <div v-for="meeting in laterMeetings" :key="meeting.startUtc" class="d-flex align-center mb-1">
          <div class="text-body-2 flex-grow-1">{{ meeting.label }}</div>
          <v-btn variant="text" size="small" prepend-icon="mdi-calendar-plus" @click="downloadIcs(meeting)">
            Add to calendar
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <div class="text-body-2 text-medium-emphasis">
      Notes and recordings from previous meetings are in our open
      <a :href="NOTES_REPO_URL" target="_blank">meeting notes repository</a>.
      Questions? <a href="mailto:support@openalex.org">support@openalex.org</a>.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'SettingsOrgMeetings' });

useHead({ title: 'Quarterly Member Meetings' });

// ---------------------------------------------------------------------------
// Meeting schedule + links. Update these constants each cycle (or when the
// Zoom link rotates). Times are stored as UTC instants; labels are the
// human-facing announcement (kept in Eastern time like the /members page).
// TODO(kyle): replace ZOOM_URL + confirm dates before this ships; the Nov
// date lands near US Thanksgiving and may need to move.
// ---------------------------------------------------------------------------
const ZOOM_URL = 'https://zoom.us/j/REPLACE_ME';
const NOTES_REPO_URL = 'https://github.com/ourresearch/town-hall-notes';
const MEETINGS = [
  { startUtc: '2026-08-27T14:00:00Z', label: 'Thursday, August 27, 2026 — 10:00am Eastern' },
  { startUtc: '2026-11-27T15:00:00Z', label: 'Friday, November 27, 2026 — 10:00am Eastern' },
];
const MEETING_MINUTES = 90;

const now = new Date();
const upcoming = computed(() => MEETINGS.filter(m => new Date(m.startUtc) > now));
const nextMeeting = computed(() => upcoming.value[0] || null);
const laterMeetings = computed(() => upcoming.value.slice(1));

function icsStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function downloadIcs(meeting) {
  const start = new Date(meeting.startUtc);
  const end = new Date(start.getTime() + MEETING_MINUTES * 60 * 1000);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenAlex//Member Meetings//EN',
    'BEGIN:VEVENT',
    `UID:openalex-member-meeting-${icsStamp(start)}@openalex.org`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    'SUMMARY:OpenAlex Quarterly Member Meeting',
    `DESCRIPTION:Open forum with the OpenAlex product team.\\nJoin: ${ZOOM_URL}\\nPast notes: ${NOTES_REPO_URL}`,
    `LOCATION:${ZOOM_URL}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'openalex-member-meeting.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

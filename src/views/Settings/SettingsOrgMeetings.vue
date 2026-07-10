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
          Open forum meetings where members discuss priorities for future development
          roadmaps directly with our product team. Open to everyone at Member, Member+, and
          Partner institutions — additional attendees from your institution are always welcome.
          Download the calendar invite below; the connection details are inside.
        </p>
      </v-card-text>
    </v-card>

    <!-- Next meeting -->
    <v-card v-if="nextMeeting" variant="outlined" class="mb-6">
      <v-card-text>
        <div class="text-subtitle-1 font-weight-bold mb-1">Next meeting</div>
        <div class="text-h6 mb-1">{{ nextMeeting.label }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ MEETING_MINUTES }} minutes, on Zoom · Meeting ID {{ nextMeeting.meetingId }} · Passcode {{ nextMeeting.passcode }}
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-calendar-plus" class="mr-2" @click="downloadIcs(nextMeeting)">
          Add to calendar
        </v-btn>
        <v-btn variant="outlined" :href="nextMeeting.joinUrl" target="_blank" prepend-icon="mdi-video-outline">
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
// Meeting schedule + Zoom details. Update these constants each cycle. Times
// are stored as UTC instants; labels are the human-facing announcement.
// Schedule per quarterly-meetings-plan.md (2026-06-27): Wednesdays at 7am
// Pacific, 60 min. Zoom meetings created by Kyle 2026-07-10; each meeting
// has its own join link + passcode.
// ---------------------------------------------------------------------------
const NOTES_REPO_URL = 'https://github.com/ourresearch/town-hall-notes';
const MEETINGS = [
  // 7am Pacific: PDT = 14:00 UTC (Sep); PST = 15:00 UTC (Dec, Mar — US DST returns Mar 14 2027)
  {
    startUtc: '2026-09-09T14:00:00Z',
    label: 'Wednesday, September 9, 2026 — 7:00am Pacific / 10:00am Eastern / 3:00pm UK',
    joinUrl: 'https://zoom.us/j/92860835482?pwd=NUiY4xlDrNROk3PhIX4Y7QT4x1zoIJ.1',
    meetingId: '928 6083 5482',
    passcode: '140845',
  },
  {
    startUtc: '2026-12-09T15:00:00Z',
    label: 'Wednesday, December 9, 2026 — 7:00am Pacific / 10:00am Eastern / 3:00pm UK',
    joinUrl: 'https://zoom.us/j/97856798922?pwd=Dln9VbaJOmqU9nlAWuh5hsFbOGdXdR.1',
    meetingId: '978 5679 8922',
    passcode: '516594',
  },
  {
    startUtc: '2027-03-10T15:00:00Z',
    label: 'Wednesday, March 10, 2027 — 7:00am Pacific / 10:00am Eastern / 3:00pm UK',
    joinUrl: 'https://zoom.us/j/92631644042?pwd=EZwjKH58r2bYBCz3pfIJb6f0VglS2G.1',
    meetingId: '926 3164 4042',
    passcode: '571136',
  },
];
const MEETING_MINUTES = 60;

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
    'SUMMARY:OpenAlex Members Roundtable',
    `DESCRIPTION:Open forum with the OpenAlex product team.\\n\\nJoin Zoom Meeting: ${meeting.joinUrl}\\nMeeting ID: ${meeting.meetingId}\\nPasscode: ${meeting.passcode}\\n\\nPast notes: ${NOTES_REPO_URL}`,
    `LOCATION:${meeting.joinUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `openalex-members-roundtable-${meeting.startUtc.slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

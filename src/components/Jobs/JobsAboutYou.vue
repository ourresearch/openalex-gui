<template>
  <!-- Shared "About you" prose for every jobs page (pitch page + all role listings).
       Edit here, once. Renders just the paragraphs — the page owns the surrounding
       <static-section id="about-you"> and appends its role-specific bullets after this.
       (oxjob #812, extracted 2026-08-21. Copy: Jason's r3 pitch rewrite 2026-08-18, then
       Rohan's notes 2026-08-21 — AI-leverage sentence + "dash of chaos" cut — and Jason's
       2026-08-21 tweaks: "relentlessly resourceful (as pg puts it)" so the force of the
       essay survives even if nobody clicks; Cult of Done link removed.) -->
  <div class="jobs-about-you">
    <p class="section-body">
      You're <strong>relentlessly resourceful</strong>
      (<a href="https://paulgraham.com/relres.html" target="_blank" rel="noopener noreferrer">as pg puts it</a>).
      You've got the smarts to
      <a href="https://en.wikipedia.org/wiki/Kobayashi_Maru" target="_blank" rel="noopener noreferrer">outwit the impossible problems</a>,
      the grit to power through the grindy ones, and the wisdom to tell the
      difference. You get things done.
    </p>
    <p class="section-body">
      You play <strong>jazz, not classical:</strong> you're confident in your skills,
      love improvising with a team, and can embrace ambiguity and imperfection in
      service of emergent, collaborative creativity.
    </p>
    <p class="section-body">
      You <strong>believe in our mission</strong> and you care about openness and open
      culture. That extends to how you communicate: with skill, empathy, and clarity.
    </p>
  </div>
</template>

<script setup>
defineOptions({ name: 'JobsAboutYou' });
</script>

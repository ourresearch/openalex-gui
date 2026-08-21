<template>
  <!-- Shared "About us" prose for every jobs page (pitch page + all role listings).
       Edit here, once. Renders just the paragraphs — the page owns the surrounding
       <static-section id="about-us"> so each page keeps its own TOC/section ids.
       (oxjob #812, extracted 2026-08-21; copy = Jason's r3 pitch rewrite, 2026-08-18.) -->
  <div class="jobs-about-us">
    <p class="section-body">
      Inspired by the ancient Library of Alexandria, we're building a
      <strong><em>universal research library.</em></strong> And by making it open to
      humans and machines, we're supporting a new scientific revolution. We'd love your
      help.
    </p>
    <p class="section-body">
      As a nonprofit, we're driven by mission. As a tech company, <strong>we're working
      at scale:</strong> a billion API calls monthly, and millions of users across
      enterprise, government, and academia. Your favorite AI company probably uses
      OpenAlex; your favorite university definitely does.
    </p>
    <p class="section-body">
      <strong>Our small-team culture</strong> values trust, agency, and impact. The
      tempo's relentless, nothing's ever really done, and no one's holding your hand.
      But the work stays interesting, we have creative autonomy, and <em>we ship.</em>
      Every day.
    </p>
  </div>
</template>

<script setup>
defineOptions({ name: 'JobsAboutUs' });
</script>

<template>
  <div class="members-page">
    <!-- Hero Section -->
    <section class="hero">
      <h1 class="hero-headline">OpenAlex Members</h1>
      <p class="hero-subhead">
        Institutions committed to sustaining open research infrastructure
      </p>
      <div class="hero-nav">
        <a href="#benefits" class="hero-nav-link">Member Benefits</a>
        <span class="hero-nav-separator">•</span>
        <a href="#members" class="hero-nav-link">Current Members</a>
      </div>
    </section>

    <!-- Benefits Section -->
    <section id="benefits" class="section benefits-section">
      <h2 class="section-header">Member Benefits</h2>
      <p class="section-subhead">
        All OpenAlex Membership tiers include the core benefits outlined below.
        <router-link to="/pricing/institutions">Member+ and Partner tiers</router-link> include these benefits and additional services.
      </p>

      <div class="benefits-list">
        <!-- Admin Dashboard -->
        <div class="benefit-card">
          <div class="benefit-icon">
            <v-icon size="32">mdi-view-dashboard-outline</v-icon>
          </div>
          <div class="benefit-content">
            <h3 class="benefit-title">Admin Dashboard</h3>
            <p class="benefit-description">
              Get OpenAlex usage data for your institution. See how many users at your institution are using OpenAlex and track API calls made by your research community.
            </p>
            <div class="benefit-activation">
              <h4>How to activate</h4>
              <p>
                Identify the users at your institution who should have access to this information (typically economic buyers or e-resource librarians).
                First, they'll need to create an account by going to <a href="https://openalex.org">openalex.org</a> and clicking "Sign up" at the top right.
                Then <a href="mailto:kyle@openalex.org">contact us</a> with their names and email addresses, and we'll enable their OpenAlex accounts for dashboard access.
              </p>
            </div>
          </div>
        </div>

        <!-- Affiliation Editor -->
        <div class="benefit-card">
          <div class="benefit-icon">
            <v-icon size="32">mdi-account-edit-outline</v-icon>
          </div>
          <div class="benefit-content">
            <h3 class="benefit-title">Affiliation Editor</h3>
            <p class="benefit-description">
              Curate the affiliation text strings that OpenAlex matches to your institution. Remove erroneous matches and add missed ones.
              Your curations will be reflected live in OpenAlex within 2 days.
            </p>
            <div class="benefit-screenshot">
              <img src="/affiliation-editor-screenshot.png" alt="Affiliation Editor interface showing affiliation linking tool" />
            </div>
            <div class="benefit-activation">
              <h4>How to activate</h4>
              <p>
                <a href="mailto:kyle@openalex.org">Contact us</a> to get set up. We'll provide group training and video resources before granting access to this tool.
                Once training is complete, we'll enable specific accounts at your institution to use the affiliation editor.
                We periodically monitor accuracy of curations to ensure quality.
              </p>
            </div>
          </div>
        </div>

        <!-- Unsub Access -->
        <div class="benefit-card">
          <div class="benefit-icon">
            <v-icon size="32">mdi-book-open-variant</v-icon>
          </div>
          <div class="benefit-content">
            <h3 class="benefit-title"><em>Unsub</em> Access</h3>
            <p class="benefit-description">
              <a href="https://unsub.org" target="_blank">Unsub</a> is a data-driven tool that helps libraries make smarter journal subscription decisions.
              It combines your institution's usage data, citation patterns, and open access availability to forecast the true cost and value of journal packages—helping you
              identify which subscriptions to keep, which to cancel, and where to invest your budget for maximum research impact.
            </p>
            <div class="benefit-activation">
              <h4>How to activate</h4>
              <p>
                <a href="mailto:kyle@openalex.org">Send us</a> the names and email addresses for up to 3 users at your institution (typically Collections Librarians). We'll create logins and send passwords.
              </p>
              <p class="benefit-note">
                <strong>Note:</strong> We provide online documentation and shared training videos for Unsub but do not offer direct support.
                If you need consulting support for additional analyses and implementation, we recommend
                <a href="mailto:SCHARESDATASCIENCE@gmail.com">Eric Schares</a>, an Unsub super user with extensive experience
                making collection decisions and training other institutions.
              </p>
            </div>
          </div>
        </div>

        <!-- Community Advisory Board -->
        <div class="benefit-card">
          <div class="benefit-icon">
            <v-icon size="32">mdi-account-group-outline</v-icon>
          </div>
          <div class="benefit-content">
            <h3 class="benefit-title">Community Advisory Board Nomination Rights</h3>
            <p class="benefit-description">
              Members can nominate candidates for our 12-member <a href="/team">Community Advisory Board</a>,
              which helps guide OpenAlex's direction and priorities.
            </p>
            <div class="benefit-activation">
              <h4>How it works</h4>
              <p>
                We replace 6 advisory board members annually. The next election will be in December 2026 for January 2027 seats.
                We'll put out a call for nominations from Members in Fall 2026.
              </p>
              <p>
                <a href="https://docs.google.com/document/d/1TVEsfqRLAcNpiZkvFuKoGKVo6FVNwisRsThnz78kgI4/edit?tab=t.0#heading=h.mbrwjopt6w77" target="_blank">
                  Learn more about the Advisory Board →
                </a>
              </p>
            </div>
          </div>
        </div>

        <!-- Quarterly Meetings -->
        <div class="benefit-card">
          <div class="benefit-icon">
            <v-icon size="32">mdi-calendar-account-outline</v-icon>
          </div>
          <div class="benefit-content">
            <h3 class="benefit-title">Quarterly Member Meetings</h3>
            <p class="benefit-description">
              90-minute open forum meetings where Members can discuss priorities for future development roadmaps directly with our product team.
            </p>
            <div class="benefit-activation">
              <h4>Schedule</h4>
              <p>
                Meetings are open to all Members, Member+, and Partner institutions.
                The first meeting is <strong>May 27th at 10am Eastern</strong>, then every three months after that.
              </p>
              <p>
                Calendar invites will be sent to Member contacts. Additional attendees from your institution are welcome—just let us know.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Current Members Section -->
    <section id="members" class="section members-section">
      <h2 class="section-header">Our Members</h2>
      <p class="section-subhead">
        These institutions are helping keep OpenAlex free and open for everyone.
      </p>

      <!-- Supporting Members -->
      <div class="member-tier">
        <h3 class="tier-label">Supporting Members</h3>
        <div class="members-list">
          <span v-for="(member, index) in supportingMembers" :key="member" class="member-name">
            {{ member }}<span v-if="index < supportingMembers.length - 1" class="member-separator">•</span>
          </span>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section cta-section">
      <div class="final-cta">
        <h2 class="cta-headline">Interested in becoming a Member?</h2>
        <p class="cta-subhead">
          Join the institutions supporting open research infrastructure.
        </p>
        <div class="cta-buttons">
          <router-link to="/pricing/institutions" class="cta-btn cta-primary cta-large">
            View Pricing
          </router-link>
          <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary cta-large">
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { ref } from 'vue';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'MembersPage' });

useHead({
  title: 'Members - OpenAlex',
  meta: [
    { name: 'description', content: 'OpenAlex institutional members supporting open research infrastructure. Learn about member benefits and how to join.' }
  ]
});

// Supporting Members - alphabetically sorted
const supportingMembers = ref([
  'Austrian Science Fund',
  'Boston University School of Medicine',
  'Chinese Academy of Science',
  'Dutch Research Council (NWO)',
  'EPFL',
  'ESCP Business School',
  'French Ministry of Higher Education & Research',
  'Hong Kong University of Science and Technology',
  'IESE Business School',
  'Inist-CNRS',
  'Institute of Electrical and Electronics Engineers',
  'Japan Science and Technology Agency',
  'Jisc',
  'Konsortium der Sächsischen Hochschulbibliotheken (SLUB Dresden)',
  'KTH Royal Institute of Technology',
  'National Institute of Informatics',
  'North Carolina State University',
  'Sorbonne University',
  'Stanford University',
  'Swedish Research Council',
  'Technical University of Denmark (DTU)',
  'Technische Informationsbibliothek (TIB)',
  'The Chan Zuckerberg Initiative',
  'Universiteit Leiden (CWTS)',
  'Université de Lorraine',
  'Université de Sherbrooke',
  'Université Paris Cité',
  'Université Paris-Saclay',
  'University College London',
  'University of Amsterdam',
  'University of Göttingen',
  'University of Kentucky',
  'University of Regina',
  'University of Rennes',
  'University of Victoria',
  'Utrecht University',
  'Wellcome',
]);
</script>


<style lang="scss" scoped>
.members-page {
  background: #fff;
}

// Hero Section
.hero {
  padding: 80px 24px 40px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-headline {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #0A0A0A;
  margin: 0 0 16px 0;
}

.hero-subhead {
  font-size: 20px;
  font-weight: 400;
  line-height: 1.5;
  color: #52525B;
  margin: 0 0 24px 0;
}

.hero-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.hero-nav-link {
  font-size: 16px;
  font-weight: 500;
  color: #0A0A0A;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #F4F4F5;
  }
}

.hero-nav-separator {
  color: #D4D4D8;
}

// Sections
.section {
  padding: 60px 24px;
  max-width: 900px;
  margin: 0 auto;
}

.section-header {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  text-align: center;
  margin: 0 0 16px 0;
}

.section-subhead {
  font-size: 17px;
  line-height: 1.6;
  color: #52525B;
  text-align: center;
  margin: 0 0 40px 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

// Members Section
.members-section {
  background: #FAFAFA;
  max-width: none;
  padding: 80px 24px;
}

.member-tier {
  max-width: 900px;
  margin: 0 auto 48px;

  &:last-child {
    margin-bottom: 0;
  }
}

.tier-label {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717A;
  margin: 0 0 16px 0;
  text-align: center;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 8px;
  max-width: 900px;
  margin: 0 auto;
}

.member-name {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #0A0A0A;
  background: #fff;
  border: 1px solid #E4E4E7;
  border-radius: 20px;
  padding: 8px 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #A1A1AA;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

.member-separator {
  display: none;
}

// Benefits Section
.benefits-section {
  padding-top: 80px;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.benefit-card {
  display: flex;
  gap: 24px;
  padding: 32px;
  background: #FAFAFA;
  border-radius: 12px;
}

.benefit-icon {
  width: 64px;
  height: 64px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #52525B;
  border: 1px solid #E4E4E7;
}

.benefit-content {
  flex: 1;
}

.benefit-title {
  font-size: 20px;
  font-weight: 600;
  color: #0A0A0A;
  margin: 0 0 12px 0;
}

.benefit-description {
  font-size: 15px;
  line-height: 1.6;
  color: #52525B;
  margin: 0 0 20px 0;
}

.benefit-screenshot {
  margin: 0 0 20px 0;
  padding: 16px;
  background: #F4F4F5;
  border-radius: 12px;

  img {
    width: 100%;
    max-width: 700px;
    height: auto;
    display: block;
    margin: 0 auto;
    border-radius: 6px;
    border: 1px solid #E4E4E7;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.benefit-activation {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #E4E4E7;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #0A0A0A;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    line-height: 1.6;
    color: #52525B;
    margin: 0 0 12px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  a {
    color: #0A0A0A;
    font-weight: 500;
  }
}

.benefit-note {
  background: #FEF3C7;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

// CTA Section
.cta-section {
  background: #FAFAFA;
  max-width: none;
  padding: 100px 24px;
}

.final-cta {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.cta-headline {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  margin: 0 0 12px 0;
}

.cta-subhead {
  font-size: 18px;
  color: #52525B;
  margin: 0 0 32px 0;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;

  &.cta-primary {
    background: #0A0A0A;
    color: #fff;

    &:hover {
      background: #27272A;
    }
  }

  &.cta-secondary {
    background: #fff;
    color: #0A0A0A;
    border: 1px solid #E4E4E7;

    &:hover {
      border-color: #A1A1AA;
      background: #FAFAFA;
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .hero-headline {
    font-size: 36px;
  }

  .benefit-card {
    flex-direction: column;
  }

  .benefit-icon {
    width: 56px;
    height: 56px;
  }

  .section-header {
    font-size: 28px;
  }

  .cta-headline {
    font-size: 28px;
  }

  .cta-buttons {
    flex-direction: column;

    .cta-btn {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 60px 20px 30px;
  }

  .hero-headline {
    font-size: 32px;
  }

  .section {
    padding: 48px 20px;
  }

  .benefit-card {
    padding: 24px;
  }

  .members-list {
    padding: 24px 20px;
  }
}
</style>

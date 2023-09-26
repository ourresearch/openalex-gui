<template>
  <v-container class="page">
    <h2 class="text-h3">Pricing</h2>
    <p class="important-text">
      <strong>OpenAlex is free.</strong>
    </p>
    <p>
      The website, API, and data snapshot are all available at no charge. The data is licensed as <a
        href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener noreferrer">CC0</a> so it
      is free to use and distribute. As a <a href="https://ourresearch.org/" target="_blank"
        rel="noopener noreferrer">nonprofit,</a> making this data free and open is part of our mission.
    </p>
    <p>
      <a href="https://docs.openalex.org/additional-help/faq#whats-your-sustainability-plan" target="_blank"
        rel="noopener noreferrer">Being sustainable</a>
      is also part of our mission! So, for users who’d like a higher level of service, we have the Premium plan that
      offers three benefits:
    </p>
    <ul>
      <li><strong>Faster updates,</strong> so you can get fresher data,</li>
      <li><strong>Higher API limits,</strong> so you can use the API more, and</li>
      <li><strong>Priority support</strong> for faster and more detailed help.</li>
    </ul>
    <p>
      If you are interested in our premium service, <a
        href="https://forms.monday.com/forms/ee6421d4e48d57a150c31ce88cc99f4d?r=use1" target="_blank"
        rel="noopener noreferrer">contact us to get a quote—and a
        free trial!</a>
    </p>

    <h3 class="text-h3">OpenAlex Premium</h3>

    <!-- table generated using https://www.tablesgenerator.com/html_tables -->
    <div class="tg-wrap">
      <table class="tg">
        <thead>
          <tr>
            <th class="tg-g1fv"></th>
            <th class="tg-9ase">Free<br></th>
            <th class="tg-9ase">Premium</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tg-0pky">Update frequency</td>
            <td class="tg-9etm">Monthly (via data dump)</td>
            <td class="tg-pgpg">Hourly (via API)<br></td>
          </tr>
          <tr>
            <td class="tg-0pky">API limit</td>
            <td class="tg-9etm">100k/day, max 10/second</td>
            <td class="tg-pgpg">As needed</td>
          </tr>
          <tr>
            <td class="tg-0pky">Support</td>
            <td class="tg-9etm">Best effort</td>
            <td class="tg-pgpg">Priority</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h4 class="text-h4">Update frequency</h4>
    <p>We release a new <a href="https://docs.openalex.org/download-all-data/openalex-snapshot" target="_blank"
        rel="noopener noreferrer">snapshot</a> of OpenAlex every month. If you’d like more up-to-date data, you can poll
      our API to be
      notified of new and modified works every hour. That way your local copy of OpenAlex will be perfectly synced with
      ours.
    </p>
    <p>
      To do this, you <a
        href="https://github.com/ourresearch/openalex-api-tutorials/blob/main/notebooks/getting-started/premium.ipynb"
        target="_blank" rel="noopener noreferrer">just use two Premium-only API filters,</a> along with a unique API key
      we give you as part of your Premium subscription.
    </p>

    <h4 class="text-h4">API limit</h4>
    <p>
      The API has a limit of 100,000 calls per day, with a maximum of 10 per second. However, for Premium users we can
      (and do) support millions of calls per day, with low latency and high uptime. You just need to include your unique
      Premium API key along with your requests, and you’re good to go.
    </p>

    <h4 class="text-h4">Priority support</h4>
    <p>
      Premium subscribers get to go to the head of the queue when they have support requests. We can even schedule a
      support call with your team to give you custom advice on how to integrate OpenAlex into your system.
    </p>


  </v-container>
</template>

<script>
export default {
  name: "Pricing",
  metaInfo: { title: "Pricing" }
}
</script>

<style scoped>
.tg {
  border-collapse: collapse;
  border-spacing: 0;
  margin: 2em 0 2em 2em
}

.tg td {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  font-size: 1.2em;
  overflow: hidden;
  padding: 1em 5em 1em 5em;
  word-break: normal;
}

.tg th {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  font-size: 1.6em;
  overflow: hidden;
  padding: 10px 5px;
  word-break: normal;
}

.tg .tg-9ase {
  background-color: #333333;
  border-color: inherit;
  color: #ffffff;
  font-weight: bold;
  text-align: center;
  text-decoration: underline;
  vertical-align: top
}

.tg .tg-pgpg {
  background-color: #d9ead3;
  border-color: inherit;
  font-weight: bold;
  text-align: center;
  vertical-align: top
}

.tg .tg-9etm {
  background-color: #f3f3f3;
  border-color: inherit;
  text-align: center;
  vertical-align: top
}

.tg .tg-g1fv {
  background-color: #333333;
  border-color: inherit;
  color: #ffffff;
  text-align: left;
  vertical-align: top
}

.tg .tg-0pky {
  border-color: inherit;
  text-align: left;
  vertical-align: top
}

@media screen and (max-width: 767px) {
  .tg {
    width: auto !important;
  }

  .tg col {
    width: auto !important;
  }

  .tg-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

}
</style>
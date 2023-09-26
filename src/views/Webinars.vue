<template>
  <v-container class="page">
    <h2 class="text-h2">Webinars</h2>
    <p>
      Less than 2 years since its initial launch, OpenAlex has already become a favorite in the toolkit of bibliometric
      experts because its open nature and comprehensive coverage make high-quality research analytics more accessible than
      ever. Users with data management skills are already well-supported by our free API and data snapshot access methods.
      To keep the momentum building and expand accessibility of OpenAlex data, we are launching a new Graphic User
      Interface and resources to support researchers and research administrators across the globe in applying OpenAlex
      data to their research analytics needs. This fall, join us for a monthly webinar series that will introduce OpenAlex
      and how to use it to answer some of the most common research intelligence and bibliometric use cases.
    </p>
    <ul>

      <li>
        <strong>When:</strong> Monthly on the 2nd Thursday of each month at 12pm Eastern
      </li>
      <li>
        <strong>Format:</strong> 45 minute virtual webinar (20-30 minute recorded presentation
        followed by open
        discussion).
      </li>
      <li>
        <strong>Registration:</strong> <a href="https://forms.monday.com/forms/917b61cf81e926a2127dbbf90d2b069e?r=use1"
          target="_blank" rel="noopener noreferrer">Fill out this form to sign up!</a> If you cannot make the time but are
        interested in the webinar, still register and a link to a recording will be sent to you afterwards.
      </li>
    </ul>
    <h3 class="text-h3">Fall/Winter 2023 Webinar Series</h3>
    <v-row>
      <v-col cols="12" v-for="item in items" :key="item.title">
        <v-card>
          <v-card-item>
            <v-card-title style="word-break: normal;">{{ item.title }}</v-card-title>
            <v-card-subtitle class="text-subtitle-2">{{ item.date }}</v-card-subtitle>
            <template v-if="item.video_link">
              <a :href="item.video_link" target="_blank" rel="noopener noreferrer"><v-btn color="primary">Video recording
                  of presentation</v-btn></a>
              <br />
            </template>
          </v-card-item>
          <v-card-text>
            <ul>
              <li>
                <strong>Date:</strong> {{ item.date }}
              </li>
              <li>
                <strong>Time:</strong> {{ item.time }}
              </li>
              <li>
                <strong>Location:</strong> {{ item.location }}
              </li>
              <a v-if="item.video_link === null"
                href="https://forms.monday.com/forms/917b61cf81e926a2127dbbf90d2b069e?r=use1" target="_blank"
                rel="noopener noreferrer"><strong>Registration Link</strong></a>
              <li>
                <strong>Presenters:</strong> {{ item.presenters }}
              </li>
              <li>
                <strong>Summary:</strong> {{ item.summary }}
              </li>
              <li v-if="item.slides">
                <a :href="`${publicPath}${item.slides}`" target="_blank" rel="noopener noreferrer">Download the
                  presentation slides</a>
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>


  </v-container>
</template>

<script>
export default {
  name: "Webinars",
  metaInfo: { title: "Webinars" },
  data() {
    return {
      publicPath: process.env.BASE_URL,
      items: [
        {
          title: "Introducing OpenAlex: An open and comprehensive catalog of scholarly works, authors, institutions, and more",
          date: "September 14, 2023",
          time: "12pm EDT",
          location: "Virtual",
          presenters: "Kyle Demes & Jason Portenoy",
          summary: "Large databases that index research outputs and associated metadata (scientific knowledge graphs or SKGs) have become critical infrastructure for any research organization. They help researchers find the right papers among millions; they enable scientometrics research; and they provide intelligence to inform decisions at almost every level of research management. However, the leading established SKGs require expensive subscriptions to access and have systematic biases that constrain who has access to these tools and what insights they can provide. That’s why, within less than 2 years of launching, OpenAlex is already seen by bibliometric experts as a foundational tool for high-quality research analytics. In this webinar, we will introduce OpenAlex, the first completely open and comprehensive SKG. Specifically, we will: cover how the open model works for SKGs; highlight major features of OpenAlex specifically in comparison to closed SKGs; review methods for accessing the data; and explore foundations of OpenAlex’s data structure and the use cases it enables. Participants will leave with the foundational knowledge to get started using OpenAlex and resources on where to learn more.",
          video_link: "https://youtu.be/dKJgLK3wrTM",
          slides: "Intro_OpenAlex.pdf"
        },
        {
          title: "Using OpenAlex to understand your University’s research",
          date: "October 10, 2023",
          time: "12pm EDT",
          location: "Virtual (link sent after registration)",
          presenters: "Kyle Demes & Jason Portenoy",
          summary: "Because research is disseminated in many ways, often independent of Universities, most institutions don’t have a catalog of the works published by their researchers. This gap has severely constrained the ability of institutions and funders to make informed management decisions, without paying for access to costly third-party databases. OpenAlex is a free, completely open database of the global research ecosystem that can provide research leaders with the data they need about the research by their institution and peers. In this webinar, we will demonstrate how to perform some of the most common analyses of bibliometric data performed by research leaders using OpenAlex—specifically: (1) identifying areas of research strength (2) assessing current and potential research collaborators (3) providing objective evidence of impact and position within a field for reports and grant proposals. We will end by highlighting some of the additional benefits of the OpenAlex model to institutional intelligence, like integration with internal research management systems, external profiling of research(ers), and building derivative tools off the database for custom research intelligence needs.",
          video_link: null,
          slides: null
        },
        {
          title: "Using OpenAlex for International Intelligence",
          date: "November 9, 2023",
          time: "12pm EST",
          location: "Virtual (link sent after registration)",
          presenters: "Kyle Demes & Jason Portenoy",
          summary: "International research collaborations can bring institutions new opportunities for collaborative research and increase the impact of their research. Because of this, internationalization of research is a priority for many Universities around the world. The strategies that Universities develop and implement to achieve their goals of international collaboration require comprehensive data on their research and on the research of all other Universities around the globe. For instance, knowing which institutions globally work on similar research can help identify new partnership opportunities. Identifying existing connections among researchers between those institutions can help drive development opportunities. These data historically have come through costly subscriptions to restricted databases. OpenAlex now provides the data required for international intelligence freely to all users across the globe. In this webinar, we will review common use cases of bibliometric data by international research teams at Universities and how to perform them easily and freely using OpenAlex. For instance: assessing current and potential international collaborators; identifying leading countries and institutions within specific countries on topics of priority to your institutions; and insights into research contributions to the UN Sustainable Development Goals. We will end by showcasing an international intelligence dashboard built off free access to OpenAlex data by a large American research university.",
          video_link: null,
          slides: null
        },
        {
          title: "OpenAlex and VOSViewer: Uniting to enable free, easy, and high-quality research analytics",
          date: "December 14, 2023",
          time: "12pm EST",
          location: "Virtual (link sent after registration)",
          presenters: "Kyle Demes & Jason Portenoy",
          summary: "VOSViewer is one of the most widely used bibliometric tools by researchers and librarians across the globe because it performs high-quality analyses and is freely available to all users. However, achieving its full analytical potential has been limited by access to costly databases with restrictive licenses (e.g., Web of Science, Scopus). With the launch of OpenAlex, a completely open and comprehensive bibliometric database, any user across the globe can now freely and easily perform high-quality research analytics, regardless of their institution’s subscriptions. In this webinar, we will review the common use cases of VOSViewer, summarize the coverage of OpenAlex, and demonstrate how combining the two enables unparalleled ease for some of the most common bibliometric analyses (e.g., co-authorship analyses; institution- and country-level network mapping; co-occurence of research topics).",
          video_link: null,
          slides: null
        },
      ]
    }
  }
}
</script>

<style scoped lang="scss"></style>
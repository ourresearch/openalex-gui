<template>
    <v-container class="about mt-12 pt-12">
      <DIV class="text-h3 mb-6">Team</DIV>
  
      <p>
        Ever since our start at an all-night hackathon in 2010, we've believed that small teams can create great things. We've grown a bit since then, but we've tried to maintain our commitment to staying small, fun, and energetic.
      </p>
      <p>
        If you'd like to join our team, or to get in contact for any reason, <a href="mailto:team@ourresearch.org">drop us a line!</a>
      </p>
  
      <div class="text-h5">Staff</div>
      <div class="text-subtitle-1">Our paid full-time and contract staff handle day-to-day operations.</div>
      <div class="d-flex flex-wrap">
        <person-card
            v-for="person in displayPeople('staff')"
            :key="person.name"
            :person="person"
            :section="'staff'"
            class="person-card"
        />
      </div>
  
      <div class="text-h5">Board of Directors</div>
      <div class="text-subtitle-1">Our volunteer board of directors governs our company.</div>
      <div class="d-flex flex-wrap">
        <person-card
            v-for="person in displayPeople('board')"
            :key="person.name"
            :person="person"
            class="person-card"
        />
      </div>
  
      
      <div class="text-h5">Advisory Board</div>
      <div class="text-subtitle-1">Our volunteer advisory board represents our community. <a href="https://docs.google.com/document/d/1TVEsfqRLAcNpiZkvFuKoGKVo6FVNwisRsThnz78kgI4/edit?tab=t.0#heading=h.mbrwjopt6w77">Learn more here</a>.</div>
      <div class="d-flex flex-wrap">
        <person-card
            v-for="person in displayPeople('advisory board')"
            :key="person.name"
            :person="person"
            class="person-card"
        />
      </div>
    
  
    </v-container>
  </template>
  
  
  <script>
  import {projectsList} from "@/data/projectDescriptions";
  import {valuesList} from "@/data/valueDescriptions";
  import PersonCard from "@/components/PersonCard";
  
  
  export default {
    name: "Team",
    components: {
      PersonCard,
    },
    data: () => ({
      dialogIsOpen: false,
      people: [
        {
          name: "Jason Priem",
          img: "https://i.imgur.com/DjocEJI.png",
          title: "CEO",
          fte: "full-time",
          categories: ["staff", "board"],
          links: [
            {
              anchor: "Twitter",
              href: "https://twitter.com/jasonpriem",
            },
            {
              anchor: "Google Scholar",
              href: "https://scholar.google.ca/citations?user=w32jC0YAAAAJ&hl=en",
            },
            {
              anchor: "Speaker bio",
              href: "https://docs.google.com/document/d/1SkUuOYrpfUF-LC7aC1sBa_phG-_qN-f3hkL9fMooTm4",
            },
          ],
          bio: "Jason is a longtime advocate for Open Science and open metrics. As a PhD student, he helped create the field of <a href=\"https://en.wikipedia.org/wiki/Altmetrics\">altmetrics</a> by coining the term and authoring the <a href=\"https://altmetrics.org\">Altmetrics Manifesto.</a> He holds a BA in history and MEd in education, both from the University of Florida."
        },
  
        {
          name: "Casey Meyer",
          img: "https://i.imgur.com/yxCfUoc.jpg",
          title: "CTO",
          fte: "full-time",
          categories: ["staff"],
          links: [
            {
              anchor: "Intro blog post",
              href: "https://blog.ourresearch.org/meet-casey-now-full-time-with-ourresearch",
            },
          ],
          bio: "Casey is a software engineer, father of three, and a former US Air Force officer. He has a background in cyber security and holds a BS in Political Science from the University of California, Davis, and an MA in Global Security Studies from American Military University."
        },
  
        {
          name: "Kyle Demes",
          img: require("@/assets/team/kyle_headshot_thumb.jpg"),
          title: "COO",
          fte: "full-time",
          categories: ["staff"],
          links: [
          ],
          bio: "Using data to make better decisions drives Kyle. A former marine ecologist, he has spent the last 9 years working with governments and universities on developing and implementing data-driven research strategies. His spare time is split between his communities and the shorelines and mountains near Vancouver."
        },
  
  
        {
          name: "Steve Gruber",
          img: "https://i.imgur.com/AobXJaI.jpg",
          title: "Sales",
          fte: "part-time",
          categories: ["staff"],
          bio: "Steve co-founded VA Partners and has over 25 years of professional sales, marketing, and business development experience in Canada and the USA. He has dramatically increased sales at growing companies in a range of industries from business software, IT, telecom, clean-tech, fintech and industrial sectors. Steve loves selling and the thrill of the close!"
        },
  
        {
          name: "Heather Joseph",
          img: "https://i.imgur.com/vbixgnn.png",
          title: "Board",
          categories: ["board"],
          fte: "volunteer",
          links: [
            {
              anchor: "Twitter",
              href: "https://twitter.com/hjoseph",
            },
          ],
          bio: "Heather Joseph is the Executive Director of the Scholarly Publishing and Academic Resources Coalition (SPARC) and the convener of the Alliance for Taxpayer Access. Prior to coming to SPARC, she spent 15 years as a publisher in both commercial and not-for-profit publishing organizations. She served as the publishing director at the American Society for Cell Biology, which became the first journal to commit its full content to the NIH’s pioneering open repository, PubMed Central. Heather has served on the Board of Directors of numerous not-for-profit organizations, including the Public Library of Science. She is a frequent speaker and writer on scholarly communications in general, and on open access in particular."
        },
  
        {
          name: "Ethan White",
          img: "https://i.imgur.com/C1V6N3k.png",
          title: "Board",
          fte: "volunteer",
          categories: ["board"],
          links: [
            {
              anchor: "Twitter",
              href: "https://twitter.com/ethanwhite",
            },
          ],
          bio: "Ethan White studies data-intensive problems in ecology including ecological forecasting and using remote sensing to understand individual level patterns in ecological systems at large scales. He is actively involved in communities focused on computational training, open science, and EDI as a Data Carpentry co-founder, Ecological Forecasting Initiative founding member and steering committee member, and co-founder of the weecology interdisciplinary research group."
        },
  
        {
          name: "Johanna McEntyre",
          img: require("@/assets/team/johanna-mcentyre.jpg"),
          title: "Board",
          fte: "volunteer",
          categories: ["board"],
          links: [
          ],
          bio: "Jo has served as the Deputy Director of the European Bioinformatics Institute since 2024, after serving as an Associate Director of EMBL-EBI Services with responsibility for data resources, and the Team Leader for Literature Services. Prior to joining EMBL-EBI, Jo was a staff scientist at the NCBI, National Library of Medicine, NIH, USA. Jo’s primary focus has been on the integration of the open access literature with life sciences data, to support the development of new ways to access and discover research information. This has led to interests in the areas of text and data mining, curation, and scientific credit and impact systems. She holds a PhD in plant biology from Manchester Metropolitan University."
        },
  
        {
          name: "Juan Pablo Alperin (Chair)",
          img: require("@/assets/team/Juan-Pablo-Alperin.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Juan Pablo Alperin is an Associate Professor in Publishing, the Scientific Director of the Public Knowledge Project, and the Co-Director of the Scholarly Communications Lab at Simon Fraser University."
        },
  
        {
          name: "Eric Jeangirard",
          img: require("@/assets/team/eric-jeangirard.png"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Eric is a data scientist at the French Ministry of Higher Education and Research. He has over 15 years' experience in developing data-driven tools, both in the private sector (airlines, banks, online marketplaces) and in the public sector."
        },
  
        {
          name: "Richard Tankerly",
          img: require("@/assets/team/richard-tankerly.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Rick is Vice President for Research and Dean of the Graduate School at Portland State University, where he leads efforts to enhance research excellence, support graduate education, and measure the societal impact of PSU’s work. With nearly 30 years of experience, he focuses on leveraging research data analytics and intelligence to grow and strengthen PSU’s research enterprise and support evidence-based decision-making. A former NSF program director and researcher in marine ecology, Rick is passionate about using data-driven strategies to foster innovation and collaboration, aligning with OpenAlex’s mission to improve access to and understanding of global research trends."
        },
  
        {
          name: "Ashley Farley",
          img: require("@/assets/team/ashley-farley.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Ashley Farley is the Senior Officer of Knowledge & Research Services at the Gates Foundation. In this capacity she leads the foundation’s Open Access Policy’s implementation and associated initiatives. This includes leading the work of Gates Open Research. Much of her work advocates for knowledge to be a global good. She completed her Masters in Library and Information Sciences through the University of Washington’s Information School. She has a deep passion for open access, believing that freely accessible knowledge has the power to improve and save lives."
        },
  
        {
          name: "Euan Adie",
          img: require("@/assets/team/euan-adie.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Euan is the director of Overton.io, a database of public policy and its links to research. He previously founded and spent six years growing Altmetric, which is now owned by Digital Science, and before that worked at Nature Publishing Group and as a researcher in medical genetics (despite not knowing how to hold a pipette properly) at the University of Edinburgh."
        },
  
        {
          name: "Amélie Church",
          img: require("@/assets/team/Amelie-Church.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Amélie Church is co-director of Sorbonne University Library in Paris, France. She is in charge of implementing the University’s Open Science policy regarding open access to publications, open data and open research information. She participated in the elaboration of the Barcelona Declaration on Open Research Information, and is an elected representative at the board of HAL, the French national repository."
        },
  
        {
          name: "Joanna Ball",
          img: require("@/assets/team/Joanna-Ball.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Joanna Ball is the Managing Director of DOAJ, and is responsible for ensuring that DOAJ fulfils its mission by setting strategic direction, leading on advocacy and engagement, and securing the organisation's sustainability. Joanna joined DOAJ in 2022 after spending over 25 years in academic library management and leadership roles in the UK and Denmark."
        },
  
        {
          name: "Nees Jan van Eck",
          img: require("@/assets/team/Nees-Jan-van-Eck.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Nees Jan van Eck is senior researcher at the Centre for Science and Technology Studies (CWTS) at Leiden University in the Netherlands, where he leads data infrastructure projects and coordinates the Information & Openness focal area. Drawing on extensive technical expertise and deep knowledge of diverse scientometric data sources and tools, Nees Jan focuses on studying and developing infrastructures, algorithms, and tools to support research assessment, science policy, and scholarly communication. As a committed advocate for transparent and democratic decision-making in science, he emphasizes the importance of open and equitable access to research information. Nees Jan is the architect and lead developer of the CWTS Leiden Ranking Open Edition, the first fully transparent worldwide university ranking based on open and reproducible data. He is also the developer of VOSviewer, a widely used software tool for analyzing and visualizing bibliometric data, which has been cited in more than 50,000 scientific publications."
        },
  
        {
          name: "Maria Gould",
          img: require("@/assets/team/Maria-Gould.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Maria Gould is the Product Director at DataCite and Director of ROR. Prior to joining DataCite, she held roles at the California Digital Library, UC Berkeley Library, and PLOS. She is actively involved in US-based and global community initiatives around persistent identifiers, scholarly infrastructure, and open metadata."
        },
  
        {
          name: "Viviana Martinovich",
          img: require("@/assets/team/Viviana-Martinovich.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Viviana is the editor-in-chief of the diamond open access journal Salud Colectiva, editorial director of the open access book series Cuadernos del ISCo, professor and researcher in the master's and doctoral programs of the Instituto de Salud Colectiva at Universidad Nacional de Lanús (UNLa), Argentina. She is the co-founder of Red Sara and co-creator and lecturer of the course Editorial Management Systems and Open Science in the Bachelor’s degree program in Systems at UNLa. From the history of scientific journals, she explores the diverse mediating actions that enable a scientific text to reach the public sphere, as well as the scientific rationalities driving these actions. From a contemporary perspective, she analyzes the effects of the industrialization and technologization of science and scientific narratives, along with the role of commercial scientific bibliography databases in the productive machinery of the scientific-industrial publishing complex. From this standpoint, she proposes rethinking the ways in which we search for, analyze, and compile scientific literature, recovering the political dimension of the open access and open science movement."
        },
  
        {
          name: "Gaël Bernard",
          img: require("@/assets/team/Gael-Bernard.jpg"),
          title: "Advisory Board",
          fte: "volunteer",
          categories: ["advisory board"],
          links: [
          ],
          bio: "Gaël Bernard is a data scientist in the Institutional Data and Analytics unit at EPFL in Lausanne, Switzerland. He enjoys designing and implementing algorithms, developing innovative web-based applications, and exploring new use cases for AI. He holds a PhD in Information Systems and co-founded Odaia, an AI-driven customer engagement platform tailored to the Life Sciences industry."
        },
  
      ]
    }),
    methods: {
      displayPeople(category){
        const ret = this.people.filter(p => p.categories.includes(category))
        ret.sort(function(a, b){
          const  aLastName = a.name.split(" ")[1]
          const  bLastName = b.name.split(" ")[1]
  
          if (b.name.includes("Juan Pablo")) {
            return 1;
          }
         
          return (aLastName > bLastName) ? 1 : -1;
        })
        return ret
      }
    },
    metaInfo() {
      return {
        title: "Team"
      }
    },
  }
  </script>
  
  
  <style lang="scss">
  .v-image {
    border-radius: 5px !important;
  }
  .text-h5 {
    margin-top: 50px;
  }
  .v-application .text-subtitle-1 {
    margin-bottom: 20px;
    font-size: 15px !important;
  }
  .person-card {
    display: flex;
    flex-direction: column;
  }
  
  </style>
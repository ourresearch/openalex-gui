<template>
  <div class="paris2026-page">

    <!-- NAV -->
    <nav class="f26-nav">
        <div class="f26-nav-inner">
            <a href="#top" class="f26-nav-brand">OpenAlex Users Meeting</a>
            <a href="#week">The week</a>
            <a href="#day1">Day 1</a>
            <a href="#day2">Day 2</a>
            <a href="#discussion">Discussion groups</a>
            <a href="#venues">Venues</a>
            <a href="#register">Register</a>
        </div>
    </nav>

    <div class="f26-container">

        <!-- HEADER -->
        <header id="top">
            <h1>OpenAlex Users Meeting, Paris 2026</h1>
            <p class="subtitle">The first in-person gathering of people who build with, run on, and study with OpenAlex. Two days: a day of community talks at CNRS, then a day of talks, live demos and discussion with the OpenAlex team at Le Totem in the 13th.</p>
            <div class="meta">
                <span class="meta-tag">Paris, France</span>
                <span class="meta-tag">Tuesday 20 &amp; Wednesday 21 October 2026</span>
                <span class="meta-tag">Tuesday hosted by CNRS</span>
                <span class="meta-tag">Registration closed</span>
            </div>
            <p class="intro-note">Registration is closed. Programme updated 19 October. <strong>Wednesday has moved</strong> from Sorbonne Universit&eacute; to <strong>Le Totem</strong>, 11 place Nationale, 75013 Paris, and its programme has changed: see Day 2 below. Wednesday now ends at 15:30.</p>
        </header>

        <!-- THE WEEK -->
        <div class="section" id="week">
            <h2 class="section-header">The week at a glance</h2>
            <p class="section-subtitle">Most people arrive on Monday. The two meeting days are in different parts of Paris, a direct metro ride apart, and each has its own host and its own character.</p>
            <div class="grid-3">
                <div class="f26-card">
                    <h4>Monday 19 October, evening</h4>
                    <p class="card-text">Informal drinks from 19:00 at <strong>La Bobine</strong>, 60 rue des &Eacute;coles, 75005 Paris (upstairs room; metro Cluny&ndash;La Sorbonne or Maubert&ndash;Mutualit&eacute;), for anyone already in town. No programme, just a chance to meet each other and the OpenAlex team before things start. Everyone orders and pays for their own drinks and food; the kitchen is open until 23:00.</p>
                    <span class="f26-tag tag-break">social</span>
                </div>
                <div class="f26-card">
                    <h4>Tuesday 20 October, CNRS</h4>
                    <p class="card-text">Community talks. Fifteen presentations from people building with OpenAlex, in four themed sessions with discussion, plus a round of lightning demos. Coffee and lunch provided. Informal drinks nearby afterwards.</p>
                    <span class="f26-tag tag-presentation">talks</span><span class="f26-tag tag-break">social</span>
                </div>
                <div class="f26-card">
                    <h4>Wednesday 21 October, Le Totem</h4>
                    <p class="card-text">Fewer talks, more conversation. Four morning talks chosen to open discussion, live demos from the OpenAlex team, then small-group discussion and a conversation about what OpenAlex should do next. In French and English. Breakfast and lunch provided. Ends at 15:30.</p>
                    <span class="f26-tag tag-presentation">talks</span><span class="f26-tag tag-hands-on">demos</span><span class="f26-tag tag-discuss">discussion</span>
                </div>
            </div>
        </div>

        <!-- DAY 1 -->
        <div class="section" id="day1">
            <h2 class="section-header">Day 1: Tuesday 20 October at CNRS</h2>
            <p class="section-subtitle">Auditorium, CNRS headquarters, 3 rue Michel-Ange, 75016 Paris. Each talk has a fifteen-minute slot: about twelve minutes of presentation and at least three for questions. Talks are grouped into themed sessions, each with time for discussion.</p>

            <div class="day-card">
                <h3>Programme</h3>
                <p class="day-theme">What people are actually building on OpenAlex, from institutional systems to national monitors to maps of science, and what they learned along the way.</p>

                <div class="sched-block">
                    <div class="sched-time">08:30 &ndash; 09:00</div>
                    <div class="sched-content">
                        <h4>Arrival and coffee</h4>
                        <span class="f26-tag tag-break">break</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">09:00 &ndash; 09:15</div>
                    <div class="sched-content">
                        <h4>Welcome</h4>
                        <p>A welcome from our hosts at CNRS, and from OpenAlex: what to expect over the two days, and how we see the community shaping where OpenAlex goes next.</p>
                        <span class="f26-tag tag-discuss">welcome</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">09:15 &ndash; 10:30</div>
                    <div class="sched-content">
                        <h4>Session 1: Running an institution on open data</h4>
                        <p>Universities that have built their research information on OpenAlex: institutional directories and CRIS systems, expert finders built on the topic ontology, benchmarking against the Leiden Ranking Open Edition, and what it takes to keep the data right.</p>
                        <ul class="speaker-list">
                            <li><strong>Henri Bretel</strong> (Universit&eacute; Paris-Saclay) &mdash; OpenAlex for institutional benchmarking and research strategy: a CRISalid approach (<a href="https://docs.google.com/presentation/d/1YWN5CaJsZpu7l8K-KPiajAsUi4qMoM4RIMYUVJyeaXw/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Guillaume Godet</strong> (Nantes Universit&eacute;) &mdash; Druid: an institutional directory and dashboard powering research analytics with OpenAlex</li>
                            <li><strong>Bruna Santanach L&oacute;pez and Maia Francisco Borruel</strong> (Universitat Oberta de Catalunya) &mdash; UOC&rsquo;s journey with OpenAlex: data analysis, workflows and transparency from an institutional perspective (<a href="https://drive.google.com/file/d/18o2x8QrWcX8IDShWZtpWYtCrkdA5H3x7/view?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Nicolas Alarcon and colleagues</strong> (Sorbonne Universit&eacute;) &mdash; Sorbobot: turning OpenAlex&rsquo;s ontology into a conversational expert-finder (<a href="https://docs.google.com/presentation/d/1pqRTrkd7Yw02SnTmnPAKr77klfV6bTCGzO1YdqmYXE8/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                        </ul>
                        <span class="f26-tag tag-presentation">talks</span><span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">10:30 &ndash; 10:50</div>
                    <div class="sched-content">
                        <h4>Break</h4>
                        <span class="f26-tag tag-break">break</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">10:50 &ndash; 12:30</div>
                    <div class="sched-content">
                        <h4>Session 2: National monitors and funder intelligence</h4>
                        <p>OpenAlex at national and funder scale: building a national research output database, a national open science monitor, a funder's research intelligence stack, and tracing who funds the infrastructure research depends on.</p>
                        <ul class="speaker-list">
                            <li><strong>Patrick Peiffer</strong> (Biblioth&egrave;que nationale du Luxembourg) &mdash; Observations from a study for creating a national output database (<a href="https://docs.google.com/presentation/d/1Cdc4Zh-xPH4dQCHoVe6en6FMgIYMv4i1PlELrTxaLHM/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Chifumi Nishioka</strong> (Kyoto University and National Institute of Informatics) &mdash; Watching Japan&rsquo;s open science through OpenAlex: a university repository pipeline and a national monitor (<a href="https://docs.google.com/presentation/d/1ScA6HzEy1rRxId9-M8nNlyiQpcrW5_NH/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Andrew Knowles and Jorge Gomez Magenti</strong> (Cancer Research UK and Magenti Methodologies) &mdash; OpenAlex as the research intelligence foundation for Cancer Research UK (<a href="https://docs.google.com/presentation/d/1FdRyc8qFBalEFplREusYkZZqWlYzxiQzVcXn1S5Tk4s/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Sarah Lippincott</strong> (Invest in Open Infrastructure) &mdash; Who pays for the plumbing? Tracing research infrastructure funding with OpenAlex (<a href="https://docs.google.com/presentation/d/1tBoP4Pa0ur1XrXfinaccFesa1AJbIdA6q5kZCLBrmzA/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Thomas Eidens</strong> (EMBO) &mdash; We placed 2,200 EMBO Members on a map with OpenAlex (<a href="https://docs.google.com/presentation/d/19vpyZP5Dps6NkWtT_BcScQXs4gmQ1r6Asc3d43AtlXA/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                        </ul>
                        <span class="f26-tag tag-presentation">talks</span><span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">12:30 &ndash; 14:00</div>
                    <div class="sched-content">
                        <h4>Lunch</h4>
                        <p>Provided, in the space next to the auditorium.</p>
                        <span class="f26-tag tag-break">break</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">14:00 &ndash; 14:40</div>
                    <div class="sched-content">
                        <h4>Lightning talks: tools for the community</h4>
                        <p>Short demos of reusable tools and workflows built on OpenAlex: ready-made dashboard templates, lightweight scripts libraries use to answer everyday requests, a researcher-level map of institutional strengths, and more, with questions taken together at the end.</p>
                        <ul class="speaker-list">
                            <li><strong>Michel de Moura</strong> (Universit&eacute; de Versailles Saint-Quentin-en-Yvelines) &mdash; How the UVSQ libraries use the OpenAlex API to support research (<a href="https://docs.google.com/presentation/d/1PPdeBfrrKMl8gmJOzFNxeWiHiVtOFhwjRcCQLxf-t-o/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Paloma Garc&iacute;a Bl&aacute;zquez</strong> (University of Salamanca) &mdash; Mapping research excellence with OpenAlex: from scholarly data to strategic research intelligence (<a href="https://docs.google.com/presentation/d/192QPS05Xp09LFX6AvdQndCgl8zRkwibrCY6Frn6eMUY/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Patricia Ranoarisoa</strong> (Inist-CNRS) &mdash; LODEX template for OpenAlex: turnkey interactive bibliometrics (<a href="https://docs.google.com/presentation/d/1xRi_qhSfm9ih8tw4ScCMubWuMmPN5BBHS7ZNiKLOjd4/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Jack Culbert</strong> (GESIS) &mdash; The Open Research Converter (<a href="https://docs.google.com/presentation/d/182eJMS4TezHe7NhuUUBmvv4OSq18CtsgOOW3w-t-XeM/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Ma&iuml;ca Poirier Murphy</strong> (Higher Education Strategy Associates) &mdash; Articuler une identit&eacute; institutionnelle dans un syst&egrave;me marqu&eacute; par l&rsquo;isomorphie (<a href="https://docs.google.com/presentation/d/1RAZJF7xCnWMm2ANkmH9dIpYy_XDyTYC0VJRR4aihM9Q/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                        </ul>
                        <span class="f26-tag tag-presentation">lightning</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">14:40 &ndash; 15:25</div>
                    <div class="sched-content">
                        <h4>Session 3: Mapping, foresight and signal detection</h4>
                        <p>Maps of science and patents, technology foresight, and early-warning signals in research output, all computed from OpenAlex.</p>
                        <ul class="speaker-list">
                            <li><strong>Shruti Agarwal</strong> (Center for Security and Emerging Technology) &mdash; Building Map of Science and Map of Patents (<a href="https://docs.google.com/presentation/d/1A3N7Ro7-fj_6ztXnQM-Hz0Px0AvGgprk29wmNc-qmJc/edit?usp=sharing" target="_blank" rel="noopener">slides</a>, <a href="https://sciencemap.eto.tech/" target="_blank" rel="noopener">live demo</a>)</li>
                            <li><strong>Melanie Martini</strong> (Fraunhofer FKIE) &mdash; KATI and OpenAlex: open science intelligence for technology foresight (<a href="https://docs.google.com/presentation/d/1y0mjuVpHubohogfTyIX-IRjbLJ5V4HjHhWCqWhIk0bg/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>G&eacute;raldine Geoffroy</strong> (SmartBibl.IA Solutions) &mdash; Research Signal Radar: an OSINT-style situation room for research output on OpenAlex (<a href="https://docs.google.com/presentation/d/1QU5rCbLZj8yoSOIMUUQxEgRS7YYsM-VU/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                        </ul>
                        <span class="f26-tag tag-presentation">talks</span><span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">15:25 &ndash; 15:45</div>
                    <div class="sched-content">
                        <h4>Break</h4>
                        <span class="f26-tag tag-break">break</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">15:45 &ndash; 16:30</div>
                    <div class="sched-content">
                        <h4>Session 4: Coverage, comparisons and quality</h4>
                        <p>What affiliation and coverage checks reveal, and what national repositories and heritage collections could add to the record.</p>
                        <ul class="speaker-list">
                            <li><strong>Jack Culbert</strong> (GESIS) &mdash; Comparing affiliations in OpenAlex to the Competence Network for Bibliometrics&rsquo; infrastructure (<a href="https://docs.google.com/presentation/d/1OE6AmTGPPp8LugMroxmdQRtMPpKcqfV41t43i5nin60/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Sitthida Samath and colleagues</strong> (Pers&eacute;e, CNRS and ENS de Lyon) &mdash; Through the OpenAlex looking-glass, and what Pers&eacute;e found there (<a href="https://docs.google.com/presentation/d/1oBh36tBEDv1t19Iah_cIJtoS5paw64wo8t7TKp9jNd4/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Yannick Barborini</strong> (CNRS, CCSD) &mdash; How OpenAlex can benefit from HAL metadata richness (<a href="https://docs.google.com/presentation/d/1gvDk50QkbzZDIs2CbEpbfg7KEdYna2b0GPbGUOf2h5w/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                        </ul>
                        <span class="f26-tag tag-presentation">talks</span><span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">16:30 &ndash; 17:00</div>
                    <div class="sched-content">
                        <h4>What we heard</h4>
                        <p>The OpenAlex team responds to the day: the themes that came up across sessions, what we can act on, and what we want to dig into on Wednesday. (<a href="https://docs.google.com/presentation/d/16CtyRyxfVqo5gfYVgW2ufXJsCc8ZzLmtkxhHycz17eU/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</p>
                        <span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">17:45 &ndash; 20:30</div>
                    <div class="sched-content">
                        <h4>Drinks</h4>
                        <p>Informal drinks at <strong>Le Comptoir du 16</strong>, 24 boulevard Exelmans, 75016 Paris, a few minutes&rsquo; walk from CNRS (terrace or inside). Everyone orders and pays for their own drinks and food. The bar needs the space back at 20:30.</p>
                        <span class="f26-tag tag-break">social</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- DAY 2 -->
        <div class="section" id="day2">
            <h2 class="section-header">Day 2: Wednesday 21 October at Le Totem</h2>
            <p class="section-subtitle">Le Totem, 11 place Nationale, 75013 Paris. Everything happens in one auditorium, with breakfast and lunch in the hall next to it. Sessions run in French and English. We need to leave the building by 15:30.</p>

            <div class="day-card">
                <h3>Programme</h3>
                <p class="day-theme">A different flavour from Tuesday: fewer talks, OpenAlex shown live on screen, and plenty of time to tell us what we should do next.</p>

                <div class="sched-block">
                    <div class="sched-time">09:30 &ndash; 10:00</div>
                    <div class="sched-content">
                        <h4>Arrival and breakfast</h4>
                        <span class="f26-tag tag-break">break</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">10:00 &ndash; 10:05</div>
                    <div class="sched-content">
                        <h4>Welcome</h4>
                        <span class="f26-tag tag-discuss">welcome</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">10:05 &ndash; 11:05</div>
                    <div class="sched-content">
                        <h4>Talks to start the conversation</h4>
                        <p>Four talks chosen because each one opens a question the room picks up after lunch: running a research office or a library on OpenAlex, systematic searching with open indexes, building institutional indicators without a data team, and what OpenAlex reveals about journal quality. Fifteen minutes per talk including questions.</p>
                        <ul class="speaker-list">
                            <li><strong>Abdesslam Chai-allah and Soizic Messiaen</strong> (INRAE) &mdash; OpenAlex at INRAE: what works, what doesn&rsquo;t, and what&rsquo;s next (<a href="https://docs.google.com/presentation/d/1SooYcU3og7DlhN0xA0FcNFj5BNhojE0-ZAicJrr8B0I/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Elke Hausner</strong> (IQWiG) &mdash; A practical assessment of OpenAlex and Lens for systematic literature searches (<a href="https://docs.google.com/presentation/d/12y7Xa_HmI_K1C3nsgOS53P_mifbfhd_Bcncw5Fv3MTQ/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>H&eacute;lo&iuml;se Gazeau</strong> (Universit&eacute; de Strasbourg) &mdash; Building institutional indicators without being a data analyst, or knowing how to code (<a href="https://docs.google.com/presentation/d/1wiZ_8somexF6AXAigyJlTT-4KwxM5Yed_kuIqvAl5ts/edit?usp=sharing" target="_blank" rel="noopener">slides</a>)</li>
                            <li><strong>Abdelghani Maddi</strong> (GEMASS, CNRS and Sorbonne Universit&eacute;) &mdash; When quality signals come late: what OpenAlex reveals about journal discontinuation</li>
                        </ul>
                        <span class="f26-tag tag-presentation">talks</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">11:05 &ndash; 11:20</div>
                    <div class="sched-content">
                        <h4>Coffee</h4>
                        <span class="f26-tag tag-break">break</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">11:20 &ndash; 11:40</div>
                    <div class="sched-content">
                        <h4>Live: the query builder, OQL and affiliation curation</h4>
                        <p>Kyle Demes (OpenAlex) on screen: building and sharing searches with the query builder and OQL, pasting a strategy from another database, and fixing your institution&rsquo;s records in the affiliation editor.</p>
                        <span class="f26-tag tag-hands-on">live demo</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">11:40 &ndash; 12:00</div>
                    <div class="sched-content">
                        <h4>Live: vibe-coding a dashboard on OpenAlex</h4>
                        <p>Jason Priem (OpenAlex) builds a working page from the OpenAlex API with AI-assisted coding, live.</p>
                        <span class="f26-tag tag-hands-on">live demo</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">12:00 &ndash; 12:30</div>
                    <div class="sched-content">
                        <h4>What&rsquo;s next for OpenAlex, part 1</h4>
                        <p>Jason Priem on what the team is working on now and where OpenAlex is heading, and the questions we want your help with this afternoon.</p>
                        <span class="f26-tag tag-presentation">openalex team</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">12:30 &ndash; 13:30</div>
                    <div class="sched-content">
                        <h4>Lunch</h4>
                        <p>Provided.</p>
                        <span class="f26-tag tag-break">break</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">13:30 &ndash; 14:15</div>
                    <div class="sched-content">
                        <h4>Discussion groups</h4>
                        <p>Small groups in the auditorium, one for each of the morning&rsquo;s talks, with the speaker. Each group takes the same question: what should OpenAlex prioritise? See the groups below.</p>
                        <span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">14:15 &ndash; 15:15</div>
                    <div class="sched-content">
                        <h4>What&rsquo;s next for OpenAlex, part 2</h4>
                        <p>Each group reports back, then an open conversation with Jason and the team about priorities.</p>
                        <span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">15:15 &ndash; 15:30</div>
                    <div class="sched-content">
                        <h4>Close</h4>
                        <span class="f26-tag tag-discuss">close</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- DISCUSSION GROUPS -->
        <div class="section" id="discussion">
            <h2 class="section-header">Discussion groups</h2>
            <p class="section-subtitle">After lunch the auditorium splits into small groups, one around each morning talk with its speaker, plus someone from the OpenAlex team to listen. Join whichever conversation you want; every group takes the same underlying question: what should OpenAlex prioritise, and what would make it more useful to you?</p>
            <div class="discussion-grid">
                <div class="discussion-card">
                    <h3>Running an institution on OpenAlex</h3>
                    <ul>
                        <li>With the INRAE team</li>
                        <li>What works, what does not, and what you built instead</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>Systematic searching and discovery</h3>
                    <ul>
                        <li>With Elke Hausner</li>
                        <li>Where search syntax and coverage fall short, and what the new search features change</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>Institutional indicators without a data team</h3>
                    <ul>
                        <li>With H&eacute;lo&iuml;se Gazeau</li>
                        <li>Indicators you trust, and the tools that would make them easier</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>Journal quality and source data</h3>
                    <ul>
                        <li>With Abdelghani Maddi</li>
                        <li>Discontinued journals, journal lists and what quality signals OpenAlex should carry</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- VENUES -->
        <div class="section" id="venues">
            <h2 class="section-header">Venues and getting around</h2>
            <p class="section-subtitle">Tuesday is in the 16th and Wednesday is in the 13th. Allow about forty minutes on the metro between them.</p>

            <div class="grid-2">
                <div class="f26-card">
                    <h4>Tuesday: CNRS headquarters</h4>
                    <p class="card-text">Auditorium, 3 rue Michel-Ange, 75016 Paris.<br>Metro <strong>Michel-Ange&ndash;Auteuil</strong> (lines 9 and 10). Wifi via eduroam. A registrant list goes to the reception desk in advance, so please register under the name on your ID.</p>
                </div>
                <div class="f26-card">
                    <h4>Wednesday: Le Totem</h4>
                    <p class="card-text">11 place Nationale, 75013 Paris.<br>Metro <strong>Nationale</strong> (line 6) or <strong>Olympiades</strong> (line 14), each a few minutes&rsquo; walk. The auditorium is step-free, with wheelchair spaces.</p>
                </div>
            </div>

            <div class="f26-card" style="margin-top: 1rem;">
                <h4>Arriving from the airports</h4>
                <p class="card-text">From Charles de Gaulle, take RER B to Ch&acirc;telet&ndash;Les Halles and change to line 14 for Olympiades (Wednesday). From Orly, line 14 runs direct to Olympiades. Allow about an hour from either airport.</p>
            </div>
        </div>

        <!-- REGISTER -->
        <div class="section" id="register">
            <h2 class="section-header">Registration</h2>
            <p class="section-subtitle">Attendance is free, and OpenAlex covers coffee and lunch on both days, and breakfast on Wednesday. The evening drinks are informal: everyone pays for their own drinks and food. You cover your own travel and accommodation.</p>
            <div class="invite-note">
                <strong>Registration is now closed.</strong> Thank you to everyone who signed up. We will email registrants with the practical details for each day.
                <br>Questions about your registration? Write to <a href="mailto:support@openalex.org">support@openalex.org</a>.
            </div>
        </div>

        <footer class="f26-footer">
            OpenAlex Users Meeting, Paris, 20&ndash;21 October 2026 &mdash; CNRS and Le Totem
        </footer>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'Paris2026Page',
});
</script>

<style scoped>
/* ── CSS VARIABLES (scoped to this page; same palette as Funders2026) ── */
.paris2026-page {
    --f26-bg: #FFFFFF;
    --f26-surface: #FAFAFA;
    --f26-surface2: #F5F5F5;
    --f26-border: rgba(0,0,0,0.1);
    --f26-border-strong: rgba(0,0,0,0.15);
    --f26-text: #1A1A1A;
    --f26-text-secondary: #52525B;
    --f26-text-muted: #9CA3AF;
    --f26-primary: #000000;
    --f26-link: #1976D2;
    --f26-blue: #1E88E5;
    --f26-blue-light: #E3F2FD;
    --f26-green: #43A047;
    --f26-green-light: #E8F5E9;
    --f26-orange: #FB8C00;
    --f26-orange-light: #FFF3E0;
    --f26-purple: #8E24AA;
    --f26-purple-light: #F3E5F5;
    --f26-teal: #00897B;
    --f26-teal-light: #E0F2F1;
    --f26-red: #E53935;
    --f26-red-light: #FFEBEE;

    font-family: 'Inter', sans-serif;
    background: var(--f26-bg);
    color: var(--f26-text);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
}

.f26-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

.paris2026-page a { color: var(--f26-link); text-decoration: none; }
.paris2026-page a:hover { text-decoration: underline; }

/* ── NAV ── */
.f26-nav {
    position: sticky;
    top: 0;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 0.5px solid var(--f26-border);
    z-index: 100;
    padding: 0 2rem;
    height: 52px;
    display: flex;
    align-items: center;
}
.f26-nav-inner {
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    gap: 0.25rem;
    align-items: center;
}
.f26-nav a {
    color: var(--f26-text-secondary);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 500;
    padding: 0.3rem 0.65rem;
    border-radius: 6px;
    transition: all 0.15s ease;
}
.f26-nav a:hover { color: var(--f26-text); background: var(--f26-surface2); text-decoration: none; }
.f26-nav-brand {
    color: var(--f26-primary) !important;
    font-weight: 700;
    font-size: 0.88rem !important;
    margin-right: auto;
    letter-spacing: -0.02em;
}

/* ── HEADER ── */
.paris2026-page header {
    text-align: center;
    padding: 3.5rem 0 2.5rem;
    border-bottom: 0.5px solid var(--f26-border);
    margin-bottom: 3rem;
}
.paris2026-page header h1 {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--f26-primary);
    margin-bottom: 0.75rem;
}
.paris2026-page header .subtitle {
    color: var(--f26-text-secondary);
    font-size: 1.05rem;
    max-width: 680px;
    margin: 0 auto 1.25rem;
    line-height: 1.7;
}
.paris2026-page header .meta {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
}
.paris2026-page header .intro-note {
    color: var(--f26-text-secondary);
    font-size: 0.95rem;
    font-style: italic;
    max-width: 680px;
    margin: 1.5rem auto 0;
    line-height: 1.65;
}
.meta-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.75rem;
    background: var(--f26-surface2);
    border: 0.5px solid var(--f26-border);
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--f26-text-secondary);
}

/* ── SECTION ── */
.section { margin-top: 3.5rem; }
.section-header {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--f26-primary);
    margin-bottom: 0.4rem;
}
.section-subtitle {
    color: var(--f26-text-secondary);
    font-size: 0.95rem;
    margin-bottom: 2rem;
    max-width: 750px;
}
.sub-header {
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 0.25rem;
}
.sub-note {
    color: var(--f26-text-secondary);
    font-size: 0.88rem;
    margin-bottom: 1rem;
}
.lang-note { font-weight: 400; color: var(--f26-text-muted); font-size: 0.82rem; }

/* ── CARDS ── */
.f26-card {
    background: var(--f26-bg);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    padding: 1.5rem;
    transition: border-color 0.15s ease;
}
.f26-card:hover { border-color: var(--f26-border-strong); }
.f26-card h4 {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}
.f26-card ul { list-style: none; padding: 0; }
.f26-card li {
    color: var(--f26-text-secondary);
    font-size: 0.88rem;
    padding: 0.25rem 0 0.25rem 1rem;
    position: relative;
}
.f26-card li::before {
    content: '\2022';
    position: absolute;
    left: 0;
    color: var(--f26-text-muted);
}
.card-text {
    color: var(--f26-text-secondary);
    font-size: 0.88rem;
    line-height: 1.6;
    margin-bottom: 0.5rem;
}

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }

/* ── DISCUSSION ── */
.discussion-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}
.discussion-card {
    background: var(--f26-bg);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    padding: 1.25rem;
    transition: border-color 0.15s ease;
}
.discussion-card:hover { border-color: var(--f26-border-strong); }
.discussion-card h3 {
    font-size: 0.92rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    padding-bottom: 0.6rem;
    border-bottom: 0.5px solid var(--f26-border);
}
.discussion-card ul { list-style: none; padding: 0; }
.discussion-card li {
    color: var(--f26-text-secondary);
    font-size: 0.84rem;
    padding: 0.3rem 0 0.3rem 1.25rem;
    position: relative;
}
.discussion-card li::before {
    content: '?';
    position: absolute;
    left: 0;
    color: var(--f26-purple);
    font-weight: 700;
    font-size: 0.82rem;
}

/* ── SCHEDULE ── */
.day-card {
    background: var(--f26-bg);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    padding: 1.75rem;
    margin-bottom: 1.25rem;
}
.day-card h3 {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-bottom: 0.2rem;
}
.day-theme {
    color: var(--f26-text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 0.5px solid var(--f26-border);
}
.sched-block {
    display: flex;
    gap: 1.25rem;
    padding: 0.75rem 0;
    border-bottom: 0.5px solid rgba(0,0,0,0.05);
}
.sched-block:last-child { border-bottom: none; }
.sched-time {
    flex-shrink: 0;
    width: 110px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--f26-text-secondary);
    padding-top: 0.1rem;
}
.sched-content { flex: 1; }
.sched-content h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem; }
.sched-content p { color: var(--f26-text-secondary); font-size: 0.84rem; }
.sched-content ul { list-style: none; padding: 0; }
.sched-content li {
    color: var(--f26-text-secondary);
    font-size: 0.84rem;
    padding: 0.25rem 0 0.25rem 1rem;
    position: relative;
}
.sched-content li::before {
    content: '\2022';
    position: absolute;
    left: 0;
    color: var(--f26-text-muted);
}
.speaker-list { margin-top: 0.5rem; }
.placeholder {
    font-style: italic;
    color: var(--f26-text-muted);
}

.f26-tag {
    display: inline-block;
    padding: 0.12rem 0.5rem;
    border-radius: 4px;
    font-size: 0.68rem;
    font-weight: 600;
    margin-right: 0.3rem;
    margin-top: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.tag-discuss { background: var(--f26-purple-light); color: var(--f26-purple); }
.tag-break { background: var(--f26-surface2); color: var(--f26-text-muted); }
.tag-hands-on { background: var(--f26-green-light); color: var(--f26-green); }
.tag-presentation { background: var(--f26-red-light); color: var(--f26-red); }

/* ── INVITE NOTE ── */
.invite-note {
    margin-top: 2rem;
    padding: 1.25rem 1.5rem;
    background: var(--f26-surface);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    font-size: 0.9rem;
    color: var(--f26-text-secondary);
    text-align: center;
    line-height: 1.8;
}

.register-button {
    display: inline-block;
    padding: 0.6rem 1.4rem;
    background: var(--f26-primary);
    color: #FFFFFF !important;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
}
.register-button:hover { text-decoration: none !important; opacity: 0.85; }

/* ── FOOTER ── */
.f26-footer {
    text-align: center;
    padding: 3rem 0 2rem;
    color: var(--f26-text-muted);
    font-size: 0.82rem;
    border-top: 0.5px solid var(--f26-border);
    margin-top: 4rem;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
    .f26-container { padding: 1rem; }
    .paris2026-page header h1 { font-size: 1.5rem; }
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
    .sched-block { flex-direction: column; gap: 0.4rem; }
    .sched-time { width: auto; }
    .f26-nav { padding: 0 1rem; overflow-x: auto; }
}
</style>

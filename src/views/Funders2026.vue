<template>
  <div class="funders2026-page">

    <!-- EARLY DRAFT BANNER -->
    <div class="draft-banner">
      <span class="draft-banner-label">EARLY DRAFT</span>
      This page is a work in progress and is being actively developed. Content may change significantly.
    </div>

    <!-- NAV -->
    <nav class="f26-nav">
        <div class="f26-nav-inner">
            <a href="#top" class="f26-nav-brand">OpenAlex Funding</a>
            <a href="#graph">The Goal</a>
            <a href="#pipeline">Project Overview</a>
            <a href="#discussion">Discussion</a>
            <a href="#schedule">Schedule</a>
            <a href="#travel">Travel</a>
        </div>
    </nav>

    <div class="f26-container">

        <!-- HEADER -->
        <header id="top">
            <h1>Enriching OpenAlex with Comprehensive Grant Metadata</h1>
            <p class="subtitle">OpenAlex is already the most comprehensive and only completely open index of the global research ecosystem. With funding from Wellcome, we&rsquo;re expanding to create the first completely open database of research funding and fully integrating into OpenAlex. We&rsquo;re doing this by ingesting data directly from funders, leveraging the rich information already in OpenAlex (e.g., fulltext data mining) to create new linkages between research funding and outputs, and collaborating with funders to deliver new, open solutions for funding intelligence.</p>
            <div class="meta">
                <span class="meta-tag">London, UK</span>
                <span class="meta-tag">April 27&ndash;28, 2026</span>
                <span class="meta-tag">Pipeline Review &amp; Funder Use Cases</span>
            </div>
        </header>

        <!-- ENTITY RELATIONSHIP GRAPH -->
        <div class="section" id="graph">
            <h2 class="section-header">The Goal: OpenAlex Scholarly Graph + Funding Entities</h2>
            <p class="section-subtitle">New funding entities (Awards, Funders) integrated into the existing OpenAlex entity model.</p>

            <div class="graph-container">
                <svg viewBox="0 0 860 550" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
                    <defs>
                        <marker id="arrowGray" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                            <path d="M0,0 L10,3.5 L0,7" fill="#9CA3AF"/>
                        </marker>
                        <marker id="arrowOrange" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                            <path d="M0,0 L10,3.5 L0,7" fill="#FB8C00"/>
                        </marker>
                    </defs>

                    <!-- EXISTING EDGES (gray) -->
                    <line x1="170" y1="170" x2="290" y2="265" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrowGray)"/>
                    <line x1="170" y1="390" x2="290" y2="295" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrowGray)"/>
                    <line x1="392" y1="278" x2="498" y2="262" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrowGray)"/>
                    <line x1="620" y1="245" x2="710" y2="210" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrowGray)"/>
                    <line x1="550" y1="320" x2="480" y2="410" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrowGray)"/>

                    <!-- NEW EDGES (orange) -->
                    <line x1="690" y1="100" x2="610" y2="230" stroke="#FB8C00" stroke-width="2.5" marker-end="url(#arrowOrange)"/>
                    <line x1="660" y1="80" x2="475" y2="95" stroke="#FB8C00" stroke-width="2.5" marker-end="url(#arrowOrange)"/>
                    <line x1="450" y1="140" x2="530" y2="215" stroke="#FB8C00" stroke-width="2.5" marker-end="url(#arrowOrange)"/>
                    <line x1="430" y1="150" x2="450" y2="410" stroke="#FB8C00" stroke-width="2.5" marker-end="url(#arrowOrange)"/>
                    <line x1="370" y1="230" x2="405" y2="150" stroke="#FB8C00" stroke-width="2.5" marker-end="url(#arrowOrange)"/>

                    <!-- EXISTING NODES -->
                    <circle cx="130" cy="160" r="52" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1.5"/>
                    <text x="130" y="165" text-anchor="middle" fill="#374151" font-size="15" font-weight="600">Authors</text>

                    <circle cx="130" cy="400" r="52" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1.5"/>
                    <text x="130" y="393" text-anchor="middle" fill="#374151" font-size="15" font-weight="600">Insti-</text>
                    <text x="130" y="411" text-anchor="middle" fill="#374151" font-size="15" font-weight="600">tutions</text>

                    <circle cx="340" cy="280" r="55" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1.5"/>
                    <text x="340" y="276" text-anchor="middle" fill="#6B7280" font-size="13" font-weight="600" font-style="italic">'Author-</text>
                    <text x="340" y="293" text-anchor="middle" fill="#6B7280" font-size="13" font-weight="600" font-style="italic">ships'</text>

                    <circle cx="560" cy="260" r="65" fill="#F3F4F6" stroke="#9CA3AF" stroke-width="2"/>
                    <text x="560" y="265" text-anchor="middle" fill="#1A1A1A" font-size="18" font-weight="700">Works</text>

                    <circle cx="760" cy="195" r="48" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1.5"/>
                    <text x="760" y="200" text-anchor="middle" fill="#374151" font-size="15" font-weight="600">Sources</text>

                    <circle cx="460" cy="460" r="48" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1.5"/>
                    <text x="460" y="465" text-anchor="middle" fill="#374151" font-size="15" font-weight="600">Topics</text>

                    <!-- NEW NODES (orange) -->
                    <circle cx="420" cy="100" r="50" fill="#FFF3E0" stroke="#FB8C00" stroke-width="2.5"/>
                    <text x="420" y="105" text-anchor="middle" fill="#E65100" font-size="15" font-weight="700">Awards</text>

                    <circle cx="720" cy="70" r="52" fill="#FFF3E0" stroke="#FB8C00" stroke-width="2.5"/>
                    <text x="720" y="75" text-anchor="middle" fill="#E65100" font-size="15" font-weight="700">Funders</text>
                </svg>
            </div>
            <div class="graph-legend">
                <div class="legend-item"><div class="legend-dot" style="background: #D1D5DB;"></div> Existing OpenAlex entities</div>
                <div class="legend-item"><div class="legend-dot" style="background: #FB8C00;"></div> New funding entities</div>
                <div class="legend-item" style="font-style: italic; font-size: 0.8rem;">&lsquo;Authorships&rsquo; in quotes &mdash; term may not fully apply to award contributions; to be discussed</div>
            </div>
        </div>

        <!-- PIPELINE -->
        <div class="section" id="pipeline">
            <h2 class="section-header">Project Overview</h2>
            <p class="section-subtitle" style="margin-bottom: 0.75rem;">Three core activities:</p>
            <ul class="overview-bullets">
                <li>Ingesting award and funder metadata to create first-class entities in OpenAlex</li>
                <li>Creating linkages between those awards/funders and works through diverse methods &mdash; from funder-reported data to our own text mining</li>
                <li>Understanding funder use cases to ensure that project development delivers solutions for the funding community</li>
            </ul>

            <!-- HIGH-LEVEL SCHEMATIC -->
            <div class="pipeline-overview">
                <svg viewBox="0 0 940 350" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
                    <defs>
                        <marker id="a1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#1E88E5"/></marker>
                        <marker id="a2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#43A047"/></marker>
                        <marker id="a4" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#8E24AA"/></marker>
                    </defs>

                    <!-- INGEST -->
                    <rect x="0" y="10" width="200" height="230" rx="8" fill="#FAFAFA" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                    <text x="100" y="32" text-anchor="middle" fill="#9CA3AF" font-size="10" font-weight="600" letter-spacing="0.5">INGEST METADATA</text>

                    <rect x="12" y="46" width="176" height="28" rx="5" fill="#E3F2FD" stroke="rgba(30,136,229,0.25)" stroke-width="0.5"/>
                    <text x="100" y="65" text-anchor="middle" fill="#1E88E5" font-size="11" font-weight="600">Direct from Funders</text>

                    <rect x="12" y="82" width="176" height="28" rx="5" fill="#E3F2FD" stroke="rgba(30,136,229,0.25)" stroke-width="0.5"/>
                    <text x="100" y="101" text-anchor="middle" fill="#1E88E5" font-size="11" font-weight="600">Aggregators (e.g. Crossref)</text>

                    <rect x="12" y="122" width="176" height="22" rx="4" fill="#F5F5F5"/>
                    <text x="100" y="137" text-anchor="middle" fill="#9CA3AF" font-size="9.5" font-weight="500">Funder registry (names, aliases, IDs)</text>

                    <text x="100" y="165" text-anchor="middle" fill="#52525B" font-size="10" font-weight="600">= Normalized Award Objects</text>
                    <text x="100" y="180" text-anchor="middle" fill="#9CA3AF" font-size="9">as first-class entities in OpenAlex</text>

                    <!-- Arrow Ingest → Linkage -->
                    <line x1="200" y1="125" x2="235" y2="125" stroke="#1E88E5" stroke-width="1.5" marker-end="url(#a1)"/>

                    <!-- CREATE LINKAGES -->
                    <rect x="245" y="10" width="380" height="230" rx="8" fill="#FAFAFA" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                    <text x="435" y="32" text-anchor="middle" fill="#9CA3AF" font-size="10" font-weight="600" letter-spacing="0.5">CREATE LINKAGES (Awards/Funders ↔ Works)</text>

                    <rect x="258" y="46" width="170" height="40" rx="5" fill="#E8F5E9" stroke="rgba(67,160,71,0.25)" stroke-width="0.5"/>
                    <text x="343" y="63" text-anchor="middle" fill="#43A047" font-size="10.5" font-weight="600">Funder-Reported</text>
                    <text x="343" y="78" text-anchor="middle" fill="#43A047" font-size="9">Trusted linkages from funders</text>

                    <rect x="438" y="46" width="176" height="40" rx="5" fill="#E8F5E9" stroke="rgba(67,160,71,0.25)" stroke-width="0.5"/>
                    <text x="526" y="63" text-anchor="middle" fill="#43A047" font-size="10.5" font-weight="600">Aggregator-Asserted</text>
                    <text x="526" y="78" text-anchor="middle" fill="#43A047" font-size="9">Accepted from Crossref et al.</text>

                    <rect x="258" y="96" width="356" height="50" rx="5" fill="#E3F2FD" stroke="rgba(30,136,229,0.25)" stroke-width="0.5"/>
                    <text x="436" y="115" text-anchor="middle" fill="#1E88E5" font-size="10.5" font-weight="600">OpenAlex Text Mining (award IDs + funder names)</text>
                    <text x="436" y="132" text-anchor="middle" fill="#1E88E5" font-size="9">Full-text PDFs • Ngrams corpus • Landing pages</text>

                    <rect x="258" y="156" width="356" height="40" rx="5" fill="#FFF3E0" stroke="rgba(251,140,0,0.25)" stroke-width="0.5"/>
                    <text x="436" y="173" text-anchor="middle" fill="#FB8C00" font-size="10.5" font-weight="600">Vector Embedding Similarity (Year 2)</text>
                    <text x="436" y="188" text-anchor="middle" fill="#FB8C00" font-size="9">Suggested links → Faculty validation app</text>

                    <text x="435" y="218" text-anchor="middle" fill="#52525B" font-size="9.5" font-weight="500">Each method produces Work ↔ Award or Work ↔ Funder links with provenance</text>

                    <!-- Arrow Linkages → Graph -->
                    <line x1="625" y1="125" x2="660" y2="125" stroke="#43A047" stroke-width="1.5" marker-end="url(#a2)"/>

                    <!-- OUTPUTS -->
                    <rect x="670" y="10" width="260" height="230" rx="8" fill="#FAFAFA" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                    <text x="800" y="32" text-anchor="middle" fill="#9CA3AF" font-size="10" font-weight="600" letter-spacing="0.5">OUTPUTS</text>

                    <rect x="684" y="46" width="232" height="40" rx="5" fill="#E8F5E9" stroke="rgba(67,160,71,0.3)" stroke-width="0.5"/>
                    <text x="800" y="64" text-anchor="middle" fill="#43A047" font-size="12" font-weight="700">OpenAlex Graph</text>
                    <text x="800" y="80" text-anchor="middle" fill="#9CA3AF" font-size="9">Awards &amp; Funders as first-class entities</text>

                    <rect x="684" y="96" width="232" height="30" rx="5" fill="#F5F5F5"/>
                    <text x="800" y="115" text-anchor="middle" fill="#52525B" font-size="10" font-weight="500">Confirmed + Validated links</text>

                    <rect x="684" y="136" width="232" height="30" rx="5" fill="#FFF3E0"/>
                    <text x="800" y="155" text-anchor="middle" fill="#FB8C00" font-size="10" font-weight="500">Funder databases (dual flow)</text>

                    <rect x="684" y="176" width="232" height="24" rx="5" fill="#F3E5F5"/>
                    <text x="800" y="192" text-anchor="middle" fill="#8E24AA" font-size="9.5" font-weight="500">Confidence scores + provenance</text>

                    <!-- Arrow Outputs → Downstream -->
                    <line x1="800" y1="240" x2="800" y2="265" stroke="#8E24AA" stroke-width="1.5" marker-end="url(#a4)"/>

                    <!-- DOWNSTREAM USES -->
                    <rect x="670" y="275" width="260" height="65" rx="8" fill="#F3E5F5" stroke="rgba(142,36,170,0.25)" stroke-width="1"/>
                    <text x="800" y="295" text-anchor="middle" fill="#8E24AA" font-size="10" font-weight="600" letter-spacing="0.5">DOWNSTREAM USES</text>
                    <text x="800" y="312" text-anchor="middle" fill="#6A1B9A" font-size="9">Researchers studying funding flows</text>
                    <text x="800" y="326" text-anchor="middle" fill="#6A1B9A" font-size="9">Funder due diligence • Funding strategy design &amp; evaluation</text>
                </svg>
            </div>

            <h3 style="font-size: 1.1rem; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 1.25rem;">Detailed Breakdown</h3>

            <!-- Stage 1: Ingesting Award & Funder Metadata -->
            <div class="stage">
                <div class="stage-header">
                    <div class="stage-num" style="background: var(--f26-blue-light); color: var(--f26-blue);">1</div>
                    <div class="stage-title">Ingesting Award &amp; Funder Metadata</div>
                    <span class="f26-badge badge-active">Year 1 &mdash; Active</span>
                </div>
                <div class="stage-desc">Pull funding metadata from funders and aggregators to create <strong>research awards as first-class entities</strong> in OpenAlex. A curated funder registry (names, aliases, IDs, hierarchies) supports matching across the pipeline.</div>
                <div class="grid-2">
                    <div class="f26-card">
                        <h4>Direct from Funders</h4>
                        <ul>
                            <li>Award ID</li>
                            <li>Title and project description</li>
                            <li>Award/funding program</li>
                            <li>Funder</li>
                            <li>Amount, PI, institution</li>
                            <li>Funded outputs (when available)</li>
                        </ul>
                        <div class="f26-callout">See <a href="https://github.com/ourresearch/openalex-walden/blob/main/plans/awards/funder-ingestion-tracker.md" target="_blank">funder ingestion tracker</a> for current status.</div>
                    </div>
                    <div class="f26-card">
                        <h4>From Aggregators, e.g.,</h4>
                        <ul>
                            <li><a href="https://www.crossref.org/" target="_blank">Crossref</a></li>
                            <li><a href="https://datacite.org/" target="_blank">DataCite</a></li>
                            <li><a href="https://www.ukri.org/what-we-do/what-we-have-funded/gateway-to-research/" target="_blank">Gateway to Research</a></li>
                            <li><a href="https://europepmc.org/" target="_blank">Europe PMC</a></li>
                        </ul>
                        <div class="f26-callout">Where possible, directly from funders is preferred and that metadata gets preference when harmonizing multiple records of the same award from different sources.</div>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <div class="tracker-card">
                        <h4><span style="color: var(--f26-green);">&#x25CF;</span> Ingestion Progress <span class="count">~5.5M awards ingested to date</span></h4>
                        <p>38 funders completed: NIH (2.28M awards), NSF (644K), KAKEN/Japan (874K), DFG (144K), FAPESP (113K), Gateway to Research (164K), SNSF (90K), CIHR (82K), European Commission (81K), DoD (78K), DOE (52K), Innovate UK (41K), NASA (42K), ARC (34K), ANR (34K), Wellcome (20K), ERC (18K), NSERC (201K), NWO (15K), NHMRC (12K), Gates Foundation, SSHRC, Vinnova, FWF, and others.</p>
                        <p style="margin-top: 0.5rem;">See the <a href="https://github.com/ourresearch/openalex-walden/blob/main/plans/awards/funder-ingestion-tracker.md" target="_blank">funder ingestion tracker</a> for upcoming work planned, including 60+ additional funders (research prizes, US philanthropic foundations, and international funders from Asia, Africa, Latin America, and Middle East).</p>
                    </div>
                </div>
            </div>

            <!-- Stage 2: Creating Linkages -->
            <div class="stage">
                <div class="stage-header">
                    <div class="stage-num" style="background: var(--f26-green-light); color: var(--f26-green);">2</div>
                    <div class="stage-title">Creating Linkages Between Awards/Funders &amp; Works</div>
                    <span class="f26-badge badge-active">Year 1 + 2</span>
                </div>
                <div class="stage-desc">We create linkages through diverse methods. These linkages can come directly from funders, can come from aggregators who have inferred funder-output linkages, but most will be newly inferred linkages created by OpenAlex.</div>

                <h4 style="margin-bottom: 0.75rem;">Sources of Linkage (by trust level)</h4>
                <div class="grid-3" style="margin-bottom: 1.25rem;">
                    <div class="trust-card">
                        <h5 style="color: var(--f26-green);">Funder-Reported</h5>
                        <p>When funders provide a list of publications linked to individual awards, we trust that linkage and create a direct Work&ndash;Award connection. This is a rich source of information provided by millions of researchers around the globe, so whether it&rsquo;s well-structured metadata or unstructured text, we&rsquo;re happy to leverage this metadata when possible.</p>
                        <span class="trust-badge" style="background: var(--f26-green-light); color: var(--f26-green);">Trusted</span>
                    </div>
                    <div class="trust-card">
                        <h5 style="color: var(--f26-blue);">Aggregator-Asserted</h5>
                        <p>When Crossref or another aggregator (e.g., DataCite, Gateway to Research) has asserted an award&ndash;work connection, we accept that linkage.</p>
                        <span class="trust-badge" style="background: var(--f26-blue-light); color: var(--f26-blue);">Accepted</span>
                    </div>
                    <div class="trust-card">
                        <h5 style="color: var(--f26-purple);">OpenAlex-Inferred</h5>
                        <p>We mine full-text PDFs, Ngrams corpus, and landing pages to find award IDs and funder names, creating our own linkages.</p>
                        <span class="trust-badge" style="background: var(--f26-purple-light); color: var(--f26-purple);">Inferred</span>
                    </div>
                </div>

                <h4 style="margin-bottom: 0.75rem;">OpenAlex-Inferred Methods</h4>
                <div class="grid-3">
                    <div class="f26-card">
                        <h4>Award ID Matching</h4>
                        <ul>
                            <li>Mine text sources for funding acknowledgement sections</li>
                            <li>Extract award ID patterns (e.g., NSF #1234567)</li>
                            <li>Creates Work &rarr; Award links</li>
                            <li>Creates Work &rarr; Funder links (when we know the funder of that award)</li>
                        </ul>
                    </div>
                    <div class="f26-card">
                        <h4>Funder Name Matching</h4>
                        <ul>
                            <li>Even when no award ID is present</li>
                            <li>Match funder names &amp; aliases from registry against text</li>
                            <li>Creates Work &rarr; Funder links</li>
                        </ul>
                    </div>
                    <div class="f26-card">
                        <h4>Vector Embedding Similarity</h4>
                        <ul>
                            <li>Compare award vs. publication embeddings</li>
                            <li>Constrained to same-author pairs</li>
                            <li>Suggested links for validation</li>
                        </ul>
                        <div class="f26-callout" style="border-left-color: var(--f26-orange);">Experimental for Year 2. Will require validation, but seems like a promising way to assert linkages beyond award reporting periods and for publications where formal acknowledgement was not accessible or omitted.</div>
                    </div>
                </div>

                <div class="f26-callout" style="margin-top: 1rem; border-left-color: var(--f26-blue);">
                    <strong>Text sources for mining:</strong> Full-text PDFs, Ngrams corpus, and publisher landing pages.
                </div>
            </div>

            <!-- Stage 3: Validation App -->
            <div class="stage">
                <div class="stage-header">
                    <div class="stage-num" style="background: var(--f26-orange-light); color: var(--f26-orange);">3</div>
                    <div class="stage-title">Funder Validation App</div>
                    <span class="f26-badge badge-planned">Year 2 &mdash; Planned</span>
                </div>
                <div class="stage-desc">Faculty-facing tool integrated into award reporting software to validate suggested linkages from the embedding similarity method.</div>
                <div class="grid-3">
                    <div class="f26-card">
                        <h4>Faculty Review</h4>
                        <ul>
                            <li>Suggested award &harr; publication linkages</li>
                            <li>Simple Yes / No confirmation</li>
                            <li>Replaces manual copy-paste in reporting</li>
                            <li>Captures publications beyond the 1-year post-award reporting window</li>
                        </ul>
                    </div>
                    <div class="f26-card">
                        <h4>Integration &amp; Feedback</h4>
                        <ul>
                            <li>Plugs into existing reporting software</li>
                            <li>Validated pairs feed back into model</li>
                            <li>Rejected pairs improve suggestions</li>
                        </ul>
                    </div>
                    <div class="f26-card">
                        <h4>Local Deployment</h4>
                        <ul>
                            <li>Deployed within funder reporting systems</li>
                            <li>Confirmed linkages flow into OpenAlex <em>and</em> funder databases</li>
                            <li>Dual benefit: open graph + funder records</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- WORKSHOP DISCUSSION -->
        <div class="section" id="discussion">
            <h2 class="section-header">Workshop Discussion Points</h2>
            <p class="section-subtitle">Key questions to address for each component &mdash; evaluation, tradeoffs, and open decisions.</p>
            <div class="discussion-grid">
                <div class="discussion-card">
                    <h3>1. Award &amp; Funder Ingestion</h3>
                    <ul>
                        <li>Which funders do we prioritize? Coverage vs. effort tradeoff</li>
                        <li>Schema normalization across heterogeneous APIs/data dumps</li>
                        <li>Update cadence &mdash; how often do we re-ingest?</li>
                        <li>Handling outputs that conflict across sources</li>
                        <li>Which aggregators give the best incremental coverage?</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>2. Linkage Methods</h3>
                    <ul>
                        <li>Promise and limits of our matching methods (PDFs, Ngrams, landing pages, closed-access literature)</li>
                        <li>Award ID pattern recognition &mdash; how to add new ones?</li>
                        <li>Funder name disambiguation across languages/contexts</li>
                        <li>Precision vs. recall tradeoffs for each method</li>
                        <li>Evaluation against gold-standard annotated sets</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>3. Funder Use Cases &amp; Goals</h3>
                    <ul>
                        <li>What do funders most want over the next 2&ndash;3 years?</li>
                        <li>Which linkages are most valuable for funder workflows?</li>
                        <li>Mapping use cases against our roadmap &mdash; are we on the right track?</li>
                        <li>New interventions or pivots needed?</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>4. Embeddings &amp; Validation Apps</h3>
                    <ul>
                        <li>Similarity threshold tuning and precision/recall</li>
                        <li>Constraining candidate pairs (authors, institution, timeframe)</li>
                        <li>Identifying partners willing to pilot with us</li>
                        <li>Local apps within funder systems vs. OpenAlex as the hub?</li>
                        <li>In-bound API to assert linkages in OpenAlex</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>5. Scaling &amp; Community</h3>
                    <ul>
                        <li>Beyond ingestion: what community work brings new funders on board?</li>
                        <li>Convincing funders to share datasets for the first time</li>
                        <li>Building the ecosystem around open funding metadata</li>
                    </ul>
                </div>
                <div class="discussion-card">
                    <h3>6. Long-Term Sustainability</h3>
                    <ul>
                        <li>OpenAlex model: grants build open infrastructure, premium services sustain</li>
                        <li>What might sustainability look like from a funder perspective?</li>
                        <li>Which premium services would funders value?</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- LONDON WORKSHOP SCHEDULE -->
        <div class="section" id="schedule">
            <h2 class="section-header">London Workshop Schedule</h2>
            <p class="section-subtitle">April 27&ndash;28, 2026 &mdash; Four blocks: (1) funder perspectives and project overview, (2) pipeline deep dive &mdash; ingestion and linkages, (3) funder use cases mapped against our roadmap, and (4) the broader future &mdash; embeddings, reporting apps, scaling, and long-term sustainability.</p>

            <!-- DAY 1 -->
            <div class="day-card">
                <h3>Day 1 &mdash; Sunday, April 27, 2026</h3>
                <p class="day-theme">Funder perspectives, project overview, and deep dive into the pipeline.</p>

                <div class="sched-block">
                    <div class="sched-time">Morning</div>
                    <div class="sched-content">
                        <h4>Welcome &amp; Funder Perspectives</h4>
                        <p>Setting the scene: why we're here, what each funder has learned, and how OpenAlex plans to tackle this.</p>
                        <ul style="margin-top: 0.5rem;">
                            <li>Welcome &amp; introductions (OpenAlex + Wellcome, with Wellcome staff discussing their rationale, goals, hopes, and ambitions for the project)</li>
                            <li>Funder presentation: NWO &mdash; where they are, what they've tried, what's worked, what challenges remain</li>
                            <li>Funder presentation: FWF &mdash; their work with Crossref, the Barcelona Declaration, and open funding metadata</li>
                            <li>Funder presentation: Wellcome Analytics &mdash; their experience tracking funded outputs and current challenges</li>
                            <li>Funder presentation: TBD (to be confirmed)</li>
                            <li>Open floor &mdash; brief opportunity for other funders to share anything important not yet covered</li>
                            <li>OpenAlex: project overview &amp; our approach &mdash; the three core activities, how they fit together, and results from previous pilot studies</li>
                        </ul>
                        <span class="f26-tag tag-discuss">overview</span><span class="f26-tag tag-presentation">presentations</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">Afternoon</div>
                    <div class="sched-content">
                        <h4>Pipeline Deep Dive</h4>
                        <p>Reviewing what we've done so far and our approach to each major part of the pipeline, followed by discussion.</p>
                        <ul style="margin-top: 0.5rem;">
                            <li><strong>Ingesting award &amp; funder metadata</strong> (~1 hr) &mdash; funder partnerships, aggregators, schema normalization, making awards first-class entities; discussion on funder prioritization, update cadence, handling conflicting records</li>
                            <li><strong>Creating linkages</strong> (~1 hr) &mdash; promise and limits of our matching methods (PDFs, Ngrams, landing pages, closed-access literature); funder-reported and aggregator-asserted links; pattern recognition, disambiguation, precision/recall tradeoffs</li>
                            <li>Day 1 recap &amp; open questions</li>
                        </ul>
                        <span class="f26-tag tag-pipeline">pipeline</span><span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">Evening</div>
                    <div class="sched-content">
                        <h4>Social Mixer</h4>
                        <p>Informal evening gathering. Venue TBD.</p>
                        <span class="f26-tag tag-break">social</span>
                    </div>
                </div>
            </div>

            <!-- DAY 2 -->
            <div class="day-card">
                <h3>Day 2 &mdash; Monday, April 28, 2026</h3>
                <p class="day-theme">Funder use cases, the broader future of the project, and sustainability.</p>

                <div class="sched-block">
                    <div class="sched-time">Morning</div>
                    <div class="sched-content">
                        <h4>Funder Use Cases &amp; Goals</h4>
                        <p>Extended session (~2 hrs). All the ways funders want to use the data, mapped against our current roadmap. Are we heading in the right direction, or are pivots needed?</p>
                        <ul style="margin-top: 0.5rem;">
                            <li>Day 1 recap</li>
                            <li>What do funders most want from this infrastructure over the next 2&ndash;3 years?</li>
                            <li>Which linkages are most valuable for funder workflows?</li>
                            <li>Mapping use cases against our roadmap &mdash; explicitly identifying any new interventions or pivots needed</li>
                            <li>What new solutions could open funding data enable?</li>
                        </ul>
                        <span class="f26-tag tag-usecases">use cases</span><span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
                <div class="sched-block">
                    <div class="sched-time">Afternoon</div>
                    <div class="sched-content">
                        <h4>The Broader Future</h4>
                        <p>Looking ahead: Year 2 methods, new infrastructure, growing the community, and making this sustainable.</p>
                        <ul style="margin-top: 0.5rem;">
                            <li><strong>Vector embeddings &amp; evaluation</strong> &mdash; the proposed similarity method for Year 2; threshold tuning, constraining candidate pairs, identifying pilot partners, in-bound API to assert linkages</li>
                            <li><strong>The future of award reporting</strong> &mdash; building apps that run locally within funder systems to facilitate reporting and push to OpenAlex, or should OpenAlex be the hub?</li>
                            <li><strong>Read-out from Funding Flows Workshop</strong> &mdash; key takeaways from the Wellcome-hosted Funding Flows Workshop the previous Thursday/Friday</li>
                            <li><strong>The role of other aggregators</strong> &mdash; how aggregators like Crossref, Europe PMC, and Gateway to Research create links between grants/funders and research outputs, and how to ensure interoperability</li>
                            <li><strong>Scaling &amp; community building</strong> &mdash; beyond ingestion, what community work brings new funders on board? Convincing funders to share datasets for the first time</li>
                            <li><strong>Long-term sustainability</strong> &mdash; the OpenAlex model (grants build open infrastructure, premium services sustain it); what might this look like from a funder perspective?</li>
                            <li>Closing &amp; next steps &mdash; decisions, action items with owners and deadlines</li>
                        </ul>
                        <span class="f26-tag tag-planning">planning</span><span class="f26-tag tag-discuss">discussion</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- TRAVEL -->
        <div class="section" id="travel">
            <h2 class="section-header">Travel</h2>
            <p class="section-subtitle">More information with details on the venue, accommodations, and travel tips will be posted soon.</p>
        </div>

        <div class="invite-note">
            Space is limited and participation is by invitation only. If you are a funder interested in this topic, please contact <a href="mailto:kyle@openalex.org">kyle@openalex.org</a>.
        </div>

        <footer class="f26-footer">
            Enriching OpenAlex with Comprehensive Grant Metadata &mdash; London Workshop, April 27&ndash;28, 2026
        </footer>
    </div>
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({
  name: 'Funders2026Page',
});

useHead({ title: 'Enriching OpenAlex with Comprehensive Grant Metadata — London Workshop 2026' });
</script>

<style scoped>
/* ── CSS VARIABLES (scoped to this page) ── */
.funders2026-page {
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

/* ── DRAFT BANNER ── */
.draft-banner {
    background: var(--f26-orange-light);
    border-bottom: 2px solid var(--f26-orange);
    color: #E65100;
    font-size: 0.88rem;
    padding: 0.6rem 2rem;
    text-align: center;
}
.draft-banner-label {
    display: inline-block;
    background: var(--f26-orange);
    color: white;
    font-weight: 700;
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    margin-right: 0.5rem;
    letter-spacing: 0.05em;
    vertical-align: middle;
}

/* ── CONTAINER ── */
.f26-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

.funders2026-page a { color: var(--f26-link); text-decoration: none; }
.funders2026-page a:hover { text-decoration: underline; }

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
.funders2026-page header {
    text-align: center;
    padding: 3.5rem 0 2.5rem;
    border-bottom: 0.5px solid var(--f26-border);
    margin-bottom: 3rem;
}
.funders2026-page header h1 {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--f26-primary);
    margin-bottom: 0.75rem;
}
.funders2026-page header .subtitle {
    color: var(--f26-text-secondary);
    font-size: 1.05rem;
    max-width: 680px;
    margin: 0 auto 1.25rem;
    line-height: 1.7;
}
.funders2026-page header .meta {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
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

.f26-callout {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--f26-surface2);
    border-left: 3px solid var(--f26-text-muted);
    border-radius: 0 6px 6px 0;
    font-size: 0.82rem;
    color: var(--f26-text-secondary);
}
.f26-callout a { color: var(--f26-link); }

/* ── GRID LAYOUTS ── */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }

/* ── OVERVIEW BULLETS ── */
.overview-bullets {
    list-style: none;
    padding: 0;
    margin-bottom: 2rem;
    max-width: 750px;
}
.overview-bullets li {
    color: var(--f26-text-secondary);
    font-size: 0.95rem;
    padding: 0.3rem 0 0.3rem 1.25rem;
    position: relative;
    line-height: 1.6;
}
.overview-bullets li::before {
    content: '\2022';
    position: absolute;
    left: 0;
    color: var(--f26-text-muted);
}

/* ── PIPELINE OVERVIEW (SVG) ── */
.pipeline-overview {
    background: var(--f26-surface);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 2.5rem;
}
.pipeline-overview svg { display: block; width: 100%; height: auto; }

/* ── STAGE CARDS ── */
.stage {
    background: var(--f26-bg);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    padding: 1.75rem;
    margin-bottom: 1.25rem;
    transition: border-color 0.15s ease;
}
.stage:hover { border-color: var(--f26-border-strong); }
.stage-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}
.stage-num {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
}
.stage-title {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.01em;
}
.f26-badge {
    margin-left: auto;
    padding: 0.2rem 0.6rem;
    border-radius: 5px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.badge-active { background: var(--f26-green-light); color: var(--f26-green); }
.badge-planned { background: var(--f26-orange-light); color: var(--f26-orange); }
.stage-desc {
    color: var(--f26-text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1.25rem;
}

/* ── LINKAGE TRUST CARDS ── */
.trust-card {
    background: var(--f26-bg);
    border: 0.5px solid var(--f26-border);
    border-radius: 8px;
    padding: 1rem 1.25rem;
}
.trust-card h5 {
    font-size: 0.88rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
}
.trust-card p {
    font-size: 0.84rem;
    color: var(--f26-text-secondary);
}
.trust-badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 0.4rem;
}

/* ── ENTITY GRAPH ── */
.graph-container {
    background: var(--f26-surface);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    padding: 1.5rem;
}
.graph-container svg { display: block; width: 100%; height: auto; }
.graph-legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;
    flex-wrap: wrap;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: var(--f26-text-secondary);
}
.legend-dot { width: 12px; height: 12px; border-radius: 50%; }

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
    width: 100px;
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
.tag-pipeline { background: var(--f26-blue-light); color: var(--f26-blue); }
.tag-discuss { background: var(--f26-purple-light); color: var(--f26-purple); }
.tag-break { background: var(--f26-surface2); color: var(--f26-text-muted); }
.tag-hands-on { background: var(--f26-green-light); color: var(--f26-green); }
.tag-planning { background: var(--f26-orange-light); color: var(--f26-orange); }
.tag-presentation { background: var(--f26-red-light); color: var(--f26-red); }
.tag-usecases { background: var(--f26-teal-light); color: var(--f26-teal); }

/* ── TRACKER ── */
.tracker-card {
    background: var(--f26-surface);
    border: 0.5px solid var(--f26-border);
    border-radius: 8px;
    padding: 1rem 1.25rem;
}
.tracker-card h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
.tracker-card .count { margin-left: auto; font-size: 0.78rem; color: var(--f26-text-muted); font-weight: 400; }
.tracker-card p { color: var(--f26-text-secondary); font-size: 0.82rem; line-height: 1.5; }

/* ── INVITE NOTE ── */
.invite-note {
    margin-top: 3rem;
    padding: 1.25rem 1.5rem;
    background: var(--f26-surface);
    border: 0.5px solid var(--f26-border);
    border-radius: 10px;
    font-size: 0.9rem;
    color: var(--f26-text-secondary);
    text-align: center;
}

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
    .funders2026-page header h1 { font-size: 1.5rem; }
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
    .sched-block { flex-direction: column; gap: 0.4rem; }
    .sched-time { width: auto; }
}
</style>

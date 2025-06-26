const exampleQueries = [
  {
    question: "What journals does OpenAlex index?",
    type: "sources",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "sources",
      "filter_works": [],
      "filter_aggs": [
        {
          "column_id": "type",
          "value": "source-types/journal"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What repositories does OpenAlex index?",
    type: "sources",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "sources",
      "filter_works": [],
      "filter_aggs": [
        {
          "column_id": "type",
          "value": "source-types/repository"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What work does Moss Landing Marine Labs produce?",
    type: "works",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "works",
      "filter_works": [
        {
          "column_id": "authorships.institutions.lineage",
          "value": "institutions/I95850191"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "publication_year",
        "type",
        "cited_by_count"
      ],
      "sort_by_column": "cited_by_count",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What topics does Kyle Demes work on?",
    type: "topics",
    category: "trend detection",
    url: "/s/7510b68ca5533131792d514e75762eca",
    query: {
      get_rows: "topics",
      filter_works: [
        {
          column_id: "authorships.author.id",
          value: "authors/A5086928770"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "What keywords does Kyle Demes use in his work?",
    type: "keywords",
    category: "trend detection",
    url: "",
    query: {
      "get_rows": "keywords",
      "filter_works": [
        {
          "column_id": "authorships.author.id",
          "value": "authors/A5086928770"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "id",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which universities in Austria have the highest percentage of Open Access works?",
    type: "institutions",
    category: "open access",
    url: "/s/cc7fffa97cdab1b7c115b599e29002cc",
    query: {
      "get_rows": "institutions",
      "filter_works": [],
      "filter_aggs": [
        {
          "column_id": "country_code",
          "value": "countries/AT"
        },
        {
          "column_id": "type",
          "value": "institution-types/education",
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)",
        "percent(is_open_access)"
      ],
      "sort_by_column": "percent(is_open_access)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What are the highest cited publications at Memorial University of Newfoundland?",
    type: "sources",
    category: "discovery",
    url: "/s/1ed60ea4043ab333bd102d8af5e759b6",
    query: {
      get_rows: "sources",
      filter_works: [],
      filter_aggs: [
        {
          column_id: "type",
          value: "source-types/journal"
        },
        {
          column_id: "host_organization",
          value: "publishers/P4310312908"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)",
        "sum(citations)"
      ],
      sort_by_column: "sum(citations)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which journals have the highest APC fees?",
    type: "sources",
    category: "discovery",
    url: "/s/8c6d197386e1a445d0fea7367769a012",
    query: {
      "get_rows": "sources",
      "filter_works": [],
      "filter_aggs": [
        {
          "column_id": "type",
          "value": "source-types/journal",
          "operator": "is"
        },
        {
          "column_id": "apc_usd",
          "value": ">0",
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "apc_usd",
        "count(works)",
      ],
      "sort_by_column": "apc_usd",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Who are Stephen Hawking's top co-authors?",
    type: "authors",
    category: "discovery",
    url: "",
    query: {
      get_rows: "authors",
      filter_works: [
        {
          column_id: "authorships.author.id",
          value: "authors/A5066175077"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "What topics does the University of Minnesota publish on in business?",
    type: "topics",
    category: "discovery",
    url: "/s/e4176eb0c00fc2b56064172880ec7d23",
    query: {
      get_rows: "topics",
      filter_works: [
        {
          column_id: "primary_topic.field.id",
          value: "fields/14"
        },
        {
          column_id: "authorships.institutions.lineage",
          value: "institutions/I130238516"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which fields does UT Austin have the highest FWCI in?",
    type: "fields",
    category: "discovery",
    url: "/s/13cd602f1dccac39794da7d20bd90f5a",
    query: {
      get_rows: "fields",
      filter_works: [
        {
          column_id: "authorships.institutions.lineage",
          value: "institutions/I86519309"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)",
        "mean(fwci)"
      ],
      sort_by_column: "mean(fwci)",
      sort_by_order: "desc"
    }
  },
  {
    question: "What is the breakdown of books in OpenAlex by field?",
    type: "fields",
    category: "discovery",
    url: "/s/78ffeccab3d0af95e83f73edcedc67ff",
    query: {
      get_rows: "fields",
      filter_works: [
        {
          column_id: "type",
          value: "types/book"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Who does NASA collaborate with most?",
    type: "institutions",
    category: "discovery",
    url: "",
    query: {
      get_rows: "institutions",
      filter_works: [
        {
          column_id: "authorships.institutions.lineage",
          value: "institutions/I4210124779"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which countries focus the most on SDG 5?",
    type: "countries",
    category: "discovery",
    url: "/s/843d1b2a306bf2e29800ff4fee37cafb",
    query: {
      get_rows: "countries",
      filter_works: [
        {
          value: "sdgs/5",
          column_id: "sustainable_development_goals.id"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which institutions has Claudia Goldin worked at?",
    type: "institutions",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [],
      "filter_aggs": [
        {
          "column_id": "id",
          "value": "authors/A5000387389",
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "affiliations.institution.display_name"
      ],
      "sort_by_column": "display_name",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Who are the world experts on macrocytosis?",
    type: "authors",
    category: "expert discovery",
    url: "",
    query: {
      get_rows: "authors",
      filter_works: [
        {
          column_id: "keywords.id",
          value: "keywords/macrocytosis"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "How many authors in Brazil have an ORCID?",
    type: "authors",
    category: "compliance",
    url: "",
    query: {
      get_rows: "authors",
      filter_works: [],
      filter_aggs: [
        {
          column_id: "last_known_institutions.country_code",
          value: "countries/BR"
        },
        {
          column_id: "has_orcid",
          value: true
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which works from the University of Washington and funded by the National Institute of Health are closed access?",
    type: "works",
    category: "discovery",
    url: "/s/74b0898975eae60675fb246d70001544",
    query: {
      get_rows: "works",
      filter_works: [
        {
          column_id: "authorships.institutions.lineage",
          value: "institutions/I201448701"
        },
        {
          column_id: "grants.funder",
          value: "funders/F4320332161"
        },
        {
          column_id: "open_access.is_oa",
          value: false
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "publication_year",
        "type",
        "cited_by_count"
      ],
      sort_by_column: "cited_by_count",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which topics does the EU collaborate the most with the US on?",
    type: "topics",
    category: "discovery",
    url: "/s/c12f56579396372fab91e7a0b4965426",
    broken: true,
    error: "Continent Europe and EU are not the same",
    query: {
      get_rows: "topics",
      filter_works: [
        {
          column_id: "authorships.institutions.continent",
          value: "continents/Q46"
        },
        {
          column_id: "authorships.countries",
          value: "countries/US"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which authors at the University of British Columbia have made their datasets open access?",
    type: "authors",
    category: "compliance",
    url: "/s/9ea5afe3aff2325242ff32ca154eb280",
    query: {
      get_rows: "authors",
      filter_works: [
        {
          value: "types/dataset",
          column_id: "type"
        },
        {
          value: true,
          column_id: "open_access.is_oa"
        },
        {
          value: "institutions/I141945490",
          column_id: "authorships.institutions.lineage"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "How does Notre Dame University contribute to the Sustainable Development Goals?",
    type: "sdgs",
    category: "trend detection",
    url: "/s/05b3f84ef774454eb81721cbc91dc0f0",
    query: {
      get_rows: "sdgs",
      filter_works: [
        {
          column_id: "authorships.institutions.lineage",
          value: "institutions/I4210155817"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which researchers at the University College London publish the most work in Nature?",
    type: "authors",
    category: "expert discovery",
    url: "/s/7b83bc13e13e68354df8469f8906259a",
    query: {
      get_rows: "authors",
      filter_works: [
        {
          column_id: "primary_location.source.id",
          value: "sources/S137773608"
        }
      ],
      filter_aggs: [
        {
          column_id: "last_known_institutions.id",
          value: "institutions/I45129253"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which researchers at the University of Colorado have published the most work on SDG 13?",
    type: "authors",
    category: "expert discovery",
    url: "/s/772d344e411d30026434e0dc0f5e7844",
    query: {
      get_rows: "authors",
      filter_works: [
        {
          value: "sdgs/13",
          column_id: "sustainable_development_goals.id"
        }
      ],
      filter_aggs: [
        {
          value: "institutions/I188538660",
          column_id: "last_known_institutions.id"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which topics has the National Research Council of Canada funded the most research on at Dalhousie University?",
    type: "topics",
    category: "trend detection",
    url: "/s/6f275677f0df4a25a3756342036926c9",
    query: {
      get_rows: "topics",
      filter_works: [
        {
          column_id: "grants.funder",
          value: "funders/F4320334601"
        },
        {
          column_id: "authorships.institutions.lineage",
          value: "institutions/I129902397"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which researchers at Virginia Tech are collaborating with researchers in Ukraine?",
    type: "authors",
    category: "expert discovery",
    url: "/s/207fe1fcc0abd6ba07bba3168739f24c",
    query: {
      get_rows: "authors",
      filter_works: [
        {
          column_id: "authorships.countries",
          value: "countries/UA"
        }
      ],
      filter_aggs: [
        {
          column_id: "last_known_institutions.id",
          value: "institutions/I859038795"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which journals publish the highest cited research on coral bleaching?",
    type: "sources",
    category: "recommenders",
    url: "",
    query: {
      get_rows: "sources",
      filter_works: [
        {
          column_id: "keywords.id",
          value: "keywords/coral-bleaching"
        }
      ],
      filter_aggs: [
        {
          column_id: "type",
          value: "source-types/journal"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)",
        "sum(citations)"
      ],
      sort_by_column: "sum(citations)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which institutions in Japan collaborate the most with researchers in the Global South?",
    type: "institutions",
    category: "expert discovery",
    url: "/s/9ce42c599fe7278fe7a1a0f5c9888bd1",
    query: {
      get_rows: "institutions",
      filter_works: [
        {
          value: true,
          column_id: "authorships.institutions.is_global_south"
        }
      ],
      filter_aggs: [
        {
          value: "countries/JP",
          column_id: "country_code"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which authors at Simon Fraser University collaborate with researchers in Iran on Engineering research?",
    type: "authors",
    category: "collaboration",
    url: "/s/6b2f7eefbcbf7bee2ed74ab5ba8002ab",
    query: {
      get_rows: "authors",
      filter_works: [
        {
          value: "fields/22",
          column_id: "primary_topic.field.id"
        },
        {
          value: "countries/IR",
          column_id: "authorships.countries"
        }
      ],
      filter_aggs: [
        {
          value: "institutions/I18014758",
          column_id: "last_known_institutions.id"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which companies in Australia are working on hydrogen fuel cell development?",
    type: "institutions",
    category: "collaboration",
    url: "/s/41a5f22c1528a94f9273a93584279a7c",
    query: {
      get_rows: "institutions",
      filter_works: [
        {
          column_id: "primary_topic.id",
          value: "topics/T10409"
        }
      ],
      filter_aggs: [
        {
          column_id: "type",
          value: "institution-types/company"
        },
        {
          column_id: "country_code",
          value: "countries/AU"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which companies co-author research with academic institutions in Israel?",
    type: "institutions",
    category: "trend detection",
    url: "/s/a2755f7d707b96be8dbd4e3f510b5e0c",
    query: {
      get_rows: "institutions",
      filter_works: [
        {
          column_id: "authorships.countries",
          value: "countries/IL"
        }
      ],
      filter_aggs: [
        {
          column_id: "type",
          value: "institution-types/company"
        }
      ],
      show_columns: [
        "display_name",
        "count(works)"
      ],
      sort_by_column: "count(works)",
      sort_by_order: "desc"
    }
  },
  {
    question: "Which countries does Spain collaborate with on cybersecurity?",
    type: "countries",
    category: "collaboration",
    url: "",
    query: {
      "get_rows": "countries",
      "filter_works": [
        {
          "column_id": "authorships.countries",
          "value": "countries/ES"
        },
        {
          "join": "or",
          "filters": [
            {
              "column_id": "primary_topic.id",
              "value": "topics/T12221"
            },
            {
              "column_id": "primary_topic.id",
              "value": "topics/T12519",
              "operator": "is"
            },
            {
              "column_id": "primary_topic.id",
              "value": "topics/T13983",
              "operator": "is"
            },
            {
              "column_id": "primary_topic.id",
              "value": "topics/T10734",
              "operator": "is"
            },
            {
              "column_id": "primary_topic.id",
              "value": "topics/T10400",
              "operator": "is"
            },
            {
              "column_id": "primary_topic.id",
              "value": "topics/T12479",
              "operator": "is"
            },
            {
              "column_id": "primary_topic.id",
              "value": "topics/T10964",
              "operator": "is"
            }
          ]
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What research has MIT collaborated with the US government on?",
    type: "works",
    category: "collaboration",
    url: "/s/a6a646fe1315ac11f93610902cd3f9e3",
    query: {
      get_rows: "works",
      filter_works: [
        {
          column_id: "authorships.institutions.lineage",
          value: "institutions/I63966007"
        },
        {
          column_id: "authorships.institutions.type",
          value: "institution-types/government"
        }
      ],
      filter_aggs: [],
      show_columns: [
        "display_name",
        "publication_year",
        "type",
        "cited_by_count"
      ],
      sort_by_column: "cited_by_count",
      sort_by_order: "desc"
    }
  },
  {
    question: "Are there publications in the last five years from the University of Victoria that NSERC funded which are not open access?",
    type: "works",
    category: "compliance",
    url: "",
    query: {
      "get_rows": "works",
      "filter_works": [
        {
          "column_id": "authorships.institutions.lineage",
          "value": "institutions/I212119943"
        },
        {
          "column_id": "grants.funder",
          "value": "funders/F4320334593"
        },
        {
          "column_id": "publication_year",
          "value": "2020-2024"
        },
        {
          "column_id": "open_access.is_oa",
          "value": false
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "publication_year",
        "type",
        "cited_by_count"
      ],
      "sort_by_column": "cited_by_count",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Does anyone at the University of Toronto work on research that spans gender equality and public health policy?",
    type: "authors",
    category: "expert discovery",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "column_id": "sustainable_development_goals.id",
          "value": "sdgs/5",
        },
        {
          "column_id": "primary_topic.id",
          "value": "topics/T13099",
        }
      ],
      "filter_aggs": [
        {
          "column_id": "last_known_institutions.id",
          "value": "institutions/I185261750"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which researchers in the UK work on social science aspects of space exploration?",
    type: "authors",
    category: "expert discovery",
    url: "",
    broken: true,
    error: "Can't find any topic/keyword pairs that have data",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "join": "and",
          "filters": [
            {
              "column_id": "primary_topic.id",
              "value": "topics/t14214"
            },
            {
              "column_id": "keywords.id",
              "value": "keywords/social-sciences"
            },
          ]
        },
        {
          "column_id": "authorships.countries",
          "value": "countries/GB"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which authors at UNC Chapel Hill are experts in fields relating to climate change?",
    type: "authors",
    category: "expert discovery",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "column_id": "authorships.institutions.lineage",
          "value": "institutions/I114027177"
        },
        {
          "column_id": "sustainable_development_goals.id",
          "value": "sdgs/13"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which fisheries researchers in South Africa also work on governance?",
    type: "authors",
    category: "expert discovery",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "join": "or",
          "filters": [
            {
              "column_id": "primary_topic.id",
              "value": "topics/T14405"
            },
            {
              "column_id": "keywords.id",
              "value": "keywords/governance"
            }
          ]
        },
        {
          "column_id": "authorships.countries",
          "value": "countries/ZA"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What types of climate change research does the University of Arizona do?",
    type: "topics",
    category: "trend detection",
    url: "",
    query: {
      "get_rows": "topics",
      "filter_works": [
        {
          "column_id": "sustainable_development_goals.id",
          "value": "sdgs/13"
        },
        {
          "column_id": "authorships.institutions.lineage",
          "value": "institutions/I138006243"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which institutions have the most retracted works?",
    type: "institutions",
    category: "discovery",
    url: "",
    query:{
      "get_rows": "institutions",
      "filter_works": [
        {
          "column_id": "type",
          "value": "types/retraction",
          "operator": "is"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which people worked on indigenous research management for their graduate work in australian universities?",
    type: "authors",
    category: "expert discovery",
    url: "",
    broken: true,
    error: "This could be matching co-authors in Australia.",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "column_id": "type",
          "value": "types/dissertation",
          "operator": "is"
        },
        {
          "column_id": "primary_topic.id",
          "value": "topics/T10348",
          "operator": "is"
        },
        {
          "column_id": "authorships.countries",
          "value": "countries/AU",
          "operator": "is"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What topics do France and Germany collaborate on with the highest FWCI?",
    type: "topics",
    category: "collaboration",
    url: "",
    query: {
      "get_rows": "topics",
      "filter_works": [
        {
          "column_id": "authorships.countries",
          "value": "countries/FR",
          "operator": "includes"
        },
        {
          "column_id": "authorships.countries",
          "value": "countries/DE",
          "operator": "includes"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)",
        "mean(fwci)"
      ],
      "sort_by_column": "mean(fwci)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which institutional collaborations does the Universtiy of British Columbia have the highest FWCI with?",
    type: "institutions",
    category: "rankings",
    url: "",
    broken: true,
    error: "Wrong query.",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "column_id": "type",
          "value": "types/dataset"
        },
        {
          "column_id": "open_access.is_oa",
          "value": true
        }
      ],
      "filter_aggs": [
        {
          "column_id": "last_known_institutions.id",
          "value": "institutions/I141945490",
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which reserchers at UCSB have had publications retracted?",
    type: "authors",
    category: "compliance",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "column_id": "type",
          "value": "types/retraction",
          "operator": "is"
        }
      ],
      "filter_aggs": [
        {
          "column_id": "last_known_institutions.id",
          "value": "institutions/I154570441",
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which researchers at the University of Florida have received funding from the Chinese government?",
    type: "authors",
    category: "compliance",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "column_id": "grants.funder",
          "value": "funders/F4320335564",
          "operator": "includes"
        }
      ],
      "filter_aggs": [
        {
          "column_id": "last_known_institutions.id",
          "value": "institutions/I33213144",
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Where is Heather Piwowar at now?",
    type: "authors",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [],
      "filter_aggs": [
        {
          "column_id": "id",
          "value": "authors/A5048491430",
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "last_known_institutions.display_name",
        "count(works)",
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "How many authors are named Dugan O'Neil?",
    type: "authors",
    category: "discovery",
    url: "",
    query:{
      "get_rows": "authors",
      "filter_works": [],
      "filter_aggs": [
        {
          "column_id": "display_name",
          "value": "Dugan O'Neil",
          "operator": "contains"
        }
      ],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What institutions do resarchers who did their PhD at Leiden University work at now?",
    type: "authors",
    category: "trend detection",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [
        {
          "column_id": "type",
          "value": "types/dissertation",
          "operator": "is"
        },
        {
          "column_id": "authorships.institutions.lineage",
          "value": "institutions/I121797337",
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "last_known_institutions.display_name",
        "count(works)",
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What topics of research does the Russian Science Foundation fund the most research on?",
    type: "topics",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "topics",
      "filter_works": [
        {
          "column_id": "grants.funder",
          "value": "funders/F4320324099",
          "operator": "includes"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "count(works)"
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "What is the full affiliation history of a list of authors throughout their entire career?", 
    type: "authors",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "authors",
      "filter_works": [],
      "filter_aggs": [
        {
          "join": "or",
          "filters": [
            {
              "column_id": "id",
              "value": "authors/A5086928770",
              "operator": "is"
            },
            {
              "column_id": "id",
              "value": "authors/A5023888391",
              "operator": "is"
            },
            {
              "column_id": "id",
              "value": "authors/A5108860022",
              "operator": "is"
            }
          ]
        }
      ],
      "show_columns": [
        "display_name",
        "affiliations.institution.display_name",
        "count(works)",
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which Diamond OA journals do researchers in Mexico publish in?", 
    type: "sources",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "sources",
      "filter_works": [
        {
          "column_id": "authorships.countries",
          "value": "countries/MX",
          "operator": "includes"
        }
      ],
      "filter_aggs": [
        {
          "column_id": "type",
          "value": "source-types/journal",
          "operator": "is"
        },
        {
          "column_id": "apc_usd",
          "value": "0",
          "operator": "is"
        },
        {
          "column_id": "is_oa",
          "value": true,
          "operator": "is"
        }
      ],
      "show_columns": [
        "display_name",
        "apc_usd",
        "count(works)",
      ],
      "sort_by_column": "count(works)",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which publications authored by the University of Chicago have a fulltext pdf available in a repository?",
    type: "works",
    category: "open access",
    url: "",
    query: {
      "get_rows": "works",
      "filter_works": [
        {
          "column_id": "authorships.institutions.lineage",
          "value": "institutions/I40347166",
        },
        {
          "column_id": "open_access.has_fulltext",
          "value": true,
          "operator": "is"
        },
        {
          "column_id": "primary_location.source.type",
          "value": "source-types/repository",
          "operator": "is"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "id",
        "publication_year",
        "type",
        "cited_by_count"
      ],
      "sort_by_column": "cited_by_count",
      "sort_by_order": "desc"
    }
  },
  {
    question: "Which works in pharmaceutical sciences have full text PDFs avaialble?",
    type: "works",
    category: "discovery",
    url: "",
    query: {
      "get_rows": "works",
      "filter_works": [
        {
          "column_id": "keywords.id",
          "value": "keywords/pharmaceutical-sciences",
        },
        {
          "column_id": "open_access.has_fulltext",
          "value": true,
          "operator": "is"
        }
      ],
      "filter_aggs": [],
      "show_columns": [
        "display_name",
        "id",
        "publication_year",
        "type",
        "cited_by_count"
      ],
      "sort_by_column": "cited_by_count",
      "sort_by_order": "desc"
    }
  },
];


export {
  exampleQueries
};

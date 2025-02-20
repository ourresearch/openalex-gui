import axios from 'axios'
import _ from "lodash"
import {urlBase} from "@/apiConfig"

// Load Entity Configs from server but allow other code to call getConfigs() synchronously 
// getConfigs() is called in main.js to prime the cache

let oaxConfigs = null;

function getConfigs() {
    // If configs aren't loaded yet, load them synchronously
    if (!oaxConfigs) {
        console.log("Loading configs synchronously...");
        const xhr = new XMLHttpRequest();
        xhr.open('GET', urlBase.api + "/entities/config", false);  // false = synchronous
        xhr.send();
        
        if (xhr.status === 200) {
            oaxConfigs = configUpdates(JSON.parse(xhr.responseText));
        } else {
            throw new Error(`Failed to load configs: ${xhr.status}`);
        }
    }
    return oaxConfigs;
}

const configUpdates = (oaxConfigs) => {

  oaxConfigs.works.columns["sustainable_development_goals.id"].actions = ["column", "filter", "sort"] 

  oaxConfigs.authors.columns["display_name.search"].displayName = "author name"
  oaxConfigs.authors.columns["mean(fwci)"].actions = ["filter", "column", "sort"]
  oaxConfigs.authors.columns["mean(fwci)"].operators = ["is greater than", "is less than", "is", "is not"]
  oaxConfigs.authors.columns["mean(fwci)"].defaultOperator = "is greater than"

  oaxConfigs.sources.columns["display_name.search"].displayName = "source name"

  oaxConfigs.continents.columns["display_name.search"].displayName = "continent name"
  oaxConfigs.continents.columns["display_name.search"].actions = ["column", "sort"]
  oaxConfigs.continents.columns["id"].actions = []

  oaxConfigs.countries.columns["display_name.search"].displayName = "country name"
  oaxConfigs.countries.columns["continent"].actions = ["filter", "column", "sort"]
  oaxConfigs.countries.columns["continent"].displayName = "continent"
  oaxConfigs.countries.columns["id"].actions = ["filter", "column", "sort"]

  oaxConfigs.domains.columns["display_name.search"].displayName = "name"
  oaxConfigs.domains.columns["display_name.search"].actions = []
  oaxConfigs.domains.columns["id"].actions = ["column", "sort"]

  oaxConfigs.fields.columns["display_name.search"].displayName = "name"
  oaxConfigs.fields.columns["id"].actions = ["filter", "column", "sort"]

  oaxConfigs.funders.columns["display_name.search"].displayName = "name"
  oaxConfigs.funders.columns["homepage_url"].actions = ["column"]
  oaxConfigs.funders.columns["id"].actions = ["column", "filter"]
  oaxConfigs.funders.columns["ids.crossref"].actions = ["column", "filter"]

  oaxConfigs.institutions.columns["display_name.search"].displayName = "name"
  oaxConfigs.institutions.columns["id"].actions = ["column", "filter"]
  oaxConfigs.institutions.columns["ids.ror"].actions = ["column", "filter"]

  oaxConfigs["institution-types"].columns["display_name.search"].displayName = "name"
  oaxConfigs["institution-types"].columns["display_name.search"].actions = []

  oaxConfigs.keywords.columns["display_name.search"].displayName = "name"

  oaxConfigs.languages.columns["display_name.search"].displayName = "name"

  oaxConfigs.licenses.columns["display_name.search"].displayName = "name"
  oaxConfigs.licenses.columns["url"].actions = ["column"]

  oaxConfigs.publishers.columns["display_name.search"].displayName = "name"
  oaxConfigs.publishers.columns["country_code"].actions = ["filter", "column", "sort"]

  oaxConfigs.sdgs.columns["display_name.search"].displayName = "name"
  oaxConfigs.sdgs.columns["display_name.search"].actions = []

  oaxConfigs["source-types"].columns["display_name.search"].displayName = "name"
  oaxConfigs["source-types"].columns["display_name.search"].actions = []

  oaxConfigs.sources.columns["display_name.search"].displayName = "name"
  oaxConfigs.sources.columns["apc_usd"].actions = ["filter", "column", "sort"]

  oaxConfigs.subfields.columns["display_name.search"].displayName = "name"

  oaxConfigs["work-types"].columns["display_name.search"].displayName = "name"

  oaxConfigs.topics.columns["count(works)"].actions = ["filter", "column", "sort"]
  oaxConfigs.topics.columns["field"].actions = ["filter", "column", "sort"]
  oaxConfigs.topics.columns["domain"].actions = ["filter", "column", "sort"]
  oaxConfigs.topics.columns["subfield"].actions = ["filter", "column", "sort"]
  oaxConfigs.topics.columns["id"].actions = ["filter", "column", "sort"]


  // LABELS UPDATES
  const labelOperators = [
      "is",
      "is not",
      "matches any item in label",
      "matches every item in label"
  ];
  const labelOperatorsIncludes = [
    "includes",
    "does not include",
    "matches any item in label",
    "matches every item in label"
];
  oaxConfigs.authors.columns["id"].operators = labelOperators;
  oaxConfigs.authors.columns["affiliations.institution.id"].operators = labelOperators;
  oaxConfigs.authors.columns["affiliations.institution.type"].operators = labelOperators;
  oaxConfigs.authors.columns["affiliations.institution.country_code"].operators = labelOperators;
  oaxConfigs.authors.columns["last_known_institutions.id"].operators = labelOperators;
  oaxConfigs.authors.columns["last_known_institutions.country_code"].operators = labelOperators;
  oaxConfigs.authors.columns["last_known_institutions.type"].operators = labelOperators;
  oaxConfigs.fields.columns["subfields"].operators = labelOperators;
  oaxConfigs.fields.columns["domain"].operators = labelOperators;
  oaxConfigs.institutions.columns["country_code"].operators = labelOperators;
  oaxConfigs.institutions.columns["type"].operators = labelOperators;
  oaxConfigs.institutions.columns["parent_institutions"].operators = labelOperators;
  oaxConfigs.institutions.columns["child_institutions"].operators = labelOperators;
  oaxConfigs.institutions.columns["related_institutions"].operators = labelOperators;
  oaxConfigs.publishers.columns["country_code"].operators = labelOperators;
  oaxConfigs.sdgs.columns["count(works)"].operators = labelOperators;
  oaxConfigs["source-types"].columns["count(works)"].operators = labelOperators;
  oaxConfigs.sources.columns["id"].operators = labelOperators;
  oaxConfigs.sources.columns["host_organization"].operators = labelOperators;
  oaxConfigs.sources.columns["host_organization_name"].operators = labelOperators;
  oaxConfigs.sources.columns["type"].operators = labelOperators;
  oaxConfigs.subfields.columns["topics"].operators = labelOperators;
  oaxConfigs.subfields.columns["siblings"].operators = labelOperators;
  oaxConfigs.subfields.columns["field"].operators = labelOperators;
  oaxConfigs.subfields.columns["domain"].operators = labelOperators;
  oaxConfigs.topics.columns["siblings"].operators = labelOperators;
  oaxConfigs.topics.columns["subfield"].operators = labelOperators;
  oaxConfigs.topics.columns["field"].operators = labelOperators;
  oaxConfigs.topics.columns["domain"].operators = labelOperators;
  oaxConfigs.works.columns["primary_topic.id"].operators = labelOperators;
  oaxConfigs.works.columns["keywords.id"].operators = labelOperators;
  oaxConfigs.works.columns["primary_topic.subfield.id"].operators = labelOperators;
  oaxConfigs.works.columns["primary_topic.field.id"].operators = labelOperators;
  oaxConfigs.works.columns["primary_topic.domain.id"].operators = labelOperators;
  oaxConfigs.works.columns["authorships.institutions.id"].operators = labelOperators;
  oaxConfigs.works.columns["authorships.author.id"].operators = labelOperatorsIncludes;
  oaxConfigs.works.columns["authorships.countries"].operators = labelOperators;
  oaxConfigs.works.columns["authorships.institutions.continent"].operators = labelOperators;
  oaxConfigs.works.columns["authorships.institutions.type"].operators = labelOperators;
  oaxConfigs.works.columns["primary_location.source.id"].operators = labelOperators;
  oaxConfigs.works.columns["primary_location.source.type"].operators = labelOperators;
  oaxConfigs.works.columns["type"].operators = labelOperators;
  oaxConfigs.works.columns["grants.funder"].operators = labelOperators;
  oaxConfigs.works.columns["language"].operators = labelOperators;
  oaxConfigs.works.columns["sustainable_development_goals.id"].operators = labelOperators;

  return oaxConfigs;
}

export {getConfigs}

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
  oaxConfigs.works.columns["authorships.institutions.id"].operators = labelOperatorsIncludes;
  oaxConfigs.works.columns["authorships.author.id"].operators = labelOperatorsIncludes;
  oaxConfigs.works.columns["authorships.countries"].operators = labelOperatorsIncludes;
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

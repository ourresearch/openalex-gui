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


const getColumnConfig = (entity, column) => {
    //console.log("Getting column config", entity, column);
    return oaxConfigs[entity].columns[column];
};


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

  const setOperators = (entity, column, operators) => {
    if (oaxConfigs?.[entity]?.columns?.[column]) {
      oaxConfigs[entity].columns[column].operators = operators;
    }
  };

  setOperators("authors", "id", labelOperators);
  setOperators("authors", "affiliations.institution.id", labelOperators);
  setOperators("authors", "affiliations.institution.type", labelOperators);
  setOperators("authors", "affiliations.institution.country_code", labelOperators);
  setOperators("authors", "last_known_institutions.id", labelOperators);
  setOperators("authors", "last_known_institutions.country_code", labelOperators);
  setOperators("authors", "last_known_institutions.type", labelOperators);
  setOperators("fields", "subfields", labelOperators);
  setOperators("fields", "domain", labelOperators);
  setOperators("funders", "id", labelOperatorsIncludes);
  setOperators("institutions", "country_code", labelOperators);
  setOperators("institutions", "type", labelOperators);
  setOperators("institutions", "parent_institutions", labelOperators);
  setOperators("institutions", "child_institutions", labelOperators);
  setOperators("institutions", "related_institutions", labelOperators);
  setOperators("publishers", "country_code", labelOperators);
  setOperators("sdgs", "count(works)", labelOperators);
  setOperators("source-types", "count(works)", labelOperators);
  setOperators("sources", "id", labelOperators);
  setOperators("sources", "host_organization", labelOperators);
  setOperators("sources", "host_organization_name", labelOperators);
  setOperators("sources", "type", labelOperators);
  setOperators("subfields", "topics", labelOperators);
  setOperators("subfields", "siblings", labelOperators);
  setOperators("subfields", "field", labelOperators);
  setOperators("subfields", "domain", labelOperators);
  setOperators("topics", "siblings", labelOperators);
  setOperators("topics", "subfield", labelOperators);
  setOperators("topics", "field", labelOperators);
  setOperators("topics", "domain", labelOperators);
  setOperators("works", "primary_topic.id", labelOperators);
  setOperators("works", "keywords.id", labelOperatorsIncludes);
  setOperators("works", "primary_topic.subfield.id", labelOperators);
  setOperators("works", "primary_topic.field.id", labelOperators);
  setOperators("works", "primary_topic.domain.id", labelOperators);
  setOperators("works", "authorships.institutions.lineage", labelOperators);
  setOperators("works", "authorships.author.id", labelOperatorsIncludes);
  setOperators("works", "authorships.countries", labelOperatorsIncludes);
  setOperators("works", "authorships.institutions.continent", labelOperators);
  setOperators("works", "authorships.institutions.type", labelOperators);
  setOperators("works", "primary_location.source.id", labelOperators);
  setOperators("works", "primary_location.source.type", labelOperators);
  setOperators("works", "type", labelOperators);
  setOperators("works", "awards.funder.id", labelOperators);
  setOperators("works", "language", labelOperators);
  setOperators("works", "sustainable_development_goals.id", labelOperators);

  return oaxConfigs;
}

export {
    getConfigs,
    getColumnConfig,
}

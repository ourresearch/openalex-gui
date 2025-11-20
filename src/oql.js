const entityConfig = {
    "works": ["id", "doi", "concepts.id", "primary_topic.id", "keywords.id", "awards.funder.id", "authorships.institutions.id", "authorships.author.id", "type", "publication_year", "open_access.is_oa"],
    "authors": ["id", "ids.orcid", "display_name", "affiliations.institution.id", "last_known_institutions.id", "last_known_institutions.country_code"],
    "sources": ["id", "display_name", "ids.issn", "host_organization", "type", "apc_usd", "is_oa", "is_in_doaj"],
    "publishers": ["id", "display_name"],
    "funders": ["id", "display_name"],
    "institutions": ["id", "display_name", "ids.ror", "country_code", "type"],
    "concepts": ["id", "display_name", "description"],
    "keywords": ["id", "display_name"],
    "topics": ["id", "display_name", "description"],
    "subfields": ["id", "display_name", "description"],
    "fields": ["id", "display_name", "description"],
    "domains": ["id", "display_name", "description"],
    "sdgs": ["id", "display_name"]
};

function oqlAutocomplete(input) {
    // Split the input into words to analyze the last word being typed
    const tokens = input.trim().split(/\s+/);
    const lastWord = tokens[tokens.length - 1].toLowerCase();

    // Detect if the user is in the WHERE clause
    const whereIndex = tokens.findIndex(token => token.toLowerCase() === "where");
    const isInWhereClause = whereIndex !== -1 && tokens.length > whereIndex + 1;

    if (isInWhereClause) {
        const currentEntity = tokens[whereIndex - 1].toLowerCase();
        const potentialProperty = tokens[tokens.length - 1].toLowerCase();

        if (entityConfig[currentEntity]) {
            const suggestions = entityConfig[currentEntity].filter(property => property.startsWith(potentialProperty));
            return suggestions.map(suggestion => ({ suggestion }));
        } else {
            throw new Error("Invalid entity specified in the WHERE clause.");
        }
    }

    // Determine if we should autocomplete an entity name
    const entityNames = Object.keys(entityConfig);
    const entitySuggestions = entityNames.filter(entity => entity.startsWith(lastWord));

    if (entitySuggestions.length > 0) {
        return entitySuggestions.map(suggestion => ({ suggestion }));
    }

    // If none of the above, check if the last word is a valid property within an entity
    for (const entity of entityNames) {
        const properties = entityConfig[entity];
        const propertySuggestions = properties.filter(property => property.startsWith(lastWord));
        if (propertySuggestions.length > 0) {
            return propertySuggestions.map(suggestion => ({ suggestion }));
        }
    }

    // If the last word is a value in the WHERE clause, call the server autocomplete endpoint
    if (isInWhereClause) {
        const currentEntity = tokens[whereIndex - 1];
        return fetchAutocompleteSuggestions(currentEntity, lastWord);
    }

    return [];
}

function fetchAutocompleteSuggestions(entityId, userQuery) {
    return fetch(`https://api.openalex.org/autocomplete/${entityId}?q=${encodeURIComponent(userQuery)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch autocomplete suggestions.');
            }
            return response.json();
        })
        .then(data => data.suggestions.map(suggestion => ({ suggestion })));
}

function parseOQL(oqlString) {
  // Split the OQL string into major command parts
  const commandParts = oqlString.split(/\b(using works|get|sorted by|and return)\b/i).filter(part => part.trim());

  const result = [];
  let currentCommand = null;

  for (let part of commandParts) {
    part = part.trim();
    const lowerPart = part.toLowerCase();

    if (lowerPart === 'using works') {
      currentCommand = { command: 'using works', whereClause: '' };
      result.push(currentCommand);
    } else if (lowerPart === 'get') {
      currentCommand = { command: 'get', entity: '', whereClause: '' };
      result.push(currentCommand);
    } else if (lowerPart === 'sorted by') {
      currentCommand = { command: 'sort by', property: '', direction: '' };
      result.push(currentCommand);
    } else if (lowerPart === 'and return') {
      currentCommand = { command: 'and return', properties: [] };
      result.push(currentCommand);
    } else if (currentCommand) {
      // Parse the content based on the current command
      switch (currentCommand.command) {
        case 'using works':
          parseUsingWorks(currentCommand, part);
          break;
        case 'get':
          parseGet(currentCommand, part);
          break;
        case 'sort by':
          parseSortBy(currentCommand, part);
          break;
        case 'and return':
          parseAndReturn(currentCommand, part);
          break;
      }
    }
  }

  return result;
}

function parseUsingWorks(command, content) {
  const whereIndex = content.toLowerCase().indexOf('where');
  if (whereIndex !== -1) {
    command.whereClause = parseWhereClause(content.slice(whereIndex + 5).trim());
  }
}

function parseGet(command, content) {
  const parts = content.split(/\s+where\s+/i);
  command.entity = parts[0].trim();
  if (parts.length > 1) {
    command.whereClause = parseWhereClause(parts[1].trim());
  }
}

function parseSortBy(command, content) {
  const parts = content.split(/\s+/);
  command.property = parts[0];
  if (parts.length > 1 && ['asc', 'desc'].includes(parts[1].toLowerCase())) {
    command.direction = parts[1].toLowerCase();
  }
}

function parseAndReturn(command, content) {
  command.properties = content.split(',').map(prop => prop.trim());
}

function parseWhereClause(whereClause) {
  const conditions = [];
  let currentCondition = '';
  let parenthesesCount = 0;

  whereClause.split(/\s+/).forEach(token => {
    if (token === '(') parenthesesCount++;
    if (token === ')') parenthesesCount--;

    if ((token.toLowerCase() === 'and' || token.toLowerCase() === 'or') && parenthesesCount === 0) {
      if (currentCondition) {
        conditions.push(currentCondition.trim());
        currentCondition = '';
      }
      conditions.push(token.toLowerCase());
    } else {
      currentCondition += ' ' + token;
    }
  });

  if (currentCondition) {
    conditions.push(currentCondition.trim());
  }

  return conditions;
}





export  {
    parseOQL,
    oqlAutocomplete,
};

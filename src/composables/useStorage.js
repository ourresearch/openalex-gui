import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Composable for localStorage synchronization
 * @param {String} key Storage key
 * @param {any} defaultValue Default value if not found in localStorage
 * @returns {Object} Reactive ref that syncs with localStorage
 */
export function useLocalStorage(key, defaultValue = null) {
  // Initialize with value from localStorage or default
  const storedValue = localStorage.getItem(key);
  const initialValue = storedValue ? JSON.parse(storedValue) : defaultValue;
  
  const value = ref(initialValue);
  
  // Watch for changes and update localStorage
  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  }, { deep: true });
  
  return value;
}

/**
 * Composable for URL parameter synchronization
 * @param {String} name Parameter name to use in URL
 * @param {String} type Data type ('string', 'number', 'boolean', 'array')
 * @param {any} defaultValue Default value if not found in URL
 * @returns {Object} Reactive ref that syncs with URL parameters
 */
export function useParams(name, type, defaultValue = null) {
  const route = useRoute();
  const router = useRouter();
  
  // Helper functions for URL parameter handling
  const parseUrlParam = (value, type) => {
    if (value === undefined || value === null) return null;
    
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'array':
        try {
          // Handle comma-separated values for arrays
          if (value.includes(',')) {
            return value.split(',').filter(v => v.trim() !== '');
          } else if (value.startsWith('[')) {
            return JSON.parse(decodeURIComponent(value));
          } else if (value.trim() !== '') {
            return [value];
          }
          return [];
        } catch (e) {
          console.error('Error parsing URL array parameter:', e);
          return [];
        }
      default:
        return value;
    }
  };

  const serializeForUrl = (value, type) => {
    if (value === undefined || value === null || 
        (Array.isArray(value) && value.length === 0) ||
        value === '') {
      return null;
    }
    
    switch (type) {
      case 'array':
        // Use comma-separated format for better readability
        return value.join(',');
      default:
        return String(value);
    }
  };

  // Get initial value from URL
  const getInitialValue = () => {
    // Check URL parameters
    const paramValue = route.query[name];
    if (paramValue !== undefined) {
      const parsedValue = parseUrlParam(paramValue, type);
      if (parsedValue !== null) {
        return parsedValue;
      }
    }
    
    // Use default value if not found in URL
    return defaultValue;
  };

  // Create reactive reference with initial value
  const value = ref(getInitialValue());
  
  // Update URL when value changes
  const updateUrlParam = (newValue) => {
    const query = { ...route.query };
    
    if (newValue === null || newValue === undefined || 
        (Array.isArray(newValue) && newValue.length === 0) ||
        newValue === '') {
      delete query[name];
    } else {
      query[name] = serializeForUrl(newValue, type);
    }
    
    // Replace URL without reloading the page
    router.replace({ query });
  };
  
  // Watch for changes to update URL
  watch(value, (newValue) => {
    updateUrlParam(newValue);
  }, { deep: true });
  
  // Watch for URL parameter changes from outside
  onMounted(() => {
    // Set up watcher for route query changes
    watch(() => route.query[name], (newParamValue) => {
      if (newParamValue !== undefined) {
        const parsedValue = parseUrlParam(newParamValue, type);
        if (parsedValue !== null && JSON.stringify(parsedValue) !== JSON.stringify(value.value)) {
          value.value = parsedValue;
        }
      }
    });
  });
  
  return value;
}

/**
 * Composable that synchronizes a reactive state with both URL parameters and localStorage
 * @param {String|Object} nameOrOptions Parameter name or configuration object
 * @param {String} [type] Data type ('string', 'number', 'boolean', 'array')
 * @param {any} [defaultValue] Default value if not found in URL or localStorage
 * @returns {Object} Reactive ref that syncs with URL and localStorage
 */
export function useParamsAndLocalStorage(nameOrOptions, type, defaultValue = null) {
  // Support both object-style and positional parameters
  let name;
  
  if (typeof nameOrOptions === 'object' && nameOrOptions !== null) {
    // Object-style parameters
    name = nameOrOptions.name;
    type = nameOrOptions.type;
    defaultValue = nameOrOptions.defaultValue ?? null;
  } else {
    // Positional parameters
    name = nameOrOptions;
  }
  const route = useRoute();
  const router = useRouter();
  
  // Helper functions for URL parameter handling
  const parseUrlParam = (value, type) => {
    if (value === undefined || value === null) return null;
    
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'array':
        try {
          // Handle comma-separated values for arrays
          if (value.includes(',')) {
            return value.split(',').filter(v => v.trim() !== '');
          } else if (value.startsWith('[')) {
            return JSON.parse(decodeURIComponent(value));
          } else if (value.trim() !== '') {
            return [value];
          }
          return [];
        } catch (e) {
          console.error('Error parsing URL array parameter:', e);
          return [];
        }
      default:
        return value;
    }
  };

  const serializeForUrl = (value, type) => {
    if (value === undefined || value === null || 
        (Array.isArray(value) && value.length === 0) ||
        value === '') {
      return null;
    }
    
    switch (type) {
      case 'array':
        // Use comma-separated format for better readability
        return value.join(',');
      default:
        return String(value);
    }
  };

  // Get initial value from URL or localStorage
  const getInitialValue = () => {
    // Check URL parameters first
    const paramValue = route.query[name];
    if (paramValue !== undefined) {
      const parsedValue = parseUrlParam(paramValue, type);
      if (parsedValue !== null) {
        return parsedValue;
      }
    }
    
    // Fall back to localStorage if not in URL
    const storedValue = localStorage.getItem(`param_${name}`);
    if (storedValue) {
      try {
        return JSON.parse(storedValue);
      } catch (e) {
        console.error(`Error parsing localStorage for ${name}:`, e);
      }
    }
    
    // Use default value if not found in URL or localStorage
    return defaultValue;
  };

  // Create reactive reference with initial value
  const value = ref(getInitialValue());
  
  // Update URL when value changes
  const updateUrlParam = (newValue) => {
    const query = { ...route.query };
    
    if (newValue === null || newValue === undefined || 
        (Array.isArray(newValue) && newValue.length === 0) ||
        newValue === '') {
      delete query[name];
    } else {
      query[name] = serializeForUrl(newValue, type);
    }
    
    // Replace URL without reloading the page
    router.replace({ query });
  };
  
  // Watch for changes to update localStorage and URL
  watch(value, (newValue) => {
    // Update localStorage
    localStorage.setItem(`param_${name}`, JSON.stringify(newValue));
    
    // Update URL parameter
    updateUrlParam(newValue);
  }, { deep: true });
  
  // Watch for URL parameter changes from outside
  onMounted(() => {
    // Set up watcher for route query changes
    watch(() => route.query[name], (newParamValue) => {
      if (newParamValue !== undefined) {
        const parsedValue = parseUrlParam(newParamValue, type);
        if (parsedValue !== null && JSON.stringify(parsedValue) !== JSON.stringify(value.value)) {
          value.value = parsedValue;
        }
      }
    });
  });
  
  return value;
}

/**
 * Composable that synchronizes multiple reactive states with URL parameters and localStorage
 * @param {Array} fields Array of field configurations {name, type, defaultValue}
 * @returns {Object} Object containing all reactive refs
 */
export function useMultiParamsAndLocalStorage(fields) {
  const result = {};
  
  fields.forEach(field => {
    // Use the simpler positional parameters syntax
    result[field.name] = useParamsAndLocalStorage(
      field.name,
      field.type,
      field.defaultValue
    );
  });
  
  return result;
}

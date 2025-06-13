import { computed, reactive } from "vue";
import { useStore } from "vuex";

export function useResultsTable() {

  const store = useStore();
  const query = computed(() => store.getters['search/query']);
  const resultsHeader = computed(() => store.getters['search/resultsHeader']);
  const resultsBody = computed(() => store.getters['search/resultsBody']);

  const headers = computed(() => {
    if (!resultsHeader.value.length || !query.value) { 
      // Return a single placeholder header when there are no results
      return [{ id: 'placeholder', type: 'ui-action'}]; 
    }
  
    const result = [{ id: 'selector', type: 'ui-action'}]; // Start with a selector column
    const dataColumns = resultsHeader.value.slice();
    // Find first metric column index
    const firstMetricIndex = dataColumns.findIndex(col => col.id && col.id.includes('('));
    const hasMetricColumns = firstMetricIndex !== -1;
    
    // Add data columns with column adders in appropriate positions
    if (hasMetricColumns) {
      // Add non-metric columns
      result.push(...dataColumns.slice(0, firstMetricIndex));
      // Add data column adder before first metric column if not in summary mode
      if (query.value && query.value.get_rows !== 'summary') {
        result.push(reactive({
          id: 'columnAdder',
          type: 'ui-action',
          display: 'data'
        }));
      }
      // Add metric columns
      result.push(...dataColumns.slice(firstMetricIndex));
      // Add metric column adder at the end
      result.push(reactive({
        id: 'columnAdder',
        type: 'ui-action',
        display: 'metrics'
      }));
    } else {
      // No metric columns, just add all columns
      result.push(...dataColumns);
      // Add data column adder at the end if not in summary mode
      if (query.value && query.value.get_rows !== 'summary') {
        result.push(reactive({
          id: 'columnAdder',
          type: 'ui-action',
          display: 'data'
        }));
      }
    }
    return result;
  });
  
  const rows = computed(() => {
    return resultsBody.value.map(row => {
      // Create basic cells with configs
      let dataCells = row.cells.map((cell, i) => ({
        ...cell,
        config: resultsHeader.value[i],
      }));
      
      // Find first metric cell index
      const firstMetricIndex = dataCells.findIndex(cell => cell.config?.id?.includes('('));
      const hasMetricCells = firstMetricIndex !== -1;
      
      // Create final cells array with UI action cells
      const finalCells = [{ type: 'ui-action', config: { id: 'selector' }}];
      
      // Add data cells with column adders in appropriate positions
      if (hasMetricCells) {
        // Add non-metric cells
        finalCells.push(...dataCells.slice(0, firstMetricIndex));
        
        // Add data column adder cell before first metric cell if not in summary mode
        if (query.value.get_rows !== 'summary') {
          finalCells.push({
            type: 'ui-action',
            config: { id: 'columnAdder', display: 'data' }
          });
        }
        // Add metric cells
        finalCells.push(...dataCells.slice(firstMetricIndex));
        // Add metric column adder cell at the end
        finalCells.push({
          type: 'ui-action', 
          config: { id: 'columnAdder', display: 'metrics' }
        });
      } else {
        // No metric cells, just add all cells
        finalCells.push(...dataCells);
        
        // Add data column adder at the end if not in summary mode
        if (query.value.get_rows !== 'summary') {
          finalCells.push({
            type: 'ui-action',
            config: { id: 'columnAdder', display: 'data' }
          });
        }
      }
      return {
        ...row,
        cellsWithConfigs: finalCells
      };
    });
  });

  return {headers, rows};
}
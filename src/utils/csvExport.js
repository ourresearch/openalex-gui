import axios from 'axios';
import { axiosConfig } from '@/apiConfig';

/**
 * Export data to CSV by paginating through an API endpoint
 * @param {Object} options
 * @param {string} options.url - Base URL for the API endpoint
 * @param {Object} options.params - Query parameters to include
 * @param {Array} options.columns - Column definitions [{key, label, transform?}]
 * @param {string} options.filename - Name for the downloaded file
 * @param {number} options.perPage - Records per page (default 100)
 * @param {number} options.maxPages - Maximum pages to fetch (default 100, i.e. 10,000 records)
 * @param {Function} options.onProgress - Progress callback (currentPage, totalPages)
 * @returns {Promise<void>}
 */
export async function exportToCsv({
  url,
  params = {},
  columns,
  filename = 'export.csv',
  perPage = 100,
  maxPages = 100,
  onProgress = null,
}) {
  const allRows = [];
  let page = 1;
  let totalPages = 1;

  // Fetch all pages
  while (page <= totalPages && page <= maxPages) {
    const queryParams = new URLSearchParams({
      ...params,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const response = await axios.get(
      `${url}?${queryParams.toString()}`,
      axiosConfig({ userAuth: true })
    );

    const results = response.data.results || [];
    allRows.push(...results);

    // Update total pages from meta
    if (response.data.meta?.total_pages) {
      totalPages = Math.min(response.data.meta.total_pages, maxPages);
    }

    if (onProgress) {
      onProgress(page, totalPages);
    }

    // If we got fewer results than requested, we're done
    if (results.length < perPage) {
      break;
    }

    page++;
  }

  // Convert to CSV
  const csv = convertToCsv(allRows, columns);
  
  // Download
  downloadCsv(csv, filename);
  
  return allRows.length;
}

/**
 * Export an array of objects directly to CSV (no API pagination)
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions [{key, label, transform?}]
 * @param {string} filename - Name for the downloaded file
 */
export function exportArrayToCsv(data, columns, filename = 'export.csv') {
  const csv = convertToCsv(data, columns);
  downloadCsv(csv, filename);
  return data.length;
}

/**
 * Convert array of objects to CSV string
 */
function convertToCsv(data, columns) {
  if (!data.length) {
    return columns.map(c => escapeCell(c.label)).join(',');
  }

  // Header row
  const header = columns.map(c => escapeCell(c.label)).join(',');

  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = getNestedValue(row, col.key);
      
      // Apply transform if provided
      if (col.transform) {
        value = col.transform(value, row);
      }
      
      return escapeCell(value);
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  if (!path) return '';
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === null || value === undefined) return '';
    value = value[key];
  }
  return value;
}

/**
 * Escape a cell value for CSV
 */
function escapeCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Trigger browser download of CSV content
 */
function downloadCsv(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

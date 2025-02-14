import axios from "axios";

function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    value = String(value);
    // If the value contains commas, quotes, or newlines, wrap it in quotes and escape any existing quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
}

function jsonToCsv(headers, rows) {
    headers = headers.map(header => escapeCsvValue(header.displayName));
    rows = rows.map(row => {
        return row.cells.map(cell => {
            let value;
            if (Array.isArray(cell.value)) {
                // Handle lists (e.g., authors or institutions)
                value = cell.value.map(item => item.display_name).join('; ');
            } else if (typeof cell.value === 'object' && cell.value !== null) {
                // Handle nested objects
                value = cell.value.display_name || '';
            } else {
                // Handle other types (strings, numbers)
                value = cell.value;
            }
            return escapeCsvValue(value);
        });
    });

    // Create the CSV string
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });

    return csvContent;
}

export {
    jsonToCsv,
}
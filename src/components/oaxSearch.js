function jsonToCsv(headers, rows) {
    headers = headers.map(header => header.displayName);
    rows = rows.map(row => {
        return row.cells.map(cell => {
            if (Array.isArray(cell.value)) {
                // Handle lists (e.g., authors or institutions)
                return cell.value.map(item => item.display_name).join('; ');
            } else if (typeof cell.value === 'object' && cell.value !== null) {
                // Handle nested objects
                return cell.value.display_name || '';
            } else {
                // Handle other types (strings, numbers)
                return cell.value;
            }
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
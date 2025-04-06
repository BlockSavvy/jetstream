/**
 * Utility function to export data to CSV
 * 
 * @param data - Array of objects to export
 * @param filename - Name for the downloaded file
 */
export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (!data || !data.length) {
    throw new Error('No data to export');
  }

  // Get all unique headers from all objects
  const headers = Array.from(
    new Set(
      data.flatMap(obj => Object.keys(obj))
    )
  );

  // Create CSV content
  let csv = headers.join(',') + '\n';
  
  data.forEach(obj => {
    const row = headers.map(header => {
      const value = obj[header];
      
      // Handle null or undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle array values by joining them
      if (Array.isArray(value)) {
        // If it contains objects, try to extract basic info
        if (value.length > 0 && typeof value[0] === 'object') {
          return `"${value.map(item => {
            if (item.first_name && item.last_name) {
              return `${item.first_name} ${item.last_name}`;
            }
            return item.id || item.name || JSON.stringify(item);
          }).join('; ')}"`;
        }
        return `"${value.join('; ')}"`;
      }
      
      // Handle object values
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Handle string values that might contain commas or quotes
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      // Return the value as is for numbers, booleans etc.
      return value;
    }).join(',');
    
    csv += row + '\n';
  });

  // Create a download link and trigger it
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 
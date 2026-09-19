import * as XLSX from 'xlsx';

export interface ReportRowData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Exports JSON data array directly to a native Microsoft Excel (.xlsx) file
 * with custom column auto-sizing and workbook metadata.
 */
export function exportToExcel(data: ReportRowData[], fileName: string, sheetName: string = 'Financial Report'): void {
  try {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto calculate column widths based on cell string length
    const colKeys = Object.keys(data[0]);
    worksheet['!cols'] = colKeys.map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => (row[key] !== undefined ? String(row[key]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (err) {
    console.error('Excel Export Error, falling back to UTF-8 CSV:', err);
    exportToCsv(data, fileName);
  }
}

/**
 * Fallback / Alternative: Exports data as UTF-8 CSV with Byte Order Mark (BOM)
 * to ensure perfect Arabic character rendering in Microsoft Excel.
 */
export function exportToCsv(data: ReportRowData[], fileName: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header] !== undefined ? String(row[header]) : '';
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ];

  // \uFEFF is UTF-8 BOM for Microsoft Excel Arabic support
  const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

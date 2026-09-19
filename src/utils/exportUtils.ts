export function exportToCSV(
  arg1: string | Record<string, any>[],
  arg2?: Record<string, any>[] | string,
  headers?: string[]
) {
  let filename = 'export_data';
  let rows: Record<string, any>[] = [];

  if (typeof arg1 === 'string') {
    filename = arg1;
    rows = Array.isArray(arg2) ? arg2 : [];
  } else if (Array.isArray(arg1)) {
    rows = arg1;
    filename = typeof arg2 === 'string' ? arg2 : 'export_data';
  }

  if (!rows || !rows.length) {
    alert('No data to export');
    return;
  }

  const columnKeys = headers || Object.keys(rows[0]);
  const headerLine = columnKeys.join(',');

  const csvLines = rows.map(row => {
    return columnKeys.map(key => {
      let val = row[key];
      if (val === undefined || val === null) val = '';
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        val = `"${val}"`;
      }
      return val;
    }).join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerLine, ...csvLines].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(
  arg1: string | Record<string, any>[],
  arg2?: Record<string, any>[] | string,
  extension: 'xls' | 'xlsx' = 'xlsx'
) {
  let filename = 'export_data';
  let rows: Record<string, any>[] = [];

  if (typeof arg1 === 'string') {
    filename = arg1;
    rows = Array.isArray(arg2) ? arg2 : [];
  } else if (Array.isArray(arg1)) {
    rows = arg1;
    filename = typeof arg2 === 'string' ? arg2 : 'export_data';
  }

  if (!rows || !rows.length) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(rows[0]);
  let tableHtml = '<table><thead><tr>';
  headers.forEach(h => {
    tableHtml += `<th>${h}</th>`;
  });
  tableHtml += '</tr></thead><tbody>';

  rows.forEach(r => {
    tableHtml += '<tr>';
    headers.forEach(h => {
      tableHtml += `<td>${r[h] ?? ''}</td>`;
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</tbody></table>';

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

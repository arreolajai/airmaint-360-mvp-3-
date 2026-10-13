export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows || rows.length === 0) {
    alert('No hay registros para exportar.');
    return;
  }

  const keys = Object.keys(rows[0]);
  const header = keys.join(',');

  const lines = rows.map((row) =>
    keys
      .map((key) => {
        let val = row[key];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') val = JSON.stringify(val);
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [header, ...lines].join('\r\n');
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

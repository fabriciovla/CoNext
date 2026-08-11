export default function Table({ columns, data, emptyMessage = 'Sin datos por el momento.' }) {
  if (!data.length) {
    return <p className="animate-fade-in py-8 text-center text-sm text-ink-muted">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-ink-muted">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2.5 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {data.map((row, i) => (
            <tr
              key={row.id}
              className="animate-fade-up transition-colors duration-200 hover:bg-white/[0.03]"
              // Tope de 8 filas escalonadas: más abajo el retraso se volvería espera.
              style={{ '--d': `${Math.min(i, 8) * 45}ms` }}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-3 text-ink-secondary">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

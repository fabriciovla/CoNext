// `rowProps` deja que la página le cuelgue atributos a cada fila (hoy: el
// arrastre de un producto hacia una carpeta) sin que la tabla sepa de qué se
// trata. Su `className` se concatena en vez de pisar la de la fila, que es lo
// que trae el hover y el escalonado.
export default function Table({ columns, data, emptyMessage = 'Sin datos por el momento.', rowProps }) {
  if (!data.length) {
    return <p className="animate-fade-in py-10 text-center text-[13px] text-ink-muted">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-[13px]">
        <thead>
          {/* Encabezados en minúscula y tenues: son el rótulo de la columna, no
              un dato. En versalitas espaciadas pesaban más que los productos. */}
          <tr className="border-b border-tint/[0.08] text-[12px] text-ink-faint">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 pb-2 font-normal ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-tint/[0.05]">
          {data.map((row, i) => {
            const { className: extraClass = '', ...extra } = rowProps?.(row) ?? {}
            return (
              <tr
                key={row.id}
                {...extra}
                className={`group animate-fade-up transition-colors duration-150 hover:bg-tint/[0.03] ${extraClass}`}
                // Tope de 8 filas escalonadas: más abajo el retraso se volvería espera.
                style={{ '--d': `${Math.min(i, 8) * 45}ms` }}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2.5 text-ink-secondary ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

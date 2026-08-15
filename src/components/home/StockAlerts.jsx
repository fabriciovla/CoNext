import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { IconChevronRight } from '../ui/icons'
import { stockAlerts, inventoryValue } from '../../utils/metrics'

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export default function StockAlerts({ products, onNavigate }) {
  const alerts = stockAlerts(products)
  const sinStock = alerts.filter((product) => product.stock === 0).length

  return (
    <Card
      title="Alertas de stock"
      actions={
        <Button size="sm" variant="ghost" onClick={() => onNavigate('products')}>
          Productos
          <IconChevronRight size={13} />
        </Button>
      }
    >
      {alerts.length === 0 ? (
        <p className="text-sm text-ink-secondary">Todos los productos tienen stock suficiente.</p>
      ) : (
        <ul className="space-y-2.5">
          {alerts.slice(0, 5).map((product, i) => (
            <li
              key={product.id}
              className="animate-fade-right flex items-center justify-between gap-3"
              style={{ '--d': `${100 + i * 70}ms` }}
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">{product.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-ink-muted">{product.stock} u.</span>
              {product.stock === 0 ? <Badge tone="red">Sin stock</Badge> : <Badge tone="amber">Bajo</Badge>}
            </li>
          ))}
        </ul>
      )}

      <div
        className="animate-fade-in mt-4 flex items-center justify-between border-t border-tint/[0.06] pt-3 text-xs"
        style={{ '--d': '450ms' }}
      >
        <span className="text-ink-muted">
          {products.length} producto{products.length === 1 ? '' : 's'}
          {sinStock > 0 ? ` · ${sinStock} sin stock` : ''}
        </span>
        <span className="tabular-nums text-ink-secondary">
          {currency.format(inventoryValue(products))} en inventario
        </span>
      </div>
    </Card>
  )
}

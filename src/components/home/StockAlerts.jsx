import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { IconChevronRight } from '../ui/icons'
import { useMemo } from 'react'
import { stockAlerts, inventoryValue } from '../../utils/metrics'
import { useIdioma } from '../../lib/i18n.jsx'

// La moneda sigue siendo ARS —es la del negocio, no la de quien mira— pero el
// formato acompaña al idioma: cambian el separador de miles y dónde va el
// símbolo, no la moneda.
export default function StockAlerts({ products, onNavigate }) {
  const { t, locale } = useIdioma()
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }),
    [locale],
  )
  const alerts = stockAlerts(products)
  const sinStock = alerts.filter((product) => product.stock === 0).length

  return (
    <Card
      title={t('inicio.alertasStock')}
      actions={
        <Button size="sm" variant="ghost" onClick={() => onNavigate('products')}>
          {t('inicio.productos')}
          <IconChevronRight size={13} />
        </Button>
      }
    >
      {alerts.length === 0 ? (
        <p className="text-sm text-ink-secondary">{t('inicio.stockSuficiente')}</p>
      ) : (
        <ul className="space-y-2.5">
          {alerts.slice(0, 5).map((product, i) => (
            <li
              key={product.id}
              className="animate-fade-right flex items-center justify-between gap-3"
              style={{ '--d': `${100 + i * 70}ms` }}
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">{product.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                {t('inicio.unidadesCorto', { n: product.stock })}
              </span>
              {product.stock === 0 ? (
                <Badge tone="red">{t('inicio.sinStock')}</Badge>
              ) : (
                <Badge tone="amber">{t('inicio.bajo')}</Badge>
              )}
            </li>
          ))}
        </ul>
      )}

      <div
        className="animate-fade-in mt-4 flex items-center justify-between border-t border-tint/[0.06] pt-3 text-xs"
        style={{ '--d': '450ms' }}
      >
        <span className="text-ink-muted">
          {t('inicio.resumenProductos', { n: products.length, sinStock })}
        </span>
        <span className="tabular-nums text-ink-secondary">
          {t('inicio.enInventario', { valor: currency.format(inventoryValue(products)) })}
        </span>
      </div>
    </Card>
  )
}

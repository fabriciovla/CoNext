import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { IconCheck, IconChevronRight } from '../ui/icons'
import { groupMessagesByPhone } from '../../utils/groupMessages'
import { formatDuration } from '../../utils/metrics'
import { useT } from '../../lib/i18n.jsx'

// Momento del primer entrante sin responder: es lo que define cuánto hace que
// el cliente está esperando, no la fecha del último mensaje del hilo.
function firstPendingAt(group) {
  const pending = group.messages.find(
    (m) => m.direction === 'in' && m.status === 'pendiente',
  )
  return pending ? new Date(pending.createdAt) : null
}

export default function PendingReview({ messages, onOpenConversation, onNavigate }) {
  const t = useT()
  const now = Date.now()
  const groups = groupMessagesByPhone(messages)
    .filter((group) => group.pendientes > 0)
    .map((group) => ({ ...group, waitingSince: firstPendingAt(group) }))
    .sort((a, b) => a.waitingSince - b.waitingSince)

  return (
    <Card
      title={t('inicio.requiereAtencion')}
      actions={
        groups.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => onNavigate('inbox')}>
            {t('inicio.verBandeja')}
            <IconChevronRight size={13} />
          </Button>
        )
      }
      bodyClassName={groups.length > 0 ? 'px-5 py-1.5' : 'p-5'}
    >
      {groups.length === 0 ? (
        <div className="animate-fade-in flex items-center gap-3 text-sm text-ink-secondary">
          <span className="animate-pop-in flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-good/10 text-status-good" style={{ '--d': '150ms' }}>
            <IconCheck size={15} />
          </span>
          {t('inicio.todoRespondido')}
        </div>
      ) : (
        <ul className="divide-y divide-tint/[0.05]">
          {groups.map((group, i) => (
            <li
              key={group.phone}
              className="animate-fade-right"
              style={{ '--d': `${120 + Math.min(i, 8) * 60}ms` }}
            >
              <button
                onClick={() => onOpenConversation(group.phone)}
                className="group/row -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-tint/[0.04]"
              >
                <Avatar photo seed={group.phone} name={group.customer} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink-primary">{group.customer}</p>
                    <span className="shrink-0 text-xs tabular-nums text-status-warning">
                      {t('inicio.esperando', {
                        tiempo: formatDuration((now - group.waitingSince) / 60000),
                      })}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink-muted transition-colors duration-200 group-hover/row:text-ink-secondary">
                    {group.lastText}
                  </p>
                </div>
                <IconChevronRight
                  size={15}
                  className="shrink-0 text-ink-faint transition-colors duration-150 group-hover/row:text-ink-primary"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

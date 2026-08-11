import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { IconCheck, IconChevronRight } from '../ui/icons'
import { groupMessagesByPhone } from '../../utils/groupMessages'
import { formatDuration } from '../../utils/metrics'

// Momento del primer entrante sin responder: es lo que define cuánto hace que
// el cliente está esperando, no la fecha del último mensaje del hilo.
function firstPendingAt(group) {
  const pending = group.messages.find(
    (m) => m.direction === 'in' && m.status === 'pendiente',
  )
  return pending ? new Date(pending.createdAt) : null
}

export default function PendingReview({ messages, onOpenConversation, onNavigate }) {
  const now = Date.now()
  const groups = groupMessagesByPhone(messages)
    .filter((group) => group.pendientes > 0)
    .map((group) => ({ ...group, waitingSince: firstPendingAt(group) }))
    .sort((a, b) => a.waitingSince - b.waitingSince)

  return (
    <Card
      title="Requiere tu atención"
      actions={
        groups.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => onNavigate('inbox')}>
            Ver bandeja
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
          Ninguna conversación pendiente: está todo respondido.
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {groups.map((group, i) => (
            <li
              key={group.phone}
              className="animate-fade-right"
              style={{ '--d': `${120 + Math.min(i, 8) * 60}ms` }}
            >
              <button
                onClick={() => onOpenConversation(group.phone)}
                className="group/row flex w-full items-center gap-3 py-3 text-left transition-all duration-200 hover:translate-x-1"
              >
                <Avatar
                  name={group.customer}
                  size={32}
                  className="transition-transform duration-300 group-hover/row:scale-105"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink-primary">{group.customer}</p>
                    <span className="shrink-0 text-xs tabular-nums text-status-warning">
                      {formatDuration((now - group.waitingSince) / 60000)} esperando
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink-muted transition-colors duration-200 group-hover/row:text-ink-secondary">
                    {group.lastText}
                  </p>
                </div>
                <IconChevronRight
                  size={15}
                  className="shrink-0 text-ink-muted transition-all duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-ink-primary"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import Login from './pages/Login'
import Layout from './components/Layout'
import TitleBar from './components/TitleBar'
import AppNav from './components/AppNav'
import ApiErrorBanner from './components/ApiErrorBanner'
import Modal from './components/ui/Modal'
import Button from './components/ui/Button'
import Inbox from './pages/Inbox'
import Products from './pages/Products'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Agents from './pages/Agents'
import Templates from './pages/Templates'
import useAuth from './hooks/useAuth'
import useMessages from './hooks/useMessages'
import useProducts from './hooks/useProducts'
import useSettings from './hooks/useSettings'
import useAgents from './hooks/useAgents'
import useTemplates from './hooks/useTemplates'
import useTheme from './hooks/useTheme'
import { groupMessagesByPhone } from './utils/groupMessages'
import { alTocarAviso } from './lib/entorno'
import { useT } from './lib/i18n.jsx'

export default function App() {
  const t = useT()
  const {
    user,
    isAuthenticated,
    listo,
    error,
    login,
    loginCon,
    oauthPending,
    entrando,
    correoInicial,
    social,
    logout,
    clearError,
  } =
    useAuth()
  const {
    messages,
    resolveConversation,
    sendMessage,
    sendMedia,
    addNote,
    assignments,
    assignConversation,
    changeConversationAgent,
    addConversationTag,
    removeConversationTag,
    conversationsMeta,
    drafts,
    stats,
    cargando: mensajesCargando,
    dayStatus,
    dayOpenedAt,
    dayClosedAt,
    archivedDays,
    closeDay,
    openNewDay,
    apiError,
    dismissApiError,
  } = useMessages()
  const {
    products,
    folders,
    cargando: productsCargando,
    error: productsError,
    addProduct,
    updateProduct,
    deleteProduct,
    moveProduct,
    addFolder,
    renameFolder,
    deleteFolder,
  } = useProducts()
  const {
    templates,
    conectado: waConectado,
    cargando: templatesCargando,
    error: templatesError,
    refrescar: refrescarTemplates,
    addTemplate,
    deleteTemplate,
  } = useTemplates()
  const { settings, cargando: settingsCargando, updateSettings } = useSettings()
  const {
    agents,
    stats: agentStats,
    cargando: agentsCargando,
    error: agentsError,
    addAgent,
    updateAgent,
    deleteAgent,
    reorderAgents,
  } = useAgents()
  const { theme, toggleTheme } = useTheme()
  const [page, setPage] = useState('home')
  // Teléfono que se pide abrir al llegar a la bandeja (desde los widgets de
  // Inicio). La navegación normal del sidebar lo deja en null.
  const [focusPhone, setFocusPhone] = useState(null)
  // Lo que muestra la barra de la izquierda vive acá y no en la bandeja: la
  // barra es la misma en todas las páginas, así que el filtro y el día que se
  // está mirando le sobreviven al cambio de página.
  const [filter, setFilter] = useState({ type: 'todos', value: null })
  const [viewingDayId, setViewingDayId] = useState(null)
  const [confirmClose, setConfirmClose] = useState(false)
  // Agente que se pidió abrir desde la barra: el id de uno existente o 'nuevo'.
  // La página de Agentes lo consume y lo suelta enseguida, así volver a tocar el
  // mismo agente lo abre otra vez.
  const [agentFocus, setAgentFocus] = useState(null)

  // Un día archivado se navega igual que el día en vivo: mismas carpetas, misma
  // lista y mismo panel de chat, solo que de solo lectura.
  const viewingDay = archivedDays.find((d) => d.id === viewingDayId) ?? null
  const activeMessages = viewingDay ? viewingDay.messages : messages

  // Se agrupa acá porque los contadores de las carpetas son de la barra, que
  // ahora se ve siempre, y la lista de la bandeja parte de lo mismo.
  const allGroups = useMemo(
    () => groupMessagesByPhone(activeMessages, assignments, conversationsMeta),
    [activeMessages, assignments, conversationsMeta],
  )

  const navigate = (nextPage, phone = null) => {
    setPage(nextPage)
    setFocusPhone(phone)
    // Pedir una conversación puntual manda a la bandeja del día en vivo: con un
    // filtro puesto o mirando un día archivado, esa conversación no estaría.
    if (phone) setFilter({ type: 'todos', value: null })
    // Salir de la bandeja suelta el día archivado: si no, los contadores de la
    // barra seguirían contando ese día viejo en el resto de las páginas.
    if (phone || nextPage !== 'inbox') setViewingDayId(null)
  }

  // Elegir una carpeta es siempre una pregunta sobre la bandeja: tocarla desde
  // otra página cambia de página con el filtro puesto.
  const selectFilter = (next) => {
    setFilter(next)
    setFocusPhone(null)
    setPage('inbox')
  }

  // Entrar a un agente desde la barra abre su configuración, no un filtro.
  const openAgent = (agent) => {
    setAgentFocus(agent.id)
    setFocusPhone(null)
    setPage('agents')
  }

  const newAgent = () => {
    setAgentFocus('nuevo')
    setFocusPhone(null)
    setPage('agents')
  }

  const clearAgentFocus = useCallback(() => setAgentFocus(null), [])

  const selectDay = (day) => {
    setViewingDayId((prev) => (prev === day.id ? null : day.id))
    setFocusPhone(null)
    setPage('inbox')
  }

  const handleConfirmClose = () => {
    closeDay()
    setConfirmClose(false)
  }

  // El título de la ventana sale del mismo diccionario que la pantalla, así
  // que cambia con el idioma sin que haya que recargar.
  useEffect(() => {
    document.title = isAuthenticated ? t(`titulos.${page}`) : t('titulos.entrar')
  }, [isAuthenticated, page, t])

  // Tocar una notificación del escritorio abre esa conversación. Sin esto el
  // aviso deja a la persona parada en la pantalla en la que estaba y hay que
  // buscar a mano de quién era el mensaje que se acaba de leer en el globo.
  // En el navegador no hay a qué suscribirse y la baja es un no-op.
  useEffect(
    () => alTocarAviso((phone) => phone && navigate('inbox', phone)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // La barra de título va arriba de todo y en las tres ramas: es el marco de
  // la ventana, no una parte de la dashboard, así que también está mientras
  // carga la sesión y en la pantalla de ingreso. En el navegador no dibuja nada.
  if (!listo) {
    return (
      <>
        <TitleBar theme={theme} onToggleTheme={toggleTheme} />
        <div className="min-h-dvh bg-surface-page" />
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <TitleBar theme={theme} onToggleTheme={toggleTheme} />
        <Login
          onLogin={login}
          onOAuth={loginCon}
          oauthPending={oauthPending}
          entrando={entrando}
          correoInicial={correoInicial}
          social={social}
          error={error}
          onClearError={clearError}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </>
    )
  }

  return (
    <>
      {/* El menú de la barra de título repite lo que ya ofrece la barra de la
          izquierda, y a propósito: es de donde salen los atajos de teclado y es
          el primer lugar donde alguien que viene de otra app de escritorio
          busca "Cerrar sesión" o "Nuevo agente". Cerrar el día pasa por la
          misma confirmación que el botón de la barra — es destructivo por igual
          desde donde se lo pida. */}
      <TitleBar
        theme={theme}
        autenticado
        pagina={page}
        dayStatus={dayStatus}
        onNuevoAgente={newAgent}
        onCerrarDia={() => setConfirmClose(true)}
        onAbrirDia={openNewDay}
        onNavegar={navigate}
        onCerrarSesion={logout}
        onToggleTheme={toggleTheme}
      />
      <ApiErrorBanner error={apiError} onDismiss={dismissApiError} />
      <Layout
        current={page}
        nav={
          <AppNav
            current={page}
            onNavigate={navigate}
            username={user.username}
            storeName={settings.storeName}
            onLogout={logout}
            pendingCount={stats.pendientes}
            groups={allGroups}
            agents={agents}
            filter={filter}
            onFilterChange={selectFilter}
            onOpenAgent={openAgent}
            onNewAgent={newAgent}
            archivedDays={archivedDays}
            viewingDayId={viewingDayId}
            onSelectDay={selectDay}
            dayStatus={dayStatus}
            dayOpenedAt={dayOpenedAt}
            dayClosedAt={dayClosedAt}
            onCloseDay={() => setConfirmClose(true)}
            onOpenNewDay={openNewDay}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        }
      >
        {/* Inicio es lo primero que se ve al entrar, así que es donde más se
            nota que algo tarda: sus números salen de tres consultas distintas y
            hasta que llegan todo vale cero. Un tablero lleno de ceros no dice
            "estoy cargando", dice "hoy no pasó nada". */}
        {page === 'home' && (
          <Home
            stats={stats}
            messages={messages}
            products={products}
            settings={settings}
            cargando={mensajesCargando || settingsCargando}
            dayStatus={dayStatus}
            dayOpenedAt={dayOpenedAt}
            dayClosedAt={dayClosedAt}
            archivedDays={archivedDays}
            onOpenNewDay={openNewDay}
            onNavigate={navigate}
          />
        )}
        {page === 'inbox' && (
          <Inbox
            allGroups={allGroups}
            cargando={mensajesCargando}
            filter={filter}
            viewingDay={viewingDay}
            onLeaveDay={() => setViewingDayId(null)}
            focusPhone={focusPhone}
            username={user.username}
            drafts={drafts}
            agents={agents}
            onAssign={assignConversation}
            onChangeAgent={changeConversationAgent}
            onAddTag={addConversationTag}
            onRemoveTag={removeConversationTag}
            onResolveConversation={resolveConversation}
            onSend={sendMessage}
            onSendMedia={sendMedia}
            onAddNote={addNote}
            dayStatus={dayStatus}
          />
        )}
        {page === 'products' && (
          <Products
            products={products}
            folders={folders}
            cargando={productsCargando}
            error={productsError}
            onAdd={addProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            onMove={moveProduct}
            onAddFolder={addFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
          />
        )}
        {page === 'agents' && (
          <Agents
            agents={agents}
            stats={agentStats}
            cargando={agentsCargando}
            error={agentsError}
            focus={agentFocus}
            onFocusHandled={clearAgentFocus}
            onAdd={addAgent}
            onUpdate={updateAgent}
            onDelete={deleteAgent}
            onReorder={reorderAgents}
          />
        )}
        {page === 'templates' && (
          <Templates
            templates={templates}
            conectado={waConectado}
            cargando={templatesCargando}
            error={templatesError}
            onRefresh={refrescarTemplates}
            onCreate={addTemplate}
            onDelete={deleteTemplate}
          />
        )}
        {page === 'settings' && (
          <Settings
            settings={settings}
            onUpdate={updateSettings}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </Layout>

      {/* El botón de cerrar el día está en la barra, que ahora se ve en toda la
          app: la confirmación tiene que vivir igual de arriba. */}
      {confirmClose && (
        <Modal title={t('dia.cerrarDia')} onClose={() => setConfirmClose(false)}>
          <p className="text-sm text-ink-secondary">
            {t('dia.confirmarCierre', { mensajes: messages.length, pendientes: stats.pendientes })}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmClose(false)}>
              {t('comun.cancelar')}
            </Button>
            <Button onClick={handleConfirmClose}>{t('dia.cerrarDia')}</Button>
          </div>
        </Modal>
      )}
    </>
  )
}

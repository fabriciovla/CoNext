import { useState } from 'react'
import Login from './pages/Login'
import Layout from './components/Layout'
import Inbox from './pages/Inbox'
import Products from './pages/Products'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Agents from './pages/Agents'
import useAuth from './hooks/useAuth'
import useMessages from './hooks/useMessages'
import useProducts from './hooks/useProducts'
import useSettings from './hooks/useSettings'
import useAgents from './hooks/useAgents'

export default function App() {
  const { user, isAuthenticated, error, login, logout } = useAuth()
  const {
    messages,
    resolveConversation,
    sendMessage,
    addNote,
    assignments,
    assignConversation,
    changeConversationAgent,
    addConversationTag,
    removeConversationTag,
    conversationsMeta,
    drafts,
    stats,
    dayStatus,
    dayOpenedAt,
    dayClosedAt,
    archivedDays,
    closeDay,
    openNewDay,
  } = useMessages()
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  const { settings, updateSettings } = useSettings()
  const {
    agents,
    stats: agentStats,
    error: agentsError,
    addAgent,
    updateAgent,
    deleteAgent,
    reorderAgents,
  } = useAgents()
  const [page, setPage] = useState('home')
  // Teléfono que se pide abrir al llegar a la bandeja (desde los widgets de
  // Inicio). La navegación normal del sidebar lo deja en null.
  const [focusPhone, setFocusPhone] = useState(null)

  const navigate = (nextPage, phone = null) => {
    setPage(nextPage)
    setFocusPhone(phone)
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} error={error} />
  }

  return (
    <Layout
      current={page}
      onNavigate={navigate}
      username={user.username}
      onLogout={logout}
      pendingCount={stats.pendientes}
    >
      {page === 'home' && (
        <Home
          stats={stats}
          messages={messages}
          products={products}
          settings={settings}
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
          messages={messages}
          focusPhone={focusPhone}
          username={user.username}
          onNavigate={navigate}
          onLogout={logout}
          pendingStat={stats.pendientes}
          assignments={assignments}
          conversationsMeta={conversationsMeta}
          drafts={drafts}
          agents={agents}
          onAssign={assignConversation}
          onChangeAgent={changeConversationAgent}
          onAddTag={addConversationTag}
          onRemoveTag={removeConversationTag}
          onResolveConversation={resolveConversation}
          onSend={sendMessage}
          onAddNote={addNote}
          dayStatus={dayStatus}
          dayOpenedAt={dayOpenedAt}
          dayClosedAt={dayClosedAt}
          archivedDays={archivedDays}
          onCloseDay={closeDay}
          onOpenNewDay={openNewDay}
        />
      )}
      {page === 'products' && (
        <Products
          products={products}
          onAdd={addProduct}
          onUpdate={updateProduct}
          onDelete={deleteProduct}
        />
      )}
      {page === 'agents' && (
        <Agents
          agents={agents}
          stats={agentStats}
          error={agentsError}
          onAdd={addAgent}
          onUpdate={updateAgent}
          onDelete={deleteAgent}
          onReorder={reorderAgents}
        />
      )}
      {page === 'settings' && <Settings settings={settings} onUpdate={updateSettings} />}
    </Layout>
  )
}

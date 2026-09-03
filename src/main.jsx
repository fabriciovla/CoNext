import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { IdiomaProvider } from './lib/i18n.jsx'
import './index.css'

// El idioma envuelve a todo, incluida la pantalla de ingreso: se elige antes de
// haber entrado a ninguna cuenta, porque es una preferencia de este equipo y no
// del negocio. Ver `lib/i18n.jsx`.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IdiomaProvider>
      <App />
    </IdiomaProvider>
  </React.StrictMode>,
)

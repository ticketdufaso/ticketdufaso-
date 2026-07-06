/**
 * Point d'entrée principal - FASO TICKET
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

// ============================================================
// SÉCURITÉ : DÉSACTIVER TOUS LES LOGS EN PRODUCTION
// ============================================================

if (import.meta.env.PROD) {
  const noop = () => {}
  
  console.log = noop
  console.debug = noop
  console.info = noop
  console.warn = noop
  console.error = noop
  console.trace = noop
  console.group = noop
  console.groupEnd = noop
  console.groupCollapsed = noop
  console.time = noop
  console.timeEnd = noop
  console.timeLog = noop
  console.count = noop
  console.countReset = noop
  console.table = noop
  console.dir = noop
  console.dirxml = noop
  console.assert = noop
  console.clear = noop
  console.profile = noop
  console.profileEnd = noop
  
  if (window.performance) {
    window.performance.mark = noop
    window.performance.measure = noop
    window.performance.clearMarks = noop
    window.performance.clearMeasures = noop
  }
  
  if (window.PerformanceObserver) {
    try {
      window.PerformanceObserver = noop
    } catch {}
  }
  
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = noop
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on = noop
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.off = noop
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.emit = noop
    } catch {}
  }
  
  if (window.__SUPABASE__) {
    try {
      window.__SUPABASE__.log = noop
    } catch {}
  }
}

// ============================================================
// SÉCURITÉ : PROTECTION CONTRE L'INSPECTION
// ============================================================

if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
  })

  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U') ||
      (e.ctrlKey && e.key === 'C' && !e.target.closest('input, textarea, [contenteditable]'))
    ) {
      e.preventDefault()
      return false
    }
  })

  document.addEventListener('selectstart', (e) => {
    if (!e.target.closest('input, textarea, [contenteditable]')) {
      e.preventDefault()
      return false
    }
  })

  document.addEventListener('dragstart', (e) => {
    if (!e.target.closest('input, textarea, [contenteditable]')) {
      e.preventDefault()
      return false
    }
  })

  document.addEventListener('keyup', (e) => {
    if (e.key === 'F12') {
      e.preventDefault()
      return false
    }
  })
}

// ============================================================
// RENDU DE L'APPLICATION
// ============================================================

const rootElement = document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  )
}
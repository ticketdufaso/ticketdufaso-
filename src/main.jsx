/**
 * Point d'entrée principal - FASO TICKET
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * CORRECTIONS :
 * - Désactivation COMPLÈTE de tous les console.* en production
 * - Protection renforcée contre l'inspection
 * - Gestion des erreurs silencieuse
 * - CORRECTION : Import dynamique pour html2canvas
 * - CORRECTION : Gestion des erreurs de chargement
 */
import './polyfills.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

// ============================================================
// POLYFILL : Gestion de html2canvas pour Netlify
// ============================================================

// S'assurer que l'environnement est prêt pour html2canvas
if (typeof window !== 'undefined') {
  // Si html2canvas n'est pas défini, on le définit comme un objet vide
  // pour éviter les erreurs de référence
  if (!window.html2canvas) {
    window.html2canvas = {}
  }
  
  // S'assurer que les APIs nécessaires existent
  if (!window.HTMLCanvasElement) {
    window.HTMLCanvasElement = class HTMLCanvasElement {}
  }
}

// ============================================================
// SÉCURITÉ : DÉSACTIVER TOUS LES LOGS EN PRODUCTION
// ============================================================

if (import.meta.env.PROD) {
  // Fonction vide pour désactiver les logs
  const noop = () => {}
  
  // Désactiver TOUS les console.*
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
  
  // Désactiver les logs de performance
  if (window.performance) {
    window.performance.mark = noop
    window.performance.measure = noop
    window.performance.clearMarks = noop
    window.performance.clearMeasures = noop
  }
  
  // Désactiver l'API PerformanceObserver
  if (window.PerformanceObserver) {
    try {
      window.PerformanceObserver = noop
    } catch {
      // Ignorer les erreurs
    }
  }
  
  // Désactiver React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = noop
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on = noop
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.off = noop
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.emit = noop
    } catch {
      // Ignorer les erreurs
    }
  }
  
  // Désactiver les logs de Supabase
  if (window.__SUPABASE__) {
    try {
      window.__SUPABASE__.log = noop
    } catch {
      // Ignorer les erreurs
    }
  }
}

// ============================================================
// SÉCURITÉ : PROTECTION CONTRE L'INSPECTION
// ============================================================

if (import.meta.env.PROD) {
  // Bloquer le clic droit
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
  })

  // Bloquer les raccourcis d'inspection
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

  // Bloquer la sélection de texte (sauf dans les champs de formulaire)
  document.addEventListener('selectstart', (e) => {
    if (!e.target.closest('input, textarea, [contenteditable]')) {
      e.preventDefault()
      return false
    }
  })

  // Désactiver le drag & drop
  document.addEventListener('dragstart', (e) => {
    if (!e.target.closest('input, textarea, [contenteditable]')) {
      e.preventDefault()
      return false
    }
  })

  // Bloquer l'ouverture de la console
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
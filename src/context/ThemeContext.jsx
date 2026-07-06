/**
 * Contexte de thème - Clair/Sombre
 * Règles NASA 1-10
 * Persistance dans localStorage
 * Sécurité niveau Google/Windows
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)
const THEME_KEY = 'faso-ticket-theme'

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Ignorer les erreurs localStorage
    }
    
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    } catch {
      // Ignorer les erreurs
    }
    return 'light'
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    try {
      const root = document.documentElement
      
      if (theme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
        document.body.style.backgroundColor = '#000000'
        document.body.style.color = '#ffffff'
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
        document.body.style.backgroundColor = '#f5f5f5'
        document.body.style.color = '#000000'
      }
      
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Ignorer les erreurs
    }
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider')
  }
  return context
}

export default ThemeContext
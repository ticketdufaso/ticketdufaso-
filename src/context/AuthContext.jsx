/**
 * Contexte d'authentification
 * Règles NASA 1, 4, 5, 6
 */

import React, { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const auth = useAuth()
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext doit être utilisé dans un AuthProvider')
  }
  return context
}

export default AuthContext
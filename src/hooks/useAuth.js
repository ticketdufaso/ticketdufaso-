/**
 * Hook d'authentification - Sécurisé
 * Règles NASA 1, 4, 5, 6, 7
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUser, getUserRole } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUser = await getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        const userData = await getUserRole(currentUser.id)
        setRole(userData?.role || null)
      } else {
        setUser(null)
        setRole(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      const userData = await getUserRole(data.user.id)
      setUser(data.user)
      setRole(userData?.role || null)
      
      return { user: data.user, role: userData?.role || null }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setRole(null)
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const isAuthenticated = useCallback(() => {
    return !!user
  }, [user])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user,
    role,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated
  }
}

export default useAuth
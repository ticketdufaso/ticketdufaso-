/**
 * Page Réinitialisation de mot de passe
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * Version complète et finale
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Eye, EyeOff, Key, Loader, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

const ReinitialiserMotDePasse = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Vérifier si le token est valide
    const hashParams = new URLSearchParams(location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken) {
      // Stocker les tokens
      sessionStorage.setItem('reset_access_token', accessToken)
      sessionStorage.setItem('reset_refresh_token', refreshToken || '')
      setTokenValid(true)
    } else {
      // Vérifier si on a déjà un token stocké
      const storedToken = sessionStorage.getItem('reset_access_token')
      if (storedToken) {
        setTokenValid(true)
      } else {
        setTokenValid(false)
        setError('Lien de réinitialisation invalide ou expiré.')
      }
    }
    setChecking(false)
  }, [location])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setSuccess('Mot de passe changé avec succès !')
      sessionStorage.removeItem('reset_access_token')
      sessionStorage.removeItem('reset_refresh_token')
      
      setTimeout(() => {
        navigate('/connexion')
      }, 3000)
    } catch (error) {
      setError('Erreur lors du changement de mot de passe. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Lien invalide</h2>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
          <button
            onClick={() => navigate('/mot-de-passe-oublie')}
            className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Demander un nouveau lien
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8 md:py-12">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Réinitialiser <span className="text-yellow-400">le mot de passe</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Entrez votre nouveau mot de passe
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="8 caractères min"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="Confirmer"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Changement...
              </>
            ) : (
              'Changer le mot de passe'
            )}
          </button>

          <div className="text-center">
            <button
              onClick={() => navigate('/connexion')}
              className="text-gray-400 hover:text-yellow-400 transition-colors text-sm flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3 h-3" />
              Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReinitialiserMotDePasse
/**
 * Page Mot de passe oublié
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * Version complète et finale
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, ArrowLeft, Loader, CheckCircle, AlertCircle, Eye, EyeOff, Lock, Key } from 'lucide-react'

const MotDePasseOublie = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleVerifyEmail = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!email || !email.includes('@')) {
      setError('Email invalide')
      setLoading(false)
      return
    }

    try {
      // Vérifier si l'email existe dans la table profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        setError('Email non trouvé dans notre système')
        setLoading(false)
        return
      }

      // Envoyer un email de réinitialisation via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      })

      if (resetError) throw resetError

      setSuccess('Un email de réinitialisation a été envoyé à votre adresse.')
      setStep('confirmation')
    } catch (error) {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8 md:py-12">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Mot de passe <span className="text-yellow-400">oublié</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {step === 'email' && 'Entrez votre email pour réinitialiser votre mot de passe'}
            {step === 'confirmation' && 'Un email vous a été envoyé'}
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

        {/* Étape 1 : Email */}
        {step === 'email' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                />
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
                  Vérification...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>

            <div className="text-center">
              <Link
                to="/connexion"
                className="text-gray-400 hover:text-yellow-400 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}

        {/* Étape 2 : Confirmation */}
        {step === 'confirmation' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <Mail className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-300 text-sm">
                Un email de réinitialisation a été envoyé à <strong className="text-white">{email}</strong>
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
              </p>
            </div>

            <button
              onClick={() => setStep('email')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg transition-colors text-sm"
            >
              Renvoyer l'email
            </button>

            <div className="text-center">
              <Link
                to="/connexion"
                className="text-gray-400 hover:text-yellow-400 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MotDePasseOublie
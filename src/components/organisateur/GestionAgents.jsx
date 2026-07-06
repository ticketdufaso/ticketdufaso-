/**
 * Gestion des Agents - Organisateur
 * Règles NASA 1-10
 * Version corrigée - nom_complet
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, UserPlus, Trash2, Eye, Loader, RefreshCw,
  Search, Mail, Lock, CheckCircle, XCircle,
  AlertCircle, ArrowLeft, Smartphone, User
} from 'lucide-react'

const GestionAgents = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [planInfo, setPlanInfo] = useState({ agentsMax: 0 })

  const [formData, setFormData] = useState({
    nom_complet: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      fetchAgents()
      fetchPlanInfo()
    }
  }, [user])

  const fetchPlanInfo = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan_id')
        .eq('id', user.id)
        .single()

      if (profileData && profileData.plan_id) {
        const { data: planData } = await supabase
          .from('plans')
          .select('agents_max')
          .eq('nom', profileData.plan_id)
          .single()

        if (planData) {
          setPlanInfo({ agentsMax: planData.agents_max || 0 })
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const fetchAgents = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Erreur:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddAgent = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!formData.nom_complet || formData.nom_complet.length < 2) {
      setError('Nom complet invalide')
      setSubmitting(false)
      return
    }
    if (!formData.email || !formData.email.includes('@')) {
      setError('Email invalide')
      setSubmitting(false)
      return
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setSubmitting(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setSubmitting(false)
      return
    }

    if (agents.length >= planInfo.agentsMax) {
      setError(`Vous avez atteint la limite de ${planInfo.agentsMax} agents pour votre plan`)
      setSubmitting(false)
      return
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzd3ppZ3FrcXFubHd2Z3V2cmdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjUwNzg0MCwiZXhwIjoyMDk4MDgzODQwfQ.bm4kwE2co0Tmmp_Q1a0TUyoI6BlztMsEj3jMzmPG9AY'

      const userData = {
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          nom_complet: formData.nom_complet,
          role: 'agent',
          created_by: user.id
        }
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création')
      }

      const authData = await response.json()

      const profileData = {
        id: authData.id,
        email: formData.email,
        nom_complet: formData.nom_complet,
        role: 'agent',
        created_by: user.id,
        statut: true
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])

      if (profileError) throw profileError

      setSuccess('Agent créé avec succès !')
      setShowAddModal(false)
      setFormData({ nom_complet: '', email: '', password: '', confirmPassword: '' })
      await fetchAgents()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.message || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAgent = async (agentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet agent ?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', agentId)
        .eq('created_by', user.id)

      if (error) throw error
      setSuccess('Agent supprimé avec succès')
      await fetchAgents()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la suppression')
    }
  }

  const getStatusBadge = (statut) => {
    return statut ? (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Actif</span>
    ) : (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Inactif</span>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const filteredAgents = agents.filter(a =>
    a.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/organisateur/dashboard')}
            className="text-gray-400 hover:text-yellow-400 transition-colors p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Gestion des <span className="text-yellow-400">agents</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {agents.length} / {planInfo.agentsMax} agents
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel agent
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-yellow-400" />
            <p className="text-gray-300 text-sm">
              Les agents créés ne peuvent pas se connecter au site web. 
              Ils auront accès à leur dashboard uniquement via l'application mobile.
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {filteredAgents.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-30" />
            <p className="text-gray-400 text-lg">Aucun agent</p>
            <p className="text-gray-500 text-sm">Créez votre premier agent pour gérer vos événements</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Créer un agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-yellow-400/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{agent.nom_complet}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {agent.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {getStatusBadge(agent.statut)}
                      <span className="text-gray-500 text-xs">
                        Créé le {formatDate(agent.created_at)}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <User className="w-3 h-3" />
                        par vous
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedAgent(agent); setShowDetailsModal(true) }}
                      className="text-gray-400 hover:text-yellow-400 transition-colors p-1"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout Agent */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">Ajouter un agent</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={formData.nom_complet}
                  onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="Nom complet"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="agent@email.com"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Mot de passe *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="8 caractères min"
                  required
                  minLength="8"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="Confirmer"
                  required
                />
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50">
                  {submitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails Agent */}
      {showDetailsModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">Détails de l'agent</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div><p className="text-gray-400 text-xs">Nom complet</p><p className="text-white">{selectedAgent.nom_complet}</p></div>
              <div><p className="text-gray-400 text-xs">Email</p><p className="text-white">{selectedAgent.email}</p></div>
              <div><p className="text-gray-400 text-xs">Rôle</p><p className="text-white font-medium">Agent</p></div>
              <div><p className="text-gray-400 text-xs">Statut</p><p>{getStatusBadge(selectedAgent.statut)}</p></div>
              <div><p className="text-gray-400 text-xs">Créé par</p><p className="text-white">Vous</p></div>
              <div><p className="text-gray-400 text-xs">Date de création</p><p className="text-white">{formatDate(selectedAgent.created_at)}</p></div>
              <div><p className="text-gray-400 text-xs">Accès</p><p className="text-gray-400">📱 Uniquement application mobile</p></div>
            </div>

            <div className="mt-6">
              <button onClick={() => setShowDetailsModal(false)} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionAgents
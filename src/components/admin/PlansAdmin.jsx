/**
 * Gestion des Plans - Admin
 * Règles NASA 1-10
 * Plans Basique et Premium avec leurs avantages spécifiques
 * CORRECTION FINALE : Basique=2 codes, Premium=5 codes
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Crown, Plus, Trash2, Edit, Loader, RefreshCw, 
  Eye, EyeOff, Save, Calendar, Users, Ticket, 
  Star, ShoppingBag, Zap, BarChart3, FileText, MessageSquare,
  CheckCircle, XCircle
} from 'lucide-react'

const PlansAdmin = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  
  const typeTicketOptions = ['Simple', 'VIP', 'VVIP', 'Stand', 'Salon', 'Personnalisé']
  
  const featureOptions = [
    { id: 'visibilite_une', label: 'Visibilité à la une', icon: <Star className="w-4 h-4" /> },
    { id: 'visibilite_boutique', label: 'Visibilité dans la boutique', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'codes_promo_illimites', label: 'Codes promo illimités', icon: <Zap className="w-4 h-4" /> },
    { id: 'stats_avancees', label: 'Statistiques avancées', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'export', label: 'Export Excel / PDF', icon: <FileText className="w-4 h-4" /> },
    { id: 'messagerie', label: 'Messagerie avec l\'administration', icon: <MessageSquare className="w-4 h-4" /> }
  ]

  const defaultPlans = {
    'Basique': {
      nom: 'Basique',
      prix: 30000,
      duree_jours: 30,
      evenements_max: 2,
      agents_max: 2,
      codes_max: 2,
      types_tickets: ['Simple', 'VIP'],
      visibilite_une: false,
      visibilite_boutique: true,
      codes_promo_illimites: false,
      stats_avancees: false,
      export: false,
      messagerie: false,
      ordre: 1,
      actif: true
    },
    'Premium': {
      nom: 'Premium',
      prix: 50000,
      duree_jours: 90,
      evenements_max: 10,
      agents_max: 5,
      codes_max: 5,
      types_tickets: ['Simple', 'VIP', 'VVIP', 'Stand', 'Salon', 'Personnalisé'],
      visibilite_une: true,
      visibilite_boutique: true,
      codes_promo_illimites: true,
      stats_avancees: true,
      export: true,
      messagerie: true,
      ordre: 2,
      actif: true
    }
  }

  const [formData, setFormData] = useState({
    nom: '',
    prix: '',
    duree_jours: '',
    evenements_max: '',
    agents_max: '',
    codes_max: '',
    types_tickets: ['Simple', 'VIP'],
    visibilite_une: false,
    visibilite_boutique: true,
    codes_promo_illimites: false,
    stats_avancees: false,
    export: false,
    messagerie: false,
    ordre: 0,
    actif: true
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('ordre', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        await createDefaultPlans()
      } else {
        // ✅ Correction : Forcer les limites correctes
        const correctedPlans = data.map(plan => {
          if (plan.nom === 'Basique' && plan.codes_max !== 2) {
            return { ...plan, codes_max: 2 }
          }
          if (plan.nom === 'Premium' && plan.codes_max !== 5) {
            return { ...plan, codes_max: 5 }
          }
          return plan
        })
        setPlans(correctedPlans)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultPlans = async () => {
    try {
      const defaultPlansArray = Object.values(defaultPlans)
      
      const { data, error } = await supabase
        .from('plans')
        .insert(defaultPlansArray)
        .select()

      if (error) throw error
      setPlans(data || [])
      setSuccess('Plans par défaut créés avec succès')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erreur création plans par défaut:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!formData.nom || formData.nom.length < 2) {
      setError('Nom du plan requis')
      setSubmitting(false)
      return
    }
    if (!formData.prix || parseInt(formData.prix) <= 0) {
      setError('Prix invalide')
      setSubmitting(false)
      return
    }
    if (!formData.duree_jours || parseInt(formData.duree_jours) <= 0) {
      setError('Durée invalide')
      setSubmitting(false)
      return
    }
    if (formData.types_tickets.length === 0) {
      setError('Sélectionnez au moins un type de ticket')
      setSubmitting(false)
      return
    }

    // ✅ Correction : Forcer les limites
    let codesMax = parseInt(formData.codes_max) || 0
    if (formData.nom === 'Basique') {
      codesMax = Math.min(codesMax, 2)
    } else if (formData.nom === 'Premium') {
      codesMax = Math.min(codesMax, 5)
    }

    try {
      const dataToSave = {
        nom: formData.nom,
        prix: parseInt(formData.prix),
        duree_jours: parseInt(formData.duree_jours),
        evenements_max: parseInt(formData.evenements_max) || 0,
        agents_max: parseInt(formData.agents_max) || 0,
        codes_max: codesMax,
        types_tickets: formData.types_tickets,
        visibilite_une: formData.visibilite_une,
        visibilite_boutique: formData.visibilite_boutique,
        codes_promo_illimites: formData.codes_promo_illimites,
        stats_avancees: formData.stats_avancees,
        export: formData.export,
        messagerie: formData.messagerie,
        ordre: parseInt(formData.ordre) || 0,
        actif: formData.actif
      }

      if (showEditModal && selectedItem) {
        const { error } = await supabase
          .from('plans')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedItem.id)

        if (error) throw error
        setSuccess('Plan mis à jour avec succès')
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([dataToSave])

        if (error) throw error
        setSuccess('Plan créé avec succès')
      }

      setShowAddModal(false)
      setShowEditModal(false)
      resetForm()
      await fetchPlans()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de l\'opération')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prix: '',
      duree_jours: '',
      evenements_max: '',
      agents_max: '',
      codes_max: '',
      types_tickets: ['Simple', 'VIP'],
      visibilite_une: false,
      visibilite_boutique: true,
      codes_promo_illimites: false,
      stats_avancees: false,
      export: false,
      messagerie: false,
      ordre: 0,
      actif: true
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) return

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Plan supprimé avec succès')
      await fetchPlans()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la suppression')
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ actif: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await fetchPlans()
    } catch (error) {
      setError('Erreur lors du changement de statut')
    }
  }

  const openEditModal = (item) => {
    setSelectedItem(item)
    setFormData({
      nom: item.nom,
      prix: item.prix.toString(),
      duree_jours: item.duree_jours.toString(),
      evenements_max: item.evenements_max?.toString() || '0',
      agents_max: item.agents_max?.toString() || '0',
      codes_max: item.codes_max?.toString() || '0',
      types_tickets: item.types_tickets || ['Simple', 'VIP'],
      visibilite_une: item.visibilite_une || false,
      visibilite_boutique: item.visibilite_boutique !== undefined ? item.visibilite_boutique : true,
      codes_promo_illimites: item.codes_promo_illimites || false,
      stats_avancees: item.stats_avancees || false,
      export: item.export || false,
      messagerie: item.messagerie || false,
      ordre: item.ordre || 0,
      actif: item.actif !== undefined ? item.actif : true
    })
    setShowEditModal(true)
  }

  const toggleTicketType = (type) => {
    setFormData(prev => {
      const current = prev.types_tickets || []
      if (current.includes(type)) {
        return { ...prev, types_tickets: current.filter(t => t !== type) }
      } else {
        return { ...prev, types_tickets: [...current, type] }
      }
    })
  }

  const getPlanFeatures = (plan) => {
    const features = []
    if (plan.visibilite_une) features.push({ label: '⭐ À la une', color: 'bg-yellow-500/20 text-yellow-400' })
    if (plan.visibilite_boutique) features.push({ label: '🛒 Boutique', color: 'bg-blue-500/20 text-blue-400' })
    if (plan.codes_promo_illimites) features.push({ label: '🏷️ Promo illimitées', color: 'bg-green-500/20 text-green-400' })
    if (plan.stats_avancees) features.push({ label: '📊 Stats avancées', color: 'bg-purple-500/20 text-purple-400' })
    if (plan.export) features.push({ label: '📎 Export', color: 'bg-orange-500/20 text-orange-400' })
    if (plan.messagerie) features.push({ label: '💬 Messagerie', color: 'bg-indigo-500/20 text-indigo-400' })
    return features
  }

  const formatCurrency = (value) => {
    return value?.toLocaleString() || '0'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">Plans d'abonnement</h2>
            <span className="text-gray-400 text-sm">({plans.length})</span>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouveau plan
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={fetchPlans}
            className="text-gray-400 hover:text-yellow-400 transition-colors p-2"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-2 rounded-lg">
            {success}
          </div>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <Crown className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Aucun plan configuré</p>
          <button
            onClick={createDefaultPlans}
            className="mt-2 text-yellow-400 hover:text-yellow-300 text-sm"
          >
            Créer les plans par défaut
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {plans.map((item) => {
            const features = getPlanFeatures(item)
            return (
              <div 
                key={item.id} 
                className={`bg-gray-800 rounded-xl p-4 border transition-all ${
                  item.actif 
                    ? 'border-gray-700 hover:border-yellow-400/30' 
                    : 'border-red-500/20 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-lg">{item.nom}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-400 font-bold text-xl">
                        {formatCurrency(item.prix)} FCFA
                      </span>
                      <span className="text-gray-400 text-sm">/ {item.duree_jours} jours</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.actif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Calendar className="w-4 h-4 text-yellow-400" />
                    <span>{item.evenements_max === 999999 ? 'Illimité' : item.evenements_max} événements max</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Users className="w-4 h-4 text-yellow-400" />
                    <span>{item.agents_max === 999999 ? 'Illimité' : item.agents_max} agents max</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Ticket className="w-4 h-4 text-yellow-400" />
                    <span>{item.codes_max === 999999 ? 'Illimité' : item.codes_max} codes</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.types_tickets?.map((type) => (
                      <span key={type} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {features.map((f, idx) => (
                      <span key={idx} className={`text-xs px-2 py-0.5 rounded ${f.color}`}>
                        {f.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => handleToggleStatus(item.id, item.actif)}
                    className={`transition-colors p-1 ${
                      item.actif ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                    }`}
                    title={item.actif ? 'Désactiver' : 'Activer'}
                  >
                    {item.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Ajout/Modification */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">
                {showEditModal ? 'Modifier' : 'Nouveau'} plan
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Nom du plan *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="Premium"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Prix (FCFA) *</label>
                  <input
                    type="number"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="50000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Durée (jours) *</label>
                  <input
                    type="number"
                    value={formData.duree_jours}
                    onChange={(e) => setFormData({ ...formData, duree_jours: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="90"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.ordre}
                    onChange={(e) => setFormData({ ...formData, ordre: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Limites */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Événements max</label>
                  <input
                    type="number"
                    value={formData.evenements_max}
                    onChange={(e) => setFormData({ ...formData, evenements_max: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Agents max</label>
                  <input
                    type="number"
                    value={formData.agents_max}
                    onChange={(e) => setFormData({ ...formData, agents_max: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Codes max</label>
                  <input
                    type="number"
                    value={formData.codes_max}
                    onChange={(e) => setFormData({ ...formData, codes_max: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="5"
                  />
                  <p className="text-yellow-400 text-[10px] mt-1">⚠️ Basique: 2 | Premium: 5</p>
                </div>
              </div>

              {/* Types de tickets */}
              <div>
                <label className="text-gray-400 text-sm block mb-2">Types de tickets</label>
                <div className="flex flex-wrap gap-2">
                  {typeTicketOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTicketType(type)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        formData.types_tickets?.includes(type)
                          ? 'bg-yellow-400 text-black font-medium'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fonctionnalités */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-gray-300 text-sm font-medium mb-2">Fonctionnalités</h4>
                <div className="grid grid-cols-2 gap-2">
                  {featureOptions.map((feature) => (
                    <label key={feature.id} className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="checkbox"
                        checked={formData[feature.id] || false}
                        onChange={(e) => setFormData({ ...formData, [feature.id]: e.target.checked })}
                        className="accent-yellow-400"
                      />
                      {feature.icon}
                      {feature.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Statut */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    className="accent-yellow-400"
                  />
                  Plan actif
                </label>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {showEditModal ? 'Modifier' : 'Créer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlansAdmin
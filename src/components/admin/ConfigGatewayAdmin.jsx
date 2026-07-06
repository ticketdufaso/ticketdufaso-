/**
 * Configuration Gateway - Admin
 * Règles NASA 1-10
 * Gestion des numéros acceptés et des expéditeurs autorisés
 * Version corrigée - Numéro facultatif pour les expéditeurs
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Phone, Users, Plus, Trash2, Edit, Loader, Search, RefreshCw, 
  Eye, EyeOff, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'

const ConfigGatewayAdmin = () => {
  const [activeTab, setActiveTab] = useState('numeros')
  const [numeros, setNumeros] = useState([])
  const [expediteurs, setExpediteurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    numero: '',
    nom_associe: '',
    nom: '',
    actif: true,
    is_default: false
  })

  // Récupérer les numéros acceptés
  const fetchNumeros = async () => {
    try {
      const { data, error } = await supabase
        .from('numeros_acceptes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNumeros(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Récupérer les expéditeurs autorisés
  const fetchExpediteurs = async () => {
    try {
      const { data, error } = await supabase
        .from('expediteurs_autorises')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpediteurs(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchNumeros(), fetchExpediteurs()])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // Gestion des numéros
  const handleNumeroSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!formData.numero || !/^[0-9]{8}$/.test(formData.numero)) {
      setError('Numéro invalide (ex: 70123456)')
      setSubmitting(false)
      return
    }

    if (!formData.nom_associe || formData.nom_associe.length < 2) {
      setError('Nom associé requis')
      setSubmitting(false)
      return
    }

    try {
      if (showEditModal && selectedItem) {
        // Mise à jour
        const { error } = await supabase
          .from('numeros_acceptes')
          .update({
            numero: formData.numero,
            nom_associe: formData.nom_associe,
            actif: formData.actif,
            is_default: formData.is_default,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedItem.id)

        if (error) throw error
        setSuccess('Numéro mis à jour avec succès')
      } else {
        // Création
        const { error } = await supabase
          .from('numeros_acceptes')
          .insert([{
            numero: formData.numero,
            nom_associe: formData.nom_associe,
            actif: formData.actif,
            is_default: formData.is_default
          }])

        if (error) throw error
        setSuccess('Numéro ajouté avec succès')
      }

      setShowAddModal(false)
      setShowEditModal(false)
      setFormData({
        numero: '',
        nom_associe: '',
        nom: '',
        actif: true,
        is_default: false
      })
      await fetchNumeros()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de l\'opération')
    } finally {
      setSubmitting(false)
    }
  }

  // Gestion des expéditeurs
  const handleExpediteurSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!formData.nom || formData.nom.length < 2) {
      setError('Nom requis')
      setSubmitting(false)
      return
    }

    // Le numéro est facultatif
    // Si fourni, on le valide
    if (formData.numero && !/^[0-9]{3,}$/.test(formData.numero)) {
      setError('Numéro invalide')
      setSubmitting(false)
      return
    }

    try {
      if (showEditModal && selectedItem) {
        const { error } = await supabase
          .from('expediteurs_autorises')
          .update({
            numero: formData.numero || null,
            nom: formData.nom,
            actif: formData.actif,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedItem.id)

        if (error) throw error
        setSuccess('Expéditeur mis à jour avec succès')
      } else {
        const { error } = await supabase
          .from('expediteurs_autorises')
          .insert([{
            numero: formData.numero || null,
            nom: formData.nom,
            actif: formData.actif
          }])

        if (error) throw error
        setSuccess('Expéditeur ajouté avec succès')
      }

      setShowAddModal(false)
      setShowEditModal(false)
      setFormData({
        numero: '',
        nom_associe: '',
        nom: '',
        actif: true,
        is_default: false
      })
      await fetchExpediteurs()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de l\'opération')
    } finally {
      setSubmitting(false)
    }
  }

  // Suppression
  const handleDelete = async (table, id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Supprimé avec succès')
      await (table === 'numeros_acceptes' ? fetchNumeros() : fetchExpediteurs())
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la suppression')
    }
  }

  // Toggle statut
  const handleToggleStatus = async (table, id, currentStatus) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ actif: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await (table === 'numeros_acceptes' ? fetchNumeros() : fetchExpediteurs())
    } catch (error) {
      setError('Erreur lors du changement de statut')
    }
  }

  const openEditModal = (item, type) => {
    setSelectedItem(item)
    if (type === 'numero') {
      setFormData({
        numero: item.numero,
        nom_associe: item.nom_associe || '',
        nom: '',
        actif: item.actif,
        is_default: item.is_default || false
      })
      setShowEditModal(true)
      setActiveTab('numeros')
    } else {
      setFormData({
        numero: item.numero || '',
        nom: item.nom,
        nom_associe: '',
        actif: item.actif,
        is_default: false
      })
      setShowEditModal(true)
      setActiveTab('expediteurs')
    }
  }

  const openAddModal = (type) => {
    setSelectedItem(null)
    setFormData({
      numero: '',
      nom_associe: '',
      nom: '',
      actif: true,
      is_default: false
    })
    setShowAddModal(true)
    setActiveTab(type)
  }

  const filteredNumeros = numeros.filter(n =>
    n.numero?.includes(searchTerm) ||
    n.nom_associe?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredExpediteurs = expediteurs.filter(e =>
    e.numero?.includes(searchTerm) ||
    e.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <Phone className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">Configuration Gateway</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openAddModal('numeros')}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter un numéro
            </button>
            <button
              onClick={() => openAddModal('expediteurs')}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              Ajouter un expéditeur
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mt-4 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab('numeros')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              activeTab === 'numeros'
                ? 'bg-yellow-400 text-black font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Phone className="w-4 h-4 inline mr-2" />
            Numéros acceptés
          </button>
          <button
            onClick={() => setActiveTab('expediteurs')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              activeTab === 'expediteurs'
                ? 'bg-yellow-400 text-black font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Expéditeurs autorisés
          </button>
        </div>

        {/* Recherche */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
            />
          </div>
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

      {/* Contenu - Numéros acceptés */}
      {activeTab === 'numeros' ? (
        <div>
          <div className="p-4 bg-gray-800/30 border-b border-gray-800">
            <p className="text-gray-400 text-sm">
              Ces numéros sont affichés lors du paiement des plans. Si un numéro est désactivé, 
              les paiements reçus sur ce numéro ne seront pas enregistrés.
            </p>
          </div>
          {filteredNumeros.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Phone className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun numéro configuré</p>
              <button
                onClick={() => openAddModal('numeros')}
                className="mt-2 text-yellow-400 hover:text-yellow-300 text-sm"
              >
                Ajouter un numéro
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredNumeros.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-800/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-mono font-medium">{item.numero}</span>
                      <span className="text-gray-300">{item.nom_associe}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.actif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.actif ? 'Actif' : 'Inactif'}
                      </span>
                      {item.is_default && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          Par défaut
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus('numeros_acceptes', item.id, item.actif)}
                      className={`transition-colors p-1 ${
                        item.actif ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                      }`}
                      title={item.actif ? 'Désactiver' : 'Activer'}
                    >
                      {item.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(item, 'numero')}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('numeros_acceptes', item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Contenu - Expéditeurs autorisés
        <div>
          <div className="p-4 bg-gray-800/30 border-b border-gray-800">
            <p className="text-gray-400 text-sm">
              Seuls les SMS provenant de ces expéditeurs seront traités par le Gateway.
              Le numéro est facultatif - seul le nom est obligatoire.
            </p>
          </div>
          {filteredExpediteurs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun expéditeur autorisé</p>
              <button
                onClick={() => openAddModal('expediteurs')}
                className="mt-2 text-yellow-400 hover:text-yellow-300 text-sm"
              >
                Ajouter un expéditeur
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredExpediteurs.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-800/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-medium">{item.nom}</span>
                      {item.numero && (
                        <span className="text-gray-400 font-mono">{item.numero}</span>
                      )}
                      {!item.numero && (
                        <span className="text-gray-500 text-xs">(Numéro non spécifié)</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.actif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus('expediteurs_autorises', item.id, item.actif)}
                      className={`transition-colors p-1 ${
                        item.actif ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                      }`}
                      title={item.actif ? 'Désactiver' : 'Activer'}
                    >
                      {item.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(item, 'expediteur')}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete('expediteurs_autorises', item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Ajout/Modification */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">
                {showEditModal ? 'Modifier' : 'Ajouter'} {activeTab === 'numeros' ? 'un numéro' : 'un expéditeur'}
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

            <form onSubmit={activeTab === 'numeros' ? handleNumeroSubmit : handleExpediteurSubmit} className="space-y-4">
              {activeTab === 'numeros' ? (
                // Formulaire numéro
                <>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Numéro *</label>
                    <input
                      type="tel"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                      placeholder="70123456"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nom associé *</label>
                    <input
                      type="text"
                      value={formData.nom_associe}
                      onChange={(e) => setFormData({ ...formData, nom_associe: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                      placeholder="FASO TICKET"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.actif}
                        onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                        className="accent-yellow-400"
                      />
                      Actif
                    </label>
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="accent-yellow-400"
                      />
                      Par défaut
                    </label>
                  </div>
                </>
              ) : (
                // Formulaire expéditeur
                <>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nom *</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                      placeholder="Orange Money"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Numéro (facultatif)</label>
                    <input
                      type="text"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                      placeholder="222"
                    />
                    <p className="text-gray-500 text-xs mt-1">Le numéro n'est pas obligatoire</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.actif}
                        onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                        className="accent-yellow-400"
                      />
                      Actif
                    </label>
                  </div>
                </>
              )}

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
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : showEditModal ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigGatewayAdmin
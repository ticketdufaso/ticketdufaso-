/**
 * Gestion des Paiements - Admin
 * Règles NASA 1-10
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'  // ← CORRIGÉ : ../lib → ../../lib
import { 
  DollarSign, Trash2, CheckCircle, XCircle, AlertCircle,
  Search, Plus, Loader, RefreshCw, Eye, Edit
} from 'lucide-react'

const PaiementsAdmin = () => {
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('tous')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState({ 
    total: 0, 
    enAttente: 0, 
    valides: 0 
  })
  const [selectedPaiement, setSelectedPaiement] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  const [newPaiement, setNewPaiement] = useState({
    transaction_id: '',
    montant: '',
    numero_depot: '',
    plan_id: ''
  })

  useEffect(() => {
    fetchPaiements()
    
    const subscription = supabase
      .channel('paiements_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'paiements_plans' },
        () => fetchPaiements()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchPaiements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('paiements_plans')
        .select(`
          *,
          organisateur:profiles(email, structure, nom_associe, plan_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const paiementsData = data || []
      setPaiements(paiementsData)

      const total = paiementsData.length
      const enAttente = paiementsData.filter(p => p.statut === 'en_attente').length
      const valides = paiementsData.filter(p => p.statut === 'valide').length

      setStats({ total, enAttente, valides })
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return
    if (!confirm('Cette action est irréversible. Confirmer ?')) return

    try {
      const { error } = await supabase
        .from('paiements_plans')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setSuccess('Paiement supprimé avec succès')
      await fetchPaiements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la suppression')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleStatusChange = async (id, statut) => {
    try {
      const { error } = await supabase
        .from('paiements_plans')
        .update({ 
          statut, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) throw error
      
      setSuccess(`Statut changé en ${statut === 'valide' ? 'Validé' : 'En attente'}`)
      await fetchPaiements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors du changement de statut')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAddPaiement = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!newPaiement.transaction_id || newPaiement.transaction_id.length < 5) {
      setError('ID Transaction invalide')
      setSubmitting(false)
      return
    }
    if (!newPaiement.montant || parseInt(newPaiement.montant) <= 0) {
      setError('Montant invalide')
      setSubmitting(false)
      return
    }
    if (!newPaiement.numero_depot || !/^[0-9]{8}$/.test(newPaiement.numero_depot)) {
      setError('Numéro de dépôt invalide (ex: 70123456)')
      setSubmitting(false)
      return
    }

    try {
      const { data: existing, error: checkError } = await supabase
        .from('paiements_plans')
        .select('id, transaction_id')
        .eq('transaction_id', newPaiement.transaction_id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        setError('Cette transaction existe déjà')
        setSubmitting(false)
        return
      }

      const { error: insertError } = await supabase
        .from('paiements_plans')
        .insert([{
          transaction_id: newPaiement.transaction_id.trim(),
          montant: parseInt(newPaiement.montant),
          numero_depot: newPaiement.numero_depot.trim(),
          plan_id: newPaiement.plan_id || null,
          statut: 'en_attente',
          created_at: new Date().toISOString()
        }])

      if (insertError) throw insertError

      setSuccess('Paiement ajouté avec succès')
      setShowAddModal(false)
      setNewPaiement({
        transaction_id: '',
        montant: '',
        numero_depot: '',
        plan_id: ''
      })
      await fetchPaiements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors de l\'ajout: ' + (error.message || 'Veuillez réessayer'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewDetails = (paiement) => {
    setSelectedPaiement(paiement)
    setShowDetailsModal(true)
  }

  const filteredPaiements = paiements.filter(p => {
    const matchSearch = p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.numero_depot?.includes(searchTerm) ||
                        p.organisateur?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.organisateur?.structure?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = filter === 'tous' || p.statut === filter
    return matchSearch && matchFilter
  })

  const getStatusBadge = (statut) => {
    const config = {
      'valide': { color: 'bg-green-500/20 text-green-400', label: 'Validé', icon: <CheckCircle className="w-3 h-3" /> },
      'en_attente': { color: 'bg-yellow-500/20 text-yellow-400', label: 'En attente', icon: <AlertCircle className="w-3 h-3" /> },
      'rejete': { color: 'bg-red-500/20 text-red-400', label: 'Rejeté', icon: <XCircle className="w-3 h-3" /> }
    }
    const c = config[statut] || config['en_attente']
    return (
      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
        {c.icon}
        {c.label}
      </span>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0'
    return amount.toLocaleString()
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
      {/* ===== HEADER ===== */}
      <div className="p-4 md:p-6 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">Paiements des organisateurs</h2>
            <span className="text-gray-400 text-sm">({stats.total})</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Ajouter manuellement
          </button>
        </div>

        {/* ===== STATISTIQUES ===== */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="text-yellow-400 text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-400 text-xs">Total</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-yellow-500/20">
            <div className="text-yellow-400 text-2xl font-bold">{stats.enAttente}</div>
            <div className="text-gray-400 text-xs">En attente</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-green-500/20">
            <div className="text-green-400 text-2xl font-bold">{stats.valides}</div>
            <div className="text-gray-400 text-xs">Validés</div>
          </div>
        </div>

        {/* ===== FILTRES ET RECHERCHE ===== */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par ID, numéro, nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
          >
            <option value="tous">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validés</option>
            <option value="rejete">Rejetés</option>
          </select>
          <button
            onClick={fetchPaiements}
            className="text-gray-400 hover:text-yellow-400 transition-colors p-2"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-2 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* ===== TABLEAU DES PAIEMENTS ===== */}
      {filteredPaiements.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Aucun paiement trouvé</p>
          <p className="text-sm text-gray-500 mt-1">Les paiements détectés par le Gateway apparaîtront ici</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">ID Transaction</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Montant</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">N° Dépôt</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Plan</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden xl:table-cell">Organisateur</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Statut</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaiements.map((p) => (
                <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm font-mono max-w-[120px] truncate">
                    {p.transaction_id || '-'}
                  </td>
                  <td className="px-4 py-3 text-yellow-400 text-sm font-medium whitespace-nowrap">
                    {formatCurrency(p.montant)} FCFA
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm hidden md:table-cell">
                    {p.numero_depot || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm hidden lg:table-cell">
                    {p.plan_id || (
                      <span className="text-gray-500 text-xs">En attente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm hidden xl:table-cell max-w-[100px] truncate">
                    {p.organisateur?.structure || p.organisateur?.email || (
                      <span className="text-gray-500 text-xs">Non attribué</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(p.statut)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetails(p)}
                        className="text-gray-400 hover:text-yellow-400 transition-colors p-1"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {p.statut === 'en_attente' && (
                        <button
                          onClick={() => handleStatusChange(p.id, 'valide')}
                          className="text-green-400 hover:text-green-300 transition-colors p-1"
                          title="Valider"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {p.statut === 'valide' && (
                        <button
                          onClick={() => handleStatusChange(p.id, 'en_attente')}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                          title="Mettre en attente"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MODAL AJOUT PAIEMENT ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">Ajouter un paiement manuellement</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPaiement} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">ID Transaction *</label>
                <input
                  type="text"
                  value={newPaiement.transaction_id}
                  onChange={(e) => setNewPaiement({ ...newPaiement, transaction_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm font-mono"
                  placeholder="PP260424.1234.56789012"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={newPaiement.montant}
                  onChange={(e) => setNewPaiement({ ...newPaiement, montant: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="100000"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Numéro de dépôt *</label>
                <input
                  type="tel"
                  value={newPaiement.numero_depot}
                  onChange={(e) => setNewPaiement({ ...newPaiement, numero_depot: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="70123456"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Plan (optionnel)</label>
                <select
                  value={newPaiement.plan_id}
                  onChange={(e) => setNewPaiement({ ...newPaiement, plan_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                >
                  <option value="">Non attribué</option>
                  <option value="Basique">Basique</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DÉTAILS PAIEMENT ===== */}
      {showDetailsModal && selectedPaiement && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">Détails du paiement</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs">ID Transaction</p>
                <p className="text-white font-mono break-all">{selectedPaiement.transaction_id || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Montant</p>
                <p className="text-yellow-400 font-bold">{formatCurrency(selectedPaiement.montant)} FCFA</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Numéro de dépôt</p>
                <p className="text-white">{selectedPaiement.numero_depot || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Plan</p>
                <p className="text-white">{selectedPaiement.plan_id || 
                  <span className="text-gray-500">En attente d'attribution</span>
                }</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Organisateur</p>
                <p className="text-white">
                  {selectedPaiement.organisateur?.structure || 
                   selectedPaiement.organisateur?.email || 
                   <span className="text-gray-500">Non attribué</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Statut</p>
                <p>{getStatusBadge(selectedPaiement.statut)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Date de création</p>
                <p className="text-white">{formatDate(selectedPaiement.created_at)}</p>
              </div>
              {selectedPaiement.updated_at && selectedPaiement.updated_at !== selectedPaiement.created_at && (
                <div>
                  <p className="text-gray-400 text-xs">Dernière mise à jour</p>
                  <p className="text-white">{formatDate(selectedPaiement.updated_at)}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
              >
                Fermer
              </button>
              {selectedPaiement.statut === 'en_attente' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedPaiement.id, 'valide')
                    setShowDetailsModal(false)
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Valider
                </button>
              )}
              {selectedPaiement.statut === 'valide' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedPaiement.id, 'en_attente')
                    setShowDetailsModal(false)
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Mettre en attente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaiementsAdmin
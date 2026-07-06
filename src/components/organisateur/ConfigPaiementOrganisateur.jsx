/**
 * Configuration Paiement - Organisateur
 * Règles NASA 1-10
 * Version corrigée - Suppression du champ Plan + Bouton Retour
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../context/AuthContext'
import { 
  DollarSign, Trash2, Edit, Search, Plus, Loader, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Eye, EyeOff,
  CreditCard, Smartphone, User, Phone, ArrowLeft
} from 'lucide-react'

const ConfigPaiementOrganisateur = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [paiements, setPaiements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('tous')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState({ total: 0, enAttente: 0, valides: 0 })
  
  const [selectedPaiement, setSelectedPaiement] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  const [newPaiement, setNewPaiement] = useState({
    transaction_id: '',
    montant: '',
    numero_depot: ''
  })

  // Configuration du format USSD de l'organisateur
  const [configUssd, setConfigUssd] = useState({
    type_compte: 'courant',
    format_ussd: 'format_10',
    phone_om: '',
    code_marchand: '',
    nom_associe: ''
  })
  const [editingConfig, setEditingConfig] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPaiements()
      fetchConfigUssd()
    }
  }, [user])

  const fetchPaiements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('paiements_organisateurs')
        .select('*')
        .eq('organisateur_id', user.id)
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

  const fetchConfigUssd = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('type_compte, format_ussd, phone_om, code_marchand, nom_associe')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) {
        setConfigUssd({
          type_compte: data.type_compte || 'courant',
          format_ussd: data.format_ussd || 'format_10',
          phone_om: data.phone_om || '',
          code_marchand: data.code_marchand || '',
          nom_associe: data.nom_associe || ''
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const saveConfigUssd = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setConfigLoading(true)

    try {
      const updateData = {
        type_compte: configUssd.type_compte,
        format_ussd: configUssd.format_ussd,
        phone_om: configUssd.phone_om,
        code_marchand: configUssd.type_compte === 'commercial' && configUssd.format_ussd === 'format_3' ? configUssd.code_marchand : null,
        nom_associe: configUssd.nom_associe
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Configuration sauvegardée avec succès !')
      setEditingConfig(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) return

    try {
      const { error } = await supabase
        .from('paiements_organisateurs')
        .delete()
        .eq('id', id)
        .eq('organisateur_id', user.id)

      if (error) throw error
      setSuccess('Transaction supprimée avec succès')
      await fetchPaiements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la suppression')
    }
  }

  const handleStatusChange = async (id, statut) => {
    try {
      const { error } = await supabase
        .from('paiements_organisateurs')
        .update({ statut, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organisateur_id', user.id)

      if (error) throw error
      setSuccess(`Statut changé en ${statut === 'valide' ? 'Validé' : 'En attente'}`)
      await fetchPaiements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors du changement de statut')
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
      setError('Numéro de dépôt invalide')
      setSubmitting(false)
      return
    }

    try {
      const { error } = await supabase
        .from('paiements_organisateurs')
        .insert([{
          organisateur_id: user.id,
          transaction_id: newPaiement.transaction_id.trim(),
          montant: parseInt(newPaiement.montant),
          numero_depot: newPaiement.numero_depot.trim(),
          statut: 'en_attente'
        }])

      if (error) throw error

      setSuccess('Transaction ajoutée avec succès')
      setShowAddModal(false)
      setNewPaiement({ transaction_id: '', montant: '', numero_depot: '' })
      await fetchPaiements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de l\'ajout')
    } finally {
      setSubmitting(false)
    }
  }

  const getUssdFormat = () => {
    if (!configUssd.phone_om) return 'Configuration incomplète'
    
    if (configUssd.type_compte === 'commercial') {
      if (configUssd.format_ussd === 'format_3' && configUssd.code_marchand) {
        return `*144*3*${configUssd.code_marchand}*montant#`
      } else if (configUssd.format_ussd === 'format_10') {
        return `*144*10*${configUssd.phone_om}*montant#`
      }
    } else if (configUssd.type_compte === 'courant') {
      return `*144*2*1*${configUssd.phone_om}*montant#`
    }
    return 'Configuration invalide'
  }

  const getStatusBadge = (statut) => {
    const config = {
      'valide': { color: 'bg-green-500/20 text-green-400', label: 'Validé', icon: <CheckCircle className="w-3 h-3" /> },
      'en_attente': { color: 'bg-yellow-500/20 text-yellow-400', label: 'En attente', icon: <AlertCircle className="w-3 h-3" /> }
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
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const filteredPaiements = paiements.filter(p => {
    const matchSearch = p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.numero_depot?.includes(searchTerm)
    const matchFilter = filter === 'tous' || p.statut === filter
    return matchSearch && matchFilter
  })

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ===== BOUTON RETOUR ===== */}
      <button
        onClick={() => navigate('/organisateur/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au dashboard
      </button>

      {/* ===== CONFIGURATION USSD ===== */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">Configuration de paiement</h2>
          </div>
          <button
            onClick={() => setEditingConfig(!editingConfig)}
            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
          >
            {editingConfig ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <div className="p-4 md:p-6">
          {editingConfig ? (
            <form onSubmit={saveConfigUssd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Orange Money *</label>
                  <input
                    type="tel"
                    value={configUssd.phone_om}
                    onChange={(e) => setConfigUssd({ ...configUssd, phone_om: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="70123456"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Nom associé *</label>
                  <input
                    type="text"
                    value={configUssd.nom_associe}
                    onChange={(e) => setConfigUssd({ ...configUssd, nom_associe: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="Prénom NOM"
                    required
                  />
                  <p className="text-red-400 text-[10px] mt-1">⚠️ Inversez nom et prénom</p>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Type de compte *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="radio"
                      name="typeCompte"
                      value="courant"
                      checked={configUssd.type_compte === 'courant'}
                      onChange={(e) => setConfigUssd({ ...configUssd, type_compte: e.target.value, format_ussd: 'format_2' })}
                      className="accent-yellow-400"
                    />
                    Compte courant
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="radio"
                      name="typeCompte"
                      value="commercial"
                      checked={configUssd.type_compte === 'commercial'}
                      onChange={(e) => setConfigUssd({ ...configUssd, type_compte: e.target.value })}
                      className="accent-yellow-400"
                    />
                    Compte commercial
                  </label>
                </div>
              </div>

              {configUssd.type_compte === 'commercial' && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <label className="text-gray-400 text-sm block mb-2">Format de paiement *</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="radio"
                        name="formatUssd"
                        value="format_3"
                        checked={configUssd.format_ussd === 'format_3'}
                        onChange={(e) => setConfigUssd({ ...configUssd, format_ussd: e.target.value })}
                        className="accent-yellow-400"
                      />
                      Format 3 (code marchand)
                    </label>
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="radio"
                        name="formatUssd"
                        value="format_10"
                        checked={configUssd.format_ussd === 'format_10'}
                        onChange={(e) => setConfigUssd({ ...configUssd, format_ussd: e.target.value })}
                        className="accent-yellow-400"
                      />
                      Format 10 (numéro)
                    </label>
                  </div>

                  {configUssd.format_ussd === 'format_3' && (
                    <div className="mt-3">
                      <label className="text-gray-400 text-sm block mb-1">Code marchand *</label>
                      <input
                        type="text"
                        value={configUssd.code_marchand}
                        onChange={(e) => setConfigUssd({ ...configUssd, code_marchand: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="12345678"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">📋 Format de paiement généré :</p>
                <code className="text-yellow-400 text-sm font-mono break-all">
                  {getUssdFormat()}
                </code>
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">{error}</div>}
              {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-2 rounded-lg">{success}</div>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingConfig(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={configLoading}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {configLoading ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{configUssd.phone_om || 'Non configuré'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{configUssd.nom_associe || 'Non configuré'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  {configUssd.type_compte === 'commercial' ? 'Compte commercial' : 'Compte courant'}
                  {configUssd.type_compte === 'commercial' && ` - ${configUssd.format_ussd === 'format_3' ? 'Format 3' : 'Format 10'}`}
                </span>
              </div>
              <div className="p-2 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-xs">Format de paiement :</p>
                <code className="text-yellow-400 text-sm font-mono">{getUssdFormat()}</code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== LISTE DES TRANSACTIONS ===== */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h2 className="text-white font-semibold">Mes transactions clients</h2>
              <span className="text-gray-400 text-sm">({stats.total})</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter manuellement
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
              <div className="text-yellow-400 text-xl font-bold">{stats.total}</div>
              <div className="text-gray-400 text-xs">Total</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center border border-yellow-500/20">
              <div className="text-yellow-400 text-xl font-bold">{stats.enAttente}</div>
              <div className="text-gray-400 text-xs">En attente</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center border border-green-500/20">
              <div className="text-green-400 text-xl font-bold">{stats.valides}</div>
              <div className="text-gray-400 text-xs">Validés</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par ID ou numéro..."
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
            </select>
            <button
              onClick={fetchPaiements}
              className="text-gray-400 hover:text-yellow-400 transition-colors p-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {error && <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">{error}</div>}
          {success && <div className="mt-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-2 rounded-lg">{success}</div>}
        </div>

        {filteredPaiements.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Aucune transaction trouvée</p>
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
                    <td className="px-4 py-3 text-yellow-400 text-sm font-medium">
                      {p.montant?.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm hidden md:table-cell">
                      {p.numero_depot || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(p.statut)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedPaiement(p); setShowDetailsModal(true) }}
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
      </div>

      {/* ===== MODAL AJOUT ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">Ajouter une transaction client</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
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

              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DÉTAILS ===== */}
      {showDetailsModal && selectedPaiement && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">Détails de la transaction</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
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
                <p className="text-yellow-400 font-bold">{selectedPaiement.montant?.toLocaleString()} FCFA</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Numéro de dépôt</p>
                <p className="text-white">{selectedPaiement.numero_depot || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Statut</p>
                <p>{getStatusBadge(selectedPaiement.statut)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Date de création</p>
                <p className="text-white">{formatDate(selectedPaiement.created_at)}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Fermer
              </button>
              {selectedPaiement.statut === 'en_attente' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedPaiement.id, 'valide')
                    setShowDetailsModal(false)
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                >
                  Valider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigPaiementOrganisateur
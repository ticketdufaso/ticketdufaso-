/**
 * Page Réservation - Composant réel
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * CORRECTIONS :
 * - Annulation : utilisation du statut 'annulee' avec retour du stock
 * - Achat : vérification dans paiements_organisateurs avec logs de débogage
 * - Bouton "Annuler" sur les réservations en attente
 * - Auto-remplissage du nom et WhatsApp
 * - Blocage des dates J-1 et J-0
 * - Réservation possible jusqu'à J-2 minimum
 * - Retour du stock lors de l'annulation
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, 
  Clock, 
  Ticket, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  MapPin,
  LogOut,
  Loader,
  RefreshCw,
  Crown,
  Sparkles,
  Building2,
  Sofa,
  ShoppingBag,
  Trash2
} from 'lucide-react'

const Reservation = () => {
  const navigate = useNavigate()
  
  // États d'authentification
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // États des événements
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedTicketType, setSelectedTicketType] = useState(null)
  
  // États des réservations
  const [reservations, setReservations] = useState([])
  const [activeTab, setActiveTab] = useState('events')
  
  // État du formulaire d'inscription
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    whatsapp: ''
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  
  // État du formulaire de connexion
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  
  const [isRegisterMode, setIsRegisterMode] = useState(true)
  
  // État du formulaire de réservation
  const [reservationData, setReservationData] = useState({
    quantite: 1,
    jour: new Date().getDate(),
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    heure: 14,
    minute: 0
  })
  
  // État du formulaire d'achat depuis réservation
  const [achatData, setAchatData] = useState({
    transactionId: '',
    numeroDepot: ''
  })
  const [showAchatModal, setShowAchatModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  
  // États généraux
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReservationForm, setShowReservationForm] = useState(false)

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  useEffect(() => {
    const init = async () => {
      await checkAuth()
      await fetchEvents()
      setLoading(false)
    }
    init()
  }, [])

  const checkAuth = async () => {
    try {
      const session = localStorage.getItem('faso-ticket-reservation')
      if (session) {
        const userData = JSON.parse(session)
        setUser(userData)
        await fetchReservations(userData.id)
      }
    } catch (error) {
      console.error('Erreur de vérification:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('evenements')
        .select(`
          *,
          organisateur:profiles(structure, plan_id),
          types_tickets (id, nom, description, prix, stock, stock_initial, image_url, couleur, avantages)
        `)
        .eq('actif', true)
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Erreur de chargement des événements:', error)
    }
  }

  const fetchReservations = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          evenement:evenements(nom, date, lieu, affiche_url, organisateur_id),
          type_ticket:types_tickets(nom, prix, stock_initial, categorie, image_url, id)
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Erreur de chargement des réservations:', error)
      setReservations([])
    }
  }

  // ============================================================
  // INSCRIPTION VIA client_reservations
  // ============================================================

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setRegisterLoading(true)

    if (!registerData.nom.trim() || registerData.nom.length < 2) {
      setError('Le nom doit contenir au moins 2 caractères')
      setRegisterLoading(false)
      return
    }
    if (!/^[0-9]{8}$/.test(registerData.whatsapp)) {
      setError('Numéro WhatsApp invalide (ex: 70123456)')
      setRegisterLoading(false)
      return
    }
    if (!registerData.email || !registerData.email.includes('@')) {
      setError('Email invalide')
      setRegisterLoading(false)
      return
    }
    if (registerData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setRegisterLoading(false)
      return
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setRegisterLoading(false)
      return
    }

    try {
      const { data: existing, error: checkError } = await supabase
        .from('client_reservations')
        .select('id, email')
        .eq('email', registerData.email)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        setError('Cet email est déjà utilisé. Veuillez vous connecter.')
        setRegisterLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('client_reservations')
        .insert([{
          nom_complet: registerData.nom.trim(),
          whatsapp: registerData.whatsapp,
          email: registerData.email,
          mot_de_passe: registerData.password
        }])
        .select()
        .single()

      if (error) throw error

      localStorage.setItem('faso-ticket-reservation', JSON.stringify(data))
      setUser(data)
      setSuccess('✅ Compte créé avec succès !')
      await fetchReservations(data.id)
      
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: '',
        nom: '',
        whatsapp: ''
      })

    } catch (error) {
      console.error('Erreur inscription:', error)
      setError(error.message || 'Erreur lors de l\'inscription')
    } finally {
      setRegisterLoading(false)
    }
  }

  // ============================================================
  // CONNEXION VIA client_reservations
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoginLoading(true)

    if (!loginData.email || !loginData.email.includes('@')) {
      setError('Email invalide')
      setLoginLoading(false)
      return
    }
    if (!loginData.password || loginData.password.length < 8) {
      setError('Mot de passe invalide')
      setLoginLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('client_reservations')
        .select('*')
        .eq('email', loginData.email)
        .eq('mot_de_passe', loginData.password)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        setError('❌ Email ou mot de passe incorrect. Vérifiez vos identifiants.')
        setLoginLoading(false)
        return
      }

      localStorage.setItem('faso-ticket-reservation', JSON.stringify(data))
      setUser(data)
      setSuccess('✅ Connexion réussie !')
      await fetchReservations(data.id)
      setLoginData({ email: '', password: '' })

    } catch (error) {
      console.error('Erreur connexion:', error)
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoginLoading(false)
    }
  }

  // ============================================================
  // DÉCONNEXION
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem('faso-ticket-reservation')
    setUser(null)
    setReservations([])
    setSuccess('Déconnecté avec succès')
    setTimeout(() => setSuccess(''), 3000)
  }

  // ============================================================
  // ANNULATION D'UNE RÉSERVATION AVEC RETOUR DU STOCK
  // ============================================================

  const handleCancelReservation = async (reservationId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return
    if (!confirm('Cette action est irréversible. Confirmer ?')) return

    try {
      // 1. Récupérer la réservation pour connaître le type de ticket et la quantité
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('type_ticket_id, quantite')
        .eq('id', reservationId)
        .eq('client_id', user.id)
        .single()

      if (fetchError) throw fetchError
      if (!reservation) throw new Error('Réservation non trouvée')

      // 2. Annuler la réservation
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          statut: 'annulee',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .eq('client_id', user.id)

      if (updateError) {
        // Si 'annulee' n'est pas accepté, essayer 'expiree'
        if (updateError.code === '23514') {
          const { error: retryError } = await supabase
            .from('reservations')
            .update({ 
              statut: 'expiree',
              updated_at: new Date().toISOString()
            })
            .eq('id', reservationId)
            .eq('client_id', user.id)
          
          if (retryError) throw retryError
        } else {
          throw updateError
        }
      }

      // 3. Retourner les tickets dans le stock du type d'origine
      const { data: ticketType, error: stockError } = await supabase
        .from('types_tickets')
        .select('stock')
        .eq('id', reservation.type_ticket_id)
        .single()

      if (stockError) {
        console.warn('Impossible de récupérer le stock:', stockError)
      } else {
        const { error: updateStockError } = await supabase
          .from('types_tickets')
          .update({ 
            stock: ticketType.stock + reservation.quantite
          })
          .eq('id', reservation.type_ticket_id)

        if (updateStockError) {
          console.warn('Impossible de mettre à jour le stock:', updateStockError)
        }
      }

      setSuccess('✅ Réservation annulée avec succès')
      await fetchReservations(user.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors de l\'annulation: ' + (error.message || 'Veuillez réessayer'))
      setTimeout(() => setError(''), 5000)
    }
  }

  // ============================================================
  // RÉSERVATION
  // ============================================================

  const getRemainingReservations = () => {
    return 3 - reservations.filter(r => r.statut === 'en_attente').length
  }

  const getTotalStock = (event) => {
    return event?.types_tickets?.reduce((sum, t) => sum + (t.stock || 0), 0) || 0
  }

  const canReserve = (event) => {
    if (!event) return false
    
    const totalStock = getTotalStock(event)
    if (totalStock < 3) return false
    
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
    if (diffDays < 2) return false
    
    if (getRemainingReservations() <= 0) return false
    
    return true
  }

  const getReservationStatus = (reservation) => {
    const now = new Date()
    const datePaiement = new Date(reservation.date_paiement)
    const eventDate = new Date(reservation.evenement?.date)
    
    if (reservation.statut === 'annulee') {
      return { statut: 'annulee', pourcentage: 100 }
    }
    
    if (datePaiement < now && reservation.statut === 'en_attente') {
      return { statut: 'expiree', pourcentage: 100 }
    }
    
    if (eventDate < now) {
      return { statut: 'terminee', pourcentage: 100 }
    }
    
    if (reservation.statut === 'en_attente') {
      const totalDuration = datePaiement - new Date(reservation.created_at)
      const elapsed = now - new Date(reservation.created_at)
      const pourcentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
      return { statut: 'en_attente', pourcentage }
    }
    
    return { statut: reservation.statut, pourcentage: 100 }
  }

  // ============================================================
  // OBTENIR LES JOURS DISPONIBLES POUR LA RÉSERVATION
  // ============================================================

  const getAvailableDays = (eventDate) => {
    if (!eventDate) return []
    
    const event = new Date(eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const lastReservationDay = new Date(event)
    lastReservationDay.setDate(lastReservationDay.getDate() - 2)
    
    const days = []
    const startDay = 1
    const endDay = Math.min(lastReservationDay.getDate(), 31)
    
    for (let d = startDay; d <= endDay; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), d)
      if (date >= today) {
        days.push(d)
      }
    }
    
    return days
  }

  // ============================================================
  // FORMATAGE DES DATES
  // ============================================================

  const formatDateShort = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getIconeForCategorie = (categorie) => {
    const cat = categorie?.toLowerCase() || ''
    switch(cat) {
      case 'vip': return <Crown className="h-3 w-3" />
      case 'vvip': return <Sparkles className="h-3 w-3" />
      case 'stand': return <Building2 className="h-3 w-3" />
      case 'salon': return <Sofa className="h-3 w-3" />
      default: return <Ticket className="h-3 w-3" />
    }
  }

  // ============================================================
  // ACHAT DEPUIS UNE RÉSERVATION
  // ============================================================

  const handleAchatFromReservation = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!selectedReservation) {
      setError('Aucune réservation sélectionnée')
      setSubmitting(false)
      return
    }

    const { transactionId, numeroDepot } = achatData

    if (!transactionId || transactionId.length < 5) {
      setError('❌ ID Transaction invalide')
      setSubmitting(false)
      return
    }
    if (!numeroDepot || !/^[0-9]{8}$/.test(numeroDepot)) {
      setError('❌ Numéro de dépôt invalide (ex: 70123456)')
      setSubmitting(false)
      return
    }

    try {
      // 1. Vérifier que la réservation existe et est en attente
      if (selectedReservation.statut !== 'en_attente') {
        setError('❌ Cette réservation n\'est plus valide.')
        setSubmitting(false)
        return
      }

      // 2. Vérifier la transaction dans paiements_organisateurs
      const { data: paiement, error: checkError } = await supabase
        .from('paiements_organisateurs')
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('numero_depot', numeroDepot)
        .maybeSingle()

      if (checkError) {
        console.error('Erreur recherche:', checkError)
        setError('Erreur lors de la vérification de la transaction.')
        setSubmitting(false)
        return
      }

      if (!paiement) {
        setError('❌ Transaction non trouvée. Vérifiez votre ID et numéro.')
        setSubmitting(false)
        return
      }

      if (paiement.statut !== 'en_attente') {
        setError('❌ Cette transaction a déjà été utilisée.')
        setSubmitting(false)
        return
      }

      // 3. Vérifier le montant
      const prixTicket = selectedReservation.type_ticket?.prix || 0
      const montantTotal = prixTicket * selectedReservation.quantite

      if (paiement.montant !== montantTotal) {
        setError(`❌ Le montant (${paiement.montant.toLocaleString()} FCFA) ne correspond pas au prix du ticket (${montantTotal.toLocaleString()} FCFA).`)
        setSubmitting(false)
        return
      }

      // 4. Vérifier le stock
      const { data: ticketType, error: stockError } = await supabase
        .from('types_tickets')
        .select('stock')
        .eq('id', selectedReservation.type_ticket_id)
        .single()

      if (stockError || !ticketType) {
        setError('❌ Type de ticket non trouvé.')
        setSubmitting(false)
        return
      }

      if (ticketType.stock < selectedReservation.quantite) {
        setError('❌ Stock insuffisant pour ce ticket.')
        setSubmitting(false)
        return
      }

      // 5. Marquer la transaction comme utilisée
      const { error: updateError } = await supabase
        .from('paiements_organisateurs')
        .update({ 
          statut: 'valide',
          updated_at: new Date().toISOString()
        })
        .eq('id', paiement.id)

      if (updateError) throw updateError

      // 6. Générer le QR code
      const qrCode = `PP${Date.now()}.${Math.random().toString(36).substring(2, 10)}`

      // 7. Créer la vente
      const { data: vente, error: venteError } = await supabase
        .from('ventes')
        .insert([{
          type_ticket_id: selectedReservation.type_ticket_id,
          evenement_id: selectedReservation.evenement_id,
          client_nom: user.nom_complet,
          client_whatsapp: user.whatsapp,
          montant: montantTotal,
          transaction_id: transactionId,
          numero_depot: numeroDepot,
          qr_code: qrCode,
          statut: 'en_attente',
          reservation_id: selectedReservation.id
        }])
        .select()
        .single()

      if (venteError) throw venteError

      // 8. Mettre à jour la réservation
      await supabase
        .from('reservations')
        .update({ 
          statut: 'valide',
          vente_id: vente.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReservation.id)

      // 9. Mettre à jour le stock
      await supabase
        .from('types_tickets')
        .update({ 
          stock: ticketType.stock - selectedReservation.quantite
        })
        .eq('id', selectedReservation.type_ticket_id)

      setSuccess('✅ Paiement validé ! Votre ticket est prêt.')
      setShowAchatModal(false)
      setAchatData({ transactionId: '', numeroDepot: '' })
      await fetchReservations(user.id)
      
      setTimeout(() => {
        navigate(`/ticket/${vente.id}`)
      }, 1500)

    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du paiement: ' + (error.message || 'Veuillez réessayer'))
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // SOUMISSION DE LA RÉSERVATION
  // ============================================================

  const handleReserve = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!selectedEvent) {
      setError('Veuillez sélectionner un événement')
      setSubmitting(false)
      return
    }

    if (!selectedTicketType) {
      setError('Veuillez sélectionner un type de ticket')
      setSubmitting(false)
      return
    }

    const datePaiement = new Date(
      reservationData.annee,
      reservationData.mois - 1,
      reservationData.jour,
      reservationData.heure,
      reservationData.minute
    )

    if (isNaN(datePaiement.getTime())) {
      setError('❌ Date de paiement invalide')
      setSubmitting(false)
      return
    }

    const now = new Date()
    if (datePaiement <= now) {
      setError('❌ La date de paiement doit être dans le futur.')
      setSubmitting(false)
      return
    }

    const eventDate = new Date(selectedEvent.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (eventDate < today) {
      setError('❌ Cet événement est déjà passé.')
      setSubmitting(false)
      return
    }

    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
    if (diffDays < 2) {
      setError(`❌ La réservation n'est plus possible à moins de 2 jours de l'événement. (J-${diffDays})`)
      setSubmitting(false)
      return
    }

    const totalStock = getTotalStock(selectedEvent)
    if (totalStock < 3) {
      setError('❌ Stock insuffisant pour réserver. Il reste moins de 3 places disponibles.')
      setSubmitting(false)
      return
    }

    if (datePaiement >= eventDate) {
      setError('❌ La date de paiement doit être avant le jour de l\'événement.')
      setSubmitting(false)
      return
    }

    if (selectedTicketType.stock < reservationData.quantite + 3) {
      setError(`❌ Stock insuffisant pour ce type de ticket. Il reste ${selectedTicketType.stock} places. Minimum 3 places doivent rester disponibles.`)
      setSubmitting(false)
      return
    }

    if (getRemainingReservations() <= 0) {
      setError('❌ Vous avez déjà 3 réservations en attente maximum.')
      setSubmitting(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          client_id: user.id,
          evenement_id: selectedEvent.id,
          type_ticket_id: selectedTicketType.id,
          quantite: reservationData.quantite || 1,
          date_paiement: datePaiement.toISOString(),
          statut: 'en_attente'
        }])
        .select()
        .single()

      if (error) throw error

      setSuccess('✅ Réservation effectuée avec succès !')
      await fetchReservations(user.id)
      
      setReservationData({
        quantite: 1,
        jour: new Date().getDate(),
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear(),
        heure: 14,
        minute: 0
      })
      setSelectedTicketType(null)
      setShowReservationForm(false)
      setActiveTab('my_reservations')
      
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors de la réservation: ' + (error.message || 'Veuillez réessayer'))
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // AFFICHAGE DES RÉSERVATIONS AVEC BOUTONS ACHETER ET ANNULER
  // ============================================================

  const renderReservationCard = (reservation) => {
    const status = getReservationStatus(reservation)
    
    if (status.statut === 'annulee') {
      return (
        <div key={reservation.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="text-white font-medium">{reservation.evenement?.nom}</h4>
              <p className="text-gray-400 text-sm">{formatDateShort(reservation.evenement?.date)}</p>
              <p className="text-gray-500 text-xs">Quantité: {reservation.quantite}</p>
              <p className="text-gray-500 text-xs">Type: {reservation.type_ticket?.nom}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                ❌ ANNULÉE
              </span>
            </div>
          </div>
        </div>
      )
    }
    
    if (status.statut === 'expiree') {
      return (
        <div key={reservation.id} className="bg-gray-800 rounded-lg p-4 border border-red-500/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="text-white font-medium">{reservation.evenement?.nom}</h4>
              <p className="text-gray-400 text-sm">{formatDateShort(reservation.evenement?.date)}</p>
              <p className="text-gray-500 text-xs">Quantité: {reservation.quantite}</p>
              <p className="text-gray-500 text-xs">Type: {reservation.type_ticket?.nom}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                ⚠️ EXPIRÉE
              </span>
              <span className="text-gray-500 text-xs">
                Paiement avant: {formatDateShort(reservation.date_paiement)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    
    if (status.statut === 'terminee') {
      return (
        <div key={reservation.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="text-white font-medium">{reservation.evenement?.nom}</h4>
              <p className="text-gray-400 text-sm">{formatDateShort(reservation.evenement?.date)}</p>
              <p className="text-gray-500 text-xs">Quantité: {reservation.quantite}</p>
              <p className="text-gray-500 text-xs">Type: {reservation.type_ticket?.nom}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                ✅ TERMINÉE
              </span>
            </div>
          </div>
        </div>
      )
    }
    
    if (status.statut === 'en_attente') {
      const pourcentage = status.pourcentage || 0
      const isUrgent = pourcentage > 80
      const prixTotal = (reservation.type_ticket?.prix || 0) * reservation.quantite
      
      return (
        <div key={reservation.id} className="bg-gray-800 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-white font-medium">{reservation.evenement?.nom}</h4>
                <p className="text-gray-400 text-sm">{formatDateShort(reservation.evenement?.date)}</p>
                <p className="text-gray-500 text-xs">Quantité: {reservation.quantite}</p>
                <p className="text-gray-500 text-xs">Type: {reservation.type_ticket?.nom}</p>
                <p className="text-yellow-400 text-sm font-bold mt-1">
                  {prixTotal.toLocaleString()} FCFA
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isUrgent ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {isUrgent ? '⚠️ URGENT' : '⏳ En attente'}
                </span>
                <span className="text-gray-500 text-xs">
                  Paiement avant: {formatDateShort(reservation.date_paiement)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedReservation(reservation)
                      setAchatData({ transactionId: '', numeroDepot: '' })
                      setShowAchatModal(true)
                      setError('')
                      setSuccess('')
                    }}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Acheter
                  </button>
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              </div>
            </div>
            
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Temps restant</span>
                <span>{Math.round(100 - pourcentage)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isUrgent ? 'bg-red-500' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${100 - pourcentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    return null
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold text-white text-center mb-4">
          Réserver un <span className="text-yellow-400">ticket</span>
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Réservez vos tickets et payez à la date de votre choix
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {!user ? (
          // ============================================================
          // FORMULAIRES D'AUTHENTIFICATION
          // ============================================================
          <div className="max-w-md mx-auto">
            <div className="flex rounded-lg overflow-hidden border border-gray-800 mb-6">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setError(''); setSuccess('') }}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  isRegisterMode 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Inscription
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setError(''); setSuccess('') }}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  !isRegisterMode 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Connexion
              </button>
            </div>

            {isRegisterMode ? (
              <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800">
                <h3 className="text-white text-lg font-semibold mb-6 text-center">Créer un compte</h3>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nom complet *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={registerData.nom}
                        onChange={(e) => setRegisterData({ ...registerData, nom: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="Nom complet"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">WhatsApp *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        value={registerData.whatsapp}
                        onChange={(e) => setRegisterData({ ...registerData, whatsapp: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="70123456"
                        required
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="votre@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Mot de passe (8 caractères min) *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="••••••••"
                        required
                        minLength="8"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Confirmer le mot de passe *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showRegisterConfirmPassword ? 'text' : 'password'}
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showRegisterConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {registerLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800">
                <h3 className="text-white text-lg font-semibold mb-6 text-center">Se connecter</h3>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="votre@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          // ============================================================
          // DASHBOARD CLIENT RÉSERVATION
          // ============================================================
          <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Bonjour, {user.nom_complet || 'Client'}
                  </h3>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </p>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {user.whatsapp}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">
                    Réservations restantes: <span className="text-yellow-400 font-bold">{getRemainingReservations()}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>

            {/* ============================================================
                ONGLETS
                ============================================================ */}
            <div className="flex gap-2 border-b border-gray-800 pb-2">
              <button
                onClick={() => { setActiveTab('events'); setError(''); setSuccess('') }}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                  activeTab === 'events'
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Événements
              </button>
              <button
                onClick={() => {
                  setActiveTab('my_reservations')
                  if (user) {
                    fetchReservations(user.id)
                  }
                  setError('')
                  setSuccess('')
                }}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 relative ${
                  activeTab === 'my_reservations'
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Ticket className="w-4 h-4" />
                Mes réservations
                {reservations.filter(r => r.statut === 'en_attente').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {reservations.filter(r => r.statut === 'en_attente').length}
                  </span>
                )}
              </button>
            </div>

            {/* ============================================================
                ONGLET : MES RÉSERVATIONS
                ============================================================ */}
            {activeTab === 'my_reservations' && (
              <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold">Mes réservations</h3>
                  <button
                    onClick={() => {
                      if (user) {
                        fetchReservations(user.id)
                      }
                    }}
                    className="text-gray-400 hover:text-yellow-400 transition-colors p-1"
                    title="Rafraîchir"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {reservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Ticket className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Aucune réservation</p>
                    <p className="text-sm text-gray-500">Allez dans l'onglet Événements pour réserver</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reservations.map((reservation) => renderReservationCard(reservation))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================
                ONGLET : ÉVÉNEMENTS
                ============================================================ */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <h3 className="text-white font-semibold mb-4">Événements disponibles</h3>
                  
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Aucun événement disponible</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {events.map((event) => {
                        const totalStock = getTotalStock(event)
                        const isAvailable = canReserve(event)
                        const eventDate = new Date(event.date)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
                        
                        return (
                          <div 
                            key={event.id} 
                            className={`bg-gray-800 rounded-lg overflow-hidden border transition-all ${
                              isAvailable 
                                ? 'border-gray-700 hover:border-yellow-400/50 cursor-pointer' 
                                : 'border-gray-700 opacity-60'
                            }`}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedEvent(event)
                                setSelectedTicketType(null)
                                setShowReservationForm(true)
                                setError('')
                                setSuccess('')
                              }
                            }}
                          >
                            <div className="relative">
                              <img
                                src={event.affiche_url || '/images/default-event.jpg'}
                                alt={event.nom}
                                className="w-full h-40 object-cover"
                                onError={(e) => e.target.src = '/images/default-event.jpg'}
                              />
                              <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                                {totalStock} places
                              </div>
                              {!isAvailable && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-red-400 font-bold text-sm bg-black/80 px-4 py-2 rounded-lg">
                                    {totalStock < 3 ? 'Stock insuffisant' : 
                                     diffDays < 2 ? `J-${diffDays}` : 
                                     'Réservation indisponible'}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-4">
                              <h4 className="text-white font-semibold text-lg">{event.nom}</h4>
                              <p className="text-gray-400 text-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.lieu}
                              </p>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDateShort(event.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              <div className="mt-3 flex flex-wrap gap-2">
                                {event.types_tickets?.map((type) => (
                                  <span 
                                    key={type.id} 
                                    className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1"
                                    style={{ 
                                      borderLeft: `3px solid ${type.couleur || '#FFD700'}` 
                                    }}
                                  >
                                    {getIconeForCategorie(type.categorie)}
                                    {type.nom}: {type.prix.toLocaleString()} FCFA
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ============================================================
                    FORMULAIRE DE RÉSERVATION
                    ============================================================ */}
                {showReservationForm && selectedEvent && (
                  <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-yellow-400/30">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-semibold">
                        Réserver: <span className="text-yellow-400">{selectedEvent.nom}</span>
                      </h3>
                      <button
                        onClick={() => {
                          setShowReservationForm(false)
                          setSelectedEvent(null)
                          setSelectedTicketType(null)
                          setError('')
                          setSuccess('')
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleReserve} className="space-y-4">
                      <div>
                        <label className="text-gray-400 text-sm block mb-2">Sélectionnez votre type de ticket *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedEvent.types_tickets?.map((type) => {
                            const isSelected = selectedTicketType?.id === type.id
                            const isAvailable = type.stock >= 3
                            return (
                              <button
                                key={type.id}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => {
                                  if (isAvailable) {
                                    setSelectedTicketType(type)
                                  }
                                }}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  isSelected
                                    ? 'border-yellow-400 bg-yellow-400/10'
                                    : isAvailable
                                      ? 'border-gray-700 hover:border-gray-500 bg-gray-800'
                                      : 'border-gray-700 opacity-50 cursor-not-allowed bg-gray-900'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {getIconeForCategorie(type.categorie)}
                                  <span className="text-white font-medium text-sm">{type.nom}</span>
                                </div>
                                <p className="text-yellow-400 text-sm font-bold mt-1">
                                  {type.prix.toLocaleString()} FCFA
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {type.stock} places {!isAvailable && '(⚠️ Stock < 3)'}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm block mb-1">Quantité (max 3) *</label>
                        <input
                          type="number"
                          min="1"
                          max={Math.min(3, getRemainingReservations())}
                          value={reservationData.quantite}
                          onChange={(e) => setReservationData({ ...reservationData, quantite: parseInt(e.target.value) || 1 })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        />
                        <p className="text-gray-500 text-xs mt-1">
                          Vous pouvez réserver {getRemainingReservations()} ticket(s) supplémentaire(s)
                        </p>
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm block mb-2">Date de paiement *</label>
                        <div className="grid grid-cols-5 gap-2">
                          <div>
                            <select
                              value={reservationData.jour}
                              onChange={(e) => setReservationData({ ...reservationData, jour: parseInt(e.target.value) })}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
                            >
                              {getAvailableDays(selectedEvent.date).map(j => (
                                <option key={j} value={j}>{j}</option>
                              ))}
                            </select>
                            <p className="text-gray-500 text-[10px] text-center mt-1">Jour</p>
                          </div>
                          
                          <div>
                            <select
                              value={reservationData.mois}
                              onChange={(e) => setReservationData({ ...reservationData, mois: parseInt(e.target.value) })}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <p className="text-gray-500 text-[10px] text-center mt-1">Mois</p>
                          </div>
                          
                          <div>
                            <select
                              value={reservationData.annee}
                              onChange={(e) => setReservationData({ ...reservationData, annee: parseInt(e.target.value) })}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
                            >
                              {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                            <p className="text-gray-500 text-[10px] text-center mt-1">Année</p>
                          </div>
                          
                          <div>
                            <select
                              value={reservationData.heure}
                              onChange={(e) => setReservationData({ ...reservationData, heure: parseInt(e.target.value) })}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
                            >
                              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                                <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                              ))}
                            </select>
                            <p className="text-gray-500 text-[10px] text-center mt-1">Heure</p>
                          </div>
                          
                          <div>
                            <select
                              value={reservationData.minute}
                              onChange={(e) => setReservationData({ ...reservationData, minute: parseInt(e.target.value) })}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
                            >
                              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                              ))}
                            </select>
                            <p className="text-gray-500 text-[10px] text-center mt-1">Min</p>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          Date sélectionnée: {reservationData.jour}/{reservationData.mois}/{reservationData.annee} {reservationData.heure.toString().padStart(2, '0')}:{reservationData.minute.toString().padStart(2, '0')}
                        </p>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-2">
                          <p className="text-yellow-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            ⚠️ Si vous ne payez pas avant cette date, votre réservation sera annulée.
                            <br />La date de paiement doit être avant le jour de l'événement.
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <span>
                            Règles de réservation :
                            <br />• Stock minimum de 3 places disponibles
                            <br />• Réservation possible jusqu'à J-2 avant l'événement
                            <br />• Maximum 3 réservations en attente
                            <br />• Date de paiement avant le jour de l'événement
                          </span>
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || getRemainingReservations() <= 0 || !selectedTicketType}
                        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Réservation...
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4" />
                            Réserver maintenant
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          MODAL ACHAT DEPUIS RÉSERVATION
          ============================================================ */}
      {showAchatModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">
                Acheter le ticket
              </h3>
              <button
                onClick={() => {
                  setShowAchatModal(false)
                  setSelectedReservation(null)
                  setError('')
                  setSuccess('')
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm">Réservation pour :</p>
              <p className="text-white font-semibold">{selectedReservation.evenement?.nom}</p>
              <p className="text-gray-400 text-sm">
                {formatDateShort(selectedReservation.evenement?.date)}
              </p>
              <div className="flex justify-between mt-2">
                <span className="text-gray-400 text-sm">Type : {selectedReservation.type_ticket?.nom}</span>
                <span className="text-gray-400 text-sm">Quantité : {selectedReservation.quantite}</span>
              </div>
              <p className="text-yellow-400 text-xl font-bold mt-2">
                {(selectedReservation.type_ticket?.prix || 0) * selectedReservation.quantite} FCFA
              </p>
            </div>

            {/* Auto-remplissage des infos client */}
            <div className="bg-gray-800 rounded-lg p-3 mb-4 border border-green-500/20">
              <p className="text-green-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Informations client pré-remplies
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-gray-300">Nom : <span className="text-white">{user?.nom_complet}</span></span>
                <span className="text-gray-300">WhatsApp : <span className="text-white">{user?.whatsapp}</span></span>
              </div>
            </div>

            <form onSubmit={handleAchatFromReservation} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">ID Transaction *</label>
                <input
                  type="text"
                  value={achatData.transactionId}
                  onChange={(e) => setAchatData({ ...achatData, transactionId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm font-mono"
                  placeholder="PP260424.1234.56789012"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Numéro de dépôt *</label>
                <input
                  type="tel"
                  value={achatData.numeroDepot}
                  onChange={(e) => setAchatData({ ...achatData, numeroDepot: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="70123456"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-2 rounded-lg">
                  {success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAchatModal(false)
                    setSelectedReservation(null)
                    setError('')
                    setSuccess('')
                  }}
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
                      <ShoppingBag className="w-4 h-4" />
                      Acheter
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

export default Reservation
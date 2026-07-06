/**
 * Dashboard Admin - Version complète et corrigée
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * CORRECTIONS :
 * - Bouton "Réactiver" présent pour les comptes expirés
 * - Gestion complète des utilisateurs
 * - Onglet Messagerie ajouté
 * - Toutes les fonctionnalités admin
 * - Champ "Nom complet" pour les admins (stocké dans structure)
 * - Notifications de messagerie (+1) visibles partout
 * - Gestion des conflits pour les achats
 * - Rechargement correct après suppression/création d'utilisateur
 * - Règles Super Admin strictes
 * - Le Super Admin par défaut ne peut être supprimé par personne
 * - Seul le Super Admin peut nommer un autre Super Admin
 * - Un admin simple ne peut pas supprimer un Super Admin
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../context/AuthContext'
import { 
  Users, Calendar, Ticket, Crown, BarChart3, AlertTriangle,
  Eye, EyeOff, UserPlus, RefreshCw, Search,
  CheckCircle, XCircle, Loader, Mail, Building, Phone, 
  Smartphone, User, Lock, Key, MessageSquare, DollarSign,
  Settings, FileText, CreditCard, Shield, Clock, Edit2,
  Trash2, Zap, Filter, PlusCircle, ArrowLeft,
  LogOut, Save, Calendar as CalendarIcon, Award, TrendingUp,
  Download, Send, Star, ShoppingBag, BarChart4, FileSpreadsheet
} from 'lucide-react'

// Import des sous-composants admin
import AvisAdmin from './AvisAdmin'
import PaiementsAdmin from './PaiementsAdmin'
import ConfigGatewayAdmin from './ConfigGatewayAdmin'
import FormatIdAdmin from './FormatIdAdmin'
import PlansAdmin from './PlansAdmin'
import TextesLegauxAdmin from './TextesLegauxAdmin'
import MessagerieAdmin from './MessagerieAdmin'

const DashboardAdmin = () => {
  const { user } = useAuthContext()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganisateurs: 0,
    totalEvenements: 0,
    totalAgents: 0,
    totalPlansVendus: 0,
    totalRevenus: 0,
    totalExpires: 0,
    totalAvis: 0,
    totalAvisEnAttente: 0,
    totalPaiements: 0
  })
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('tous')
  const [planFilter, setPlanFilter] = useState('tous')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [adminName, setAdminName] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [isDefaultSuperAdmin, setIsDefaultSuperAdmin] = useState(false)
  
  // Modals
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [showExtendPlan, setShowExtendPlan] = useState(false)
  const [showReactivate, setShowReactivate] = useState(false)
  const [showSuperAdmin, setShowSuperAdmin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileStep, setProfileStep] = useState('email')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [extendDays, setExtendDays] = useState(30)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [profileData, setProfileData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Formulaire pour ajout/modification utilisateur
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'organisateur',
    plan: '',
    structure: '',
    telephone: '',
    phoneOm: '',
    nomAssocie: '',
    nomComplet: '',
    typeCompte: 'courant',
    formatUssd: 'format_10',
    codeMarchand: '',
    password: '',
    confirmPassword: '',
    userId: null
  })

  const extendOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30, 60, 90, 120, 365]

  const DEFAULT_SUPER_ADMIN_EMAIL = 'fasoticket.burkindi@gmail.com'

  const getServiceKey = () => {
    const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    if (key) return key
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzd3ppZ3FrcXFubHd2Z3V2cmdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjUwNzg0MCwiZXhwIjoyMDk4MDgzODQwfQ.bm4kwE2co0Tmmp_Q1a0TUyoI6BlztMsEj3jMzmPG9AY'
  }

  // ============================================================
  // CHARGEMENT COMPLET
  // ============================================================

  useEffect(() => {
    if (user) {
      loadAllData()
      fetchUnreadMessagesCount()
      checkIfDefaultSuperAdmin()
    }
    
    const handleAvisUpdate = (event) => {
      setStats(prev => ({
        ...prev,
        totalAvisEnAttente: event.detail.pending
      }))
    }

    const messagesSubscription = supabase
      .channel('admin_messages_notification')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadMessagesCount()
        }
      )
      .subscribe()

    window.addEventListener('avisUpdate', handleAvisUpdate)
    
    return () => {
      window.removeEventListener('avisUpdate', handleAvisUpdate)
      messagesSubscription.unsubscribe()
    }
  }, [user])

  const checkIfDefaultSuperAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === DEFAULT_SUPER_ADMIN_EMAIL) {
        setIsDefaultSuperAdmin(true)
        await supabase
          .from('profiles')
          .update({ is_super_admin: true })
          .eq('email', DEFAULT_SUPER_ADMIN_EMAIL)
      }
    } catch (error) {
      console.error('Erreur vérification default super admin:', error)
    }
  }

  // ============================================================
  // NOTIFICATIONS DE MESSAGERIE
  // ============================================================

  const fetchUnreadMessagesCount = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('is_deleted', false)
        .eq('lu', false)
        .neq('admin_id', user.id)
        .neq('sender', 'admin')

      if (error) throw error
      const count = data?.length || 0
      setUnreadMessagesCount(count)
      
      if (count > 0) {
        document.title = `📩 (${count}) FASO TICKET`
      } else {
        document.title = 'FASO TICKET - Billetterie sécurisée'
      }
    } catch (error) {
      console.error('Erreur comptage messages:', error)
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError('')
      
      await fetchPlans()
      await fetchUsers()
      await fetchEvents()
      await fetchStats()
      await fetchAdminName()
      await checkSuperAdmin()
      
    } catch (error) {
      console.error('Erreur chargement:', error)
      setError('Erreur lors du chargement des données. Veuillez rafraîchir.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      setPlansLoading(true)
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('actif', true)
        .order('ordre', { ascending: true })

      if (error) throw error
      
      if (data && data.length > 0) {
        setPlans(data)
        setNewUser(prev => ({ ...prev, plan: data[0].nom }))
        setSelectedPlan(data[0].nom)
      } else {
        await createDefaultPlans()
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error)
      setError('Erreur lors du chargement des plans')
    } finally {
      setPlansLoading(false)
    }
  }

  const createDefaultPlans = async () => {
    try {
      const defaultPlans = [
        {
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
        {
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
      ]

      const { data, error } = await supabase
        .from('plans')
        .insert(defaultPlans)
        .select()

      if (error) throw error
      
      if (data && data.length > 0) {
        setPlans(data)
        setNewUser(prev => ({ ...prev, plan: data[0].nom }))
        setSelectedPlan(data[0].nom)
      }
    } catch (error) {
      console.error('Erreur création plans:', error)
      setError('Erreur lors de la création des plans par défaut')
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erreur fetchUsers:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('evenements')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Erreur fetchEvents:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: organisateursCount },
        { count: eventsCount },
        { count: agentsCount },
        { count: plansCount },
        { count: avisCount },
        { count: avisEnAttente },
        { count: paiementsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'organisateur'),
        supabase.from('evenements').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
        supabase.from('paiements_plans').select('*', { count: 'exact', head: true }).eq('statut', 'valide'),
        supabase.from('commentaires').select('*', { count: 'exact', head: true }),
        supabase.from('commentaires').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
        supabase.from('paiements_plans').select('*', { count: 'exact', head: true })
      ])

      const { data: paiements } = await supabase
        .from('paiements_plans')
        .select('montant')
        .eq('statut', 'valide')

      const totalRevenus = paiements?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0

      const now = new Date()
      const expires = users.filter(p => 
        p.plan_expire && new Date(p.plan_expire) < now && p.statut === true
      ) || []

      setStats({
        totalUsers: usersCount || 0,
        totalOrganisateurs: organisateursCount || 0,
        totalEvenements: eventsCount || 0,
        totalAgents: agentsCount || 0,
        totalPlansVendus: plansCount || 0,
        totalRevenus: totalRevenus,
        totalExpires: expires.length,
        totalAvis: avisCount || 0,
        totalAvisEnAttente: avisEnAttente || 0,
        totalPaiements: paiementsCount || 0
      })
    } catch (error) {
      console.error('Erreur fetchStats:', error)
    }
  }

  const fetchAdminName = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('structure, nom_associe')
        .eq('id', user.id)
        .single()
      
      if (!error && data) {
        setAdminName(data.nom_associe || data.structure || 'Administrateur')
      }
    } catch (error) {
      console.error('Erreur fetchAdminName:', error)
    }
  }

  const checkSuperAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()
      
      if (!error && data) {
        setIsSuperAdmin(data.is_super_admin || false)
      }
    } catch (error) {
      console.error('Erreur checkSuperAdmin:', error)
    }
  }

  // ============================================================
  // VÉRIFICATION DES PERMISSIONS SUPER ADMIN
  // ============================================================

  const canDeleteAdmin = (targetUser) => {
    if (targetUser.email === DEFAULT_SUPER_ADMIN_EMAIL) return false
    if (!isSuperAdmin) return false
    if (targetUser.is_super_admin && targetUser.id !== user.id) return false
    if (targetUser.id === user.id) return false
    return true
  }

  const canMakeSuperAdmin = (targetUser) => {
    if (!isSuperAdmin) return false
    if (targetUser.email === DEFAULT_SUPER_ADMIN_EMAIL) return false
    if (targetUser.is_super_admin) return false
    return true
  }

  const canRemoveSuperAdmin = (targetUser) => {
    if (!isSuperAdmin) return false
    if (targetUser.email === DEFAULT_SUPER_ADMIN_EMAIL) return false
    if (targetUser.id === user.id) return false
    if (!targetUser.is_super_admin) return false
    return true
  }

  // ============================================================
  // GESTION DES UTILISATEURS
  // ============================================================

  const updatePlanBenefits = async (userId, planNom) => {
    try {
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('nom', planNom)
        .single()

      if (planError) throw planError

      const updateData = {
        plan_id: planData.nom,
        plan_expire: new Date(Date.now() + planData.duree_jours * 24 * 60 * 60 * 1000).toISOString(),
        statut: true,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      return true
    } catch (error) {
      console.error('Erreur mise à jour avantages:', error)
      return false
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!newUser.email || !newUser.email.includes('@')) {
      setError('Email invalide')
      setSubmitting(false)
      return
    }
    if (newUser.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setSubmitting(false)
      return
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setSubmitting(false)
      return
    }

    if (newUser.role === 'admin') {
      if (!newUser.nomComplet || newUser.nomComplet.length < 2) {
        setError('Nom complet requis pour l\'administrateur')
        setSubmitting(false)
        return
      }
    }

    if (newUser.role === 'organisateur') {
      if (!newUser.structure || newUser.structure.length < 2) {
        setError('Nom de structure invalide')
        setSubmitting(false)
        return
      }
      if (!newUser.telephone || !/^[0-9]{8}$/.test(newUser.telephone)) {
        setError('Téléphone invalide (ex: 70123456)')
        setSubmitting(false)
        return
      }
      if (!newUser.phoneOm || !/^[0-9]{8}$/.test(newUser.phoneOm)) {
        setError('Numéro Orange Money invalide')
        setSubmitting(false)
        return
      }
      if (!newUser.nomAssocie || newUser.nomAssocie.length < 2) {
        setError('Nom associé requis')
        setSubmitting(false)
        return
      }
      if (!newUser.plan) {
        setError('Veuillez sélectionner un plan')
        setSubmitting(false)
        return
      }
    }

    try {
      let userId = null

      const { data: existingUser, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUser.email)
        .maybeSingle()

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError
      }

      if (existingUser) {
        userId = existingUser.id
      } else {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const serviceKey = getServiceKey()

        const userData = {
          email: newUser.email,
          password: newUser.password,
          email_confirm: true,
          user_metadata: {
            role: newUser.role
          }
        }

        if (newUser.role === 'organisateur') {
          userData.user_metadata.structure = newUser.structure
          userData.user_metadata.telephone = newUser.telephone
          userData.user_metadata.phone_om = newUser.phoneOm
          userData.user_metadata.nom_associe = newUser.nomAssocie
          userData.user_metadata.type_compte = newUser.typeCompte
          userData.user_metadata.format_ussd = newUser.formatUssd
          userData.user_metadata.code_marchand = newUser.formatUssd === 'format_3' ? newUser.codeMarchand : null
          userData.user_metadata.numero_paiement = newUser.formatUssd !== 'format_3' ? newUser.phoneOm : null
          userData.user_metadata.nom_associe_paiement = newUser.nomAssocie
          userData.user_metadata.plan_id = newUser.plan
        } else if (newUser.role === 'admin') {
          userData.user_metadata.nom_complet = newUser.nomComplet
          userData.user_metadata.structure = newUser.nomComplet
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
        userId = authData.id
      }

      const selectedPlanData = newUser.role === 'organisateur' 
        ? plans.find(p => p.nom === newUser.plan) 
        : null
      
      const expireDate = selectedPlanData
        ? new Date(Date.now() + selectedPlanData.duree_jours * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      const profileData = {
        id: userId,
        email: newUser.email,
        role: newUser.role,
        statut: true,
        updated_at: new Date().toISOString()
      }

      if (newUser.role === 'organisateur') {
        profileData.structure = newUser.structure
        profileData.telephone = newUser.telephone
        profileData.phone_om = newUser.phoneOm
        profileData.nom_associe = newUser.nomAssocie
        profileData.type_compte = newUser.typeCompte
        profileData.format_ussd = newUser.formatUssd
        profileData.code_marchand = newUser.formatUssd === 'format_3' ? newUser.codeMarchand : null
        profileData.numero_paiement = newUser.formatUssd !== 'format_3' ? newUser.phoneOm : null
        profileData.nom_associe_paiement = newUser.nomAssocie
        profileData.plan_id = newUser.plan
        profileData.plan_expire = expireDate.toISOString()
        profileData.prix_plan = selectedPlanData?.prix || 0
        profileData.cree_par_admin = true
      } else if (newUser.role === 'admin') {
        profileData.structure = newUser.nomComplet
        profileData.nom_associe = newUser.nomComplet
        profileData.plan_id = null
        profileData.plan_expire = null
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })

      if (profileError) throw profileError

      setSuccess(`${newUser.role === 'admin' ? 'Administrateur' : 'Organisateur'} créé avec succès !`)
      setShowAddUser(false)
      resetUserForm()
      await loadAllData()
      await fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.message || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // SUPPRESSION D'UTILISATEUR AVEC SUPPRESSION EN CASCADE
  // ============================================================

  const handleDeleteUser = async (userId) => {
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser) {
      setError('Utilisateur non trouvé')
      return
    }

    // Règles de suppression
    if (targetUser.role === 'admin') {
      if (targetUser.email === DEFAULT_SUPER_ADMIN_EMAIL) {
        setError('❌ Le Super Admin par défaut ne peut pas être supprimé.')
        setTimeout(() => setError(''), 3000)
        return
      }
      
      if (!isSuperAdmin) {
        setError('❌ Vous devez être Super Admin pour supprimer un administrateur.')
        setTimeout(() => setError(''), 3000)
        return
      }
      
      if (targetUser.is_super_admin) {
        setError('❌ Vous ne pouvez pas supprimer un autre Super Admin.')
        setTimeout(() => setError(''), 3000)
        return
      }
      
      if (targetUser.id === user.id) {
        setError('❌ Vous ne pouvez pas vous supprimer vous-même.')
        setTimeout(() => setError(''), 3000)
        return
      }
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${targetUser.email} ?`)) return
    if (!confirm('Cette action est irréversible. Toutes les données associées seront supprimées.')) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      console.log('🔍 Début suppression utilisateur:', userId, targetUser.email)

      // ============================================================
      // 1. SUPPRIMER LES DONNÉES ASSOCIÉES (POUR ORGANISATEUR)
      // ============================================================
      
      if (targetUser.role === 'organisateur') {
        // 1.1 Récupérer les événements de l'organisateur
        const { data: events, error: eventsError } = await supabase
          .from('evenements')
          .select('id')
          .eq('organisateur_id', userId)

        if (eventsError) {
          console.error('❌ Erreur récupération événements:', eventsError)
        }

        if (events && events.length > 0) {
          const eventIds = events.map(e => e.id)
          console.log(`📊 ${eventIds.length} événements trouvés pour l'organisateur`)

          // 1.2 Récupérer les types de tickets de ces événements
          const { data: ticketTypes, error: ticketError } = await supabase
            .from('types_tickets')
            .select('id')
            .in('evenement_id', eventIds)

          if (ticketError) {
            console.error('❌ Erreur récupération types tickets:', ticketError)
          }

          if (ticketTypes && ticketTypes.length > 0) {
            const ticketIds = ticketTypes.map(t => t.id)
            console.log(`📊 ${ticketIds.length} types de tickets trouvés`)

            // 1.3 Supprimer les ventes associées aux types de tickets
            const { error: deleteVentesError } = await supabase
              .from('ventes')
              .delete()
              .in('type_ticket_id', ticketIds)

            if (deleteVentesError) {
              console.error('❌ Erreur suppression ventes:', deleteVentesError)
            } else {
              console.log('✅ Ventes supprimées')
            }

            // 1.4 Supprimer les réservations associées aux types de tickets
            const { error: deleteReservationsError } = await supabase
              .from('reservations')
              .delete()
              .in('type_ticket_id', ticketIds)

            if (deleteReservationsError) {
              console.error('❌ Erreur suppression réservations:', deleteReservationsError)
            } else {
              console.log('✅ Réservations supprimées')
            }

            // 1.5 Supprimer les types de tickets
            const { error: deleteTypesError } = await supabase
              .from('types_tickets')
              .delete()
              .in('id', ticketIds)

            if (deleteTypesError) {
              console.error('❌ Erreur suppression types tickets:', deleteTypesError)
            } else {
              console.log('✅ Types de tickets supprimés')
            }
          }

          // 1.6 Supprimer les événements
          const { error: deleteEventsError } = await supabase
            .from('evenements')
            .delete()
            .in('id', eventIds)

          if (deleteEventsError) {
            console.error('❌ Erreur suppression événements:', deleteEventsError)
          } else {
            console.log('✅ Événements supprimés')
          }
        }

        // 1.7 Supprimer les codes promo de l'organisateur
        const { error: deleteCodesError } = await supabase
          .from('codes_promo')
          .delete()
          .eq('organisateur_id', userId)

        if (deleteCodesError) {
          console.error('❌ Erreur suppression codes promo:', deleteCodesError)
        } else {
          console.log('✅ Codes promo supprimés')
        }

        // 1.8 Supprimer les paiements organisateurs
        const { error: deletePaiementsError } = await supabase
          .from('paiements_organisateurs')
          .delete()
          .eq('organisateur_id', userId)

        if (deletePaiementsError) {
          console.error('❌ Erreur suppression paiements organisateurs:', deletePaiementsError)
        } else {
          console.log('✅ Paiements organisateurs supprimés')
        }

        // 1.9 Supprimer les agents créés par l'organisateur
        const { error: deleteAgentsError } = await supabase
          .from('profiles')
          .delete()
          .eq('created_by', userId)
          .eq('role', 'agent')

        if (deleteAgentsError) {
          console.error('❌ Erreur suppression agents:', deleteAgentsError)
        } else {
          console.log('✅ Agents supprimés')
        }
      }

      // ============================================================
      // 2. SUPPRIMER LE PROFIL UTILISATEUR
      // ============================================================
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('❌ Erreur suppression profil:', profileError)
        throw profileError
      }
      console.log('✅ Profil supprimé')

      // ============================================================
      // 3. SUPPRIMER L'UTILISATEUR DANS AUTH
      // ============================================================

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const serviceKey = getServiceKey()

      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn('⚠️ Erreur suppression auth.users:', errorText)
        // Ne pas bloquer si l'utilisateur n'existe pas dans auth
      } else {
        console.log('✅ Utilisateur supprimé de Auth')
      }

      setSuccess(`✅ ${targetUser.role === 'admin' ? 'Administrateur' : 'Organisateur'} supprimé avec succès`)
      
      // Recharger COMPLETEMENT les données après suppression
      await loadAllData()
      await fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('❌ Erreur globale suppression:', error)
      
      // Vérifier si c'est une erreur de clé étrangère
      if (error.message?.includes('foreign key') || error.code === '23503') {
        setError('❌ Impossible de supprimer : cet utilisateur a des données associées. Veuillez contacter l\'administrateur.')
      } else {
        setError('Erreur lors de la suppression: ' + (error.message || 'Veuillez réessayer'))
      }
      setTimeout(() => setError(''), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // AJOUT/RETRAIT SUPER ADMIN
  // ============================================================

  const handleAddSuperAdmin = async () => {
    if (!selectedUserId) return

    const targetUser = users.find(u => u.id === selectedUserId)
    if (!targetUser) {
      setError('Utilisateur non trouvé')
      return
    }

    if (targetUser.email === DEFAULT_SUPER_ADMIN_EMAIL) {
      setError('❌ Le Super Admin par défaut est déjà Super Admin.')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (targetUser.is_super_admin) {
      setError('❌ Cet utilisateur est déjà Super Admin.')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (!isSuperAdmin) {
      setError('❌ Vous devez être Super Admin pour nommer un Super Admin.')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: true })
        .eq('id', selectedUserId)

      if (error) throw error

      setSuccess('✅ Super Admin ajouté avec succès')
      setShowSuperAdmin(false)
      await loadAllData()
      await fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de l\'ajout Super Admin')
    }
  }

  // ============================================================
  // RETIRER SUPER ADMIN
  // ============================================================

  const handleRemoveSuperAdmin = async (targetUserId) => {
    const targetUser = users.find(u => u.id === targetUserId)
    if (!targetUser) return

    if (!canRemoveSuperAdmin(targetUser)) {
      setError('❌ Vous ne pouvez pas retirer ce Super Admin.')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (!confirm(`Retirer les privilèges Super Admin de ${targetUser.email} ?`)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: false })
        .eq('id', targetUserId)

      if (error) throw error

      setSuccess('✅ Privilèges Super Admin retirés avec succès')
      await loadAllData()
      await fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors du retrait des privilèges')
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!newUser.structure || newUser.structure.length < 2) {
      setError('Nom de structure invalide')
      setSubmitting(false)
      return
    }
    if (!newUser.telephone || !/^[0-9]{8}$/.test(newUser.telephone)) {
      setError('Téléphone invalide (ex: 70123456)')
      setSubmitting(false)
      return
    }
    if (!newUser.phoneOm || !/^[0-9]{8}$/.test(newUser.phoneOm)) {
      setError('Numéro Orange Money invalide')
      setSubmitting(false)
      return
    }
    if (!newUser.nomAssocie || newUser.nomAssocie.length < 2) {
      setError('Nom associé requis')
      setSubmitting(false)
      return
    }

    try {
      const updateData = {
        structure: newUser.structure,
        telephone: newUser.telephone,
        phone_om: newUser.phoneOm,
        nom_associe: newUser.nomAssocie,
        type_compte: newUser.typeCompte,
        format_ussd: newUser.formatUssd,
        code_marchand: newUser.formatUssd === 'format_3' ? newUser.codeMarchand : null,
        numero_paiement: newUser.formatUssd !== 'format_3' ? newUser.phoneOm : null,
        nom_associe_paiement: newUser.nomAssocie,
        updated_at: new Date().toISOString()
      }

      if (newUser.plan) {
        updateData.plan_id = newUser.plan
        const selectedPlanData = plans.find(p => p.nom === newUser.plan)
        if (selectedPlanData) {
          updateData.plan_expire = new Date(Date.now() + selectedPlanData.duree_jours * 24 * 60 * 60 * 1000).toISOString()
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', newUser.userId)

      if (updateError) throw updateError

      setSuccess('Organisateur modifié avec succès !')
      setShowEditUser(false)
      resetUserForm()
      await loadAllData()
      await fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.message || 'Erreur lors de la modification')
    } finally {
      setSubmitting(false)
    }
  }

  const resetUserForm = () => {
    setNewUser({
      email: '',
      role: 'organisateur',
      plan: plans.length > 0 ? plans[0].nom : '',
      structure: '',
      telephone: '',
      phoneOm: '',
      nomAssocie: '',
      nomComplet: '',
      typeCompte: 'courant',
      formatUssd: 'format_10',
      codeMarchand: '',
      password: '',
      confirmPassword: '',
      userId: null
    })
  }

  const openEditUser = (userItem) => {
    setNewUser({
      email: userItem.email,
      role: userItem.role,
      plan: userItem.plan_id || (plans.length > 0 ? plans[0].nom : ''),
      structure: userItem.structure || '',
      telephone: userItem.telephone || '',
      phoneOm: userItem.phone_om || '',
      nomAssocie: userItem.nom_associe || '',
      nomComplet: userItem.nom_complet || userItem.structure || '',
      typeCompte: userItem.type_compte || 'courant',
      formatUssd: userItem.format_ussd || 'format_10',
      codeMarchand: userItem.code_marchand || '',
      password: '',
      confirmPassword: '',
      userId: userItem.id
    })
    setShowEditUser(true)
  }

  const handleChangePlan = async () => {
    if (!selectedUserId || !selectedPlan) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const success = await updatePlanBenefits(selectedUserId, selectedPlan)
      
      if (success) {
        setSuccess('Plan changé avec succès !')
        setShowChangePlan(false)
        await loadAllData()
        await fetchUsers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Erreur lors du changement de plan')
      }
    } catch (error) {
      setError('Erreur lors du changement de plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExtendPlan = async () => {
    if (!selectedUserId || !extendDays) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('plan_expire, plan_id')
        .eq('id', selectedUserId)
        .single()

      const currentExpire = userData?.plan_expire ? new Date(userData.plan_expire) : new Date()
      const newExpire = new Date(currentExpire.getTime() + extendDays * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('profiles')
        .update({
          plan_expire: newExpire.toISOString(),
          statut: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUserId)

      if (error) throw error

      setSuccess(`Plan prolongé de ${extendDays} jours avec succès !`)
      setShowExtendPlan(false)
      await loadAllData()
      await fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la prolongation')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // RÉACTIVATION DU COMPTE
  // ============================================================
  const handleReactivate = async () => {
    if (!selectedUserId || !selectedPlan) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const success = await updatePlanBenefits(selectedUserId, selectedPlan)
      
      if (success) {
        setSuccess('Compte réactivé avec succès !')
        setShowReactivate(false)
        await loadAllData()
        await fetchUsers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Erreur lors de la réactivation')
      }
    } catch (error) {
      setError('Erreur lors de la réactivation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyEmail = async () => {
    setProfileError('')
    setProfileSuccess('')
    setSubmitting(true)

    if (!profileData.email || !profileData.email.includes('@')) {
      setProfileError('Email invalide')
      setSubmitting(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', profileData.email)
        .in('role', ['admin'])
        .single()

      if (error || !data) {
        setProfileError('Email non trouvé ou vous n\'avez pas les droits administrateur')
        setSubmitting(false)
        return
      }

      setProfileSuccess('Email validé ! Veuillez entrer votre nouveau mot de passe.')
      setProfileStep('password')
    } catch (error) {
      setProfileError('Erreur lors de la vérification')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    setProfileError('')
    setProfileSuccess('')

    if (profileData.newPassword.length < 8) {
      setProfileError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (profileData.newPassword !== profileData.confirmPassword) {
      setProfileError('Les mots de passe ne correspondent pas')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: profileData.newPassword
      })

      if (error) throw error

      setProfileSuccess('Mot de passe changé avec succès !')
      setShowProfile(false)
      setProfileData({ email: '', newPassword: '', confirmPassword: '' })
      setProfileStep('email')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (error) {
      setProfileError('Erreur lors du changement de mot de passe')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Non défini'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const formatDateTime = () => {
    const now = new Date()
    return now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getStatusBadge = (userItem) => {
    if (!userItem.statut) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Inactif</span>
    }
    if (userItem.plan_expire && new Date(userItem.plan_expire) < new Date()) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Expiré</span>
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Actif</span>
  }

  const getUssdFormat = (userItem) => {
    if (!userItem) return ''
    if (userItem.type_compte === 'commercial') {
      if (userItem.format_ussd === 'format_3' && userItem.code_marchand) {
        return `*144*3*${userItem.code_marchand}*montant#`
      } else if (userItem.format_ussd === 'format_10' && userItem.phone_om) {
        return `*144*10*${userItem.phone_om}*montant#`
      }
    } else if (userItem.type_compte === 'courant' && userItem.phone_om) {
      return `*144*2*1*${userItem.phone_om}*montant#`
    }
    return 'Non configuré'
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.structure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.telephone?.includes(searchTerm)
    const matchRole = roleFilter === 'tous' || u.role === roleFilter
    const matchPlan = planFilter === 'tous' || u.plan_id === planFilter
    const matchStatus = statusFilter === 'tous' || 
                       (statusFilter === 'actif' && u.statut === true) ||
                       (statusFilter === 'inactif' && u.statut === false) ||
                       (statusFilter === 'expire' && u.plan_expire && new Date(u.plan_expire) < new Date())
    return matchSearch && matchRole && matchPlan && matchStatus
  })

  const activeEvents = events.filter(e => new Date(e.date) > new Date())
  const expiredEvents = events.filter(e => new Date(e.date) < new Date())

  // ============================================================
  // ONGLETS - AVEC NOTIFICATION +1
  // ============================================================
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'avis', label: 'Avis', icon: <MessageSquare className="w-4 h-4" />, badge: stats.totalAvisEnAttente > 0 ? stats.totalAvisEnAttente : null },
    { id: 'paiements', label: 'Paiements', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'gateway', label: 'Config Gateway', icon: <Settings className="w-4 h-4" /> },
    { id: 'formats', label: 'Format ID', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'plans', label: 'Plans', icon: <Crown className="w-4 h-4" /> },
    { id: 'textes', label: 'Textes légaux', icon: <FileText className="w-4 h-4" /> },
    { id: 'messagerie', label: 'Messagerie', icon: <MessageSquare className="w-4 h-4" />, badge: unreadMessagesCount > 0 ? unreadMessagesCount : null }
  ]

  // ============================================================
  // RENDU
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
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Dashboard <span className="text-yellow-400">Administrateur</span>
            </h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-400 text-sm mt-1">
              <span>{formatDateTime()}</span>
              {adminName && (
                <>
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <span className="text-yellow-400 font-medium">👤 {adminName}</span>
                  {isSuperAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Super Admin</span>
                  )}
                </>
              )}
              {unreadMessagesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse ml-2">
                  📩 {unreadMessagesCount} nouveau(x) message(s)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stats.totalExpires > 0 && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{stats.totalExpires} organisateur(s) expiré(s)</span>
              </div>
            )}
            <button
              onClick={loadAllData}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </button>
            <button
              onClick={() => { setShowProfile(true); setProfileStep('email'); setProfileData({ email: '', newPassword: '', confirmPassword: '' }) }}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <User className="w-4 h-4" />
              Mon profil
            </button>
            <button
              onClick={() => {
                if (plans.length === 0 && !plansLoading) {
                  fetchPlans()
                }
                setShowAddUser(true)
              }}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Nouvel utilisateur
            </button>
          </div>
        </div>

        {/* ===== ONGLETS ===== */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'messagerie') {
                  fetchUnreadMessagesCount()
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium relative ${
                activeTab === tab.id
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                  tab.id === 'messagerie' ? 'bg-red-500 animate-pulse' : 'bg-red-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== CONTENU DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 md:gap-4 mb-8">
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalUsers}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Utilisateurs</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalOrganisateurs}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Organisateurs</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalEvenements}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Événements</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalAgents}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Agents</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalPlansVendus}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Plans vendus</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalRevenus.toLocaleString()} FCFA</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Revenus</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-red-400 text-xl font-bold">{stats.totalExpires}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Comptes expirés</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalAvis}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Avis</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <div className="text-yellow-400 text-xl font-bold">{stats.totalPaiements}</div>
                <div className="text-gray-400 text-[10px] md:text-xs">Paiements</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm appearance-none"
                >
                  <option value="tous">Tous les rôles</option>
                  <option value="organisateur">Organisateur</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              <div className="relative">
                <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm appearance-none"
                >
                  <option value="tous">Tous les plans</option>
                  {plans.map(p => (
                    <option key={p.nom} value={p.nom}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm appearance-none"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="expire">Expiré</option>
                </select>
              </div>
              <div className="relative flex-1 min-w-[200px]">
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

            {/* Gestion des utilisateurs */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-8">
              <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-white font-semibold">Gestion des utilisateurs ({filteredUsers.length})</h2>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Utilisateur</th>
                        <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Rôle</th>
                        <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Plan</th>
                        <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden sm:table-cell">Expiration</th>
                        <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Statut</th>
                        <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userItem) => {
                        const isExpired = userItem.plan_expire && new Date(userItem.plan_expire) < new Date()
                        const isAdmin = userItem.role === 'admin'
                        const isAgent = userItem.role === 'agent'
                        const isOrganisateur = userItem.role === 'organisateur'
                        const isSuperAdminUser = userItem.is_super_admin || false
                        const isSuperAdminProtected = userItem.email === DEFAULT_SUPER_ADMIN_EMAIL
                        const isCurrentUser = userItem.id === user.id
                        
                        return (
                          <tr key={userItem.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-white text-sm font-medium">{userItem.email}</p>
                                <p className="text-gray-500 text-xs">{userItem.structure || userItem.nom_complet || 'Non défini'}</p>
                                {isSuperAdminUser && (
                                  <span className="text-[10px] text-yellow-400 font-medium">⭐ Super Admin</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm hidden md:table-cell">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isSuperAdminUser ? 'bg-yellow-500/20 text-yellow-400' :
                                isAdmin ? 'bg-red-500/20 text-red-400' :
                                isAgent ? 'bg-white/20 text-white' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {isSuperAdminUser ? 'Super Admin' :
                                 isAdmin ? 'Admin' :
                                 isAgent ? 'Agent' :
                                 'Organisateur'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm hidden lg:table-cell">
                              {isAgent ? '-' : (userItem.plan_id || '-')}
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm hidden sm:table-cell">
                              {isAgent ? '-' : formatDate(userItem.plan_expire)}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(userItem)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                {/* Voir détails - TOUS */}
                                <button
                                  onClick={() => { setSelectedUser(userItem); setShowUserDetails(true) }}
                                  className="text-gray-400 hover:text-yellow-400 transition-colors p-1"
                                  title="Voir détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* AGENT : seulement voir et supprimer */}
                                {isAgent ? (
                                  <button
                                    onClick={() => handleDeleteUser(userItem.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : isAdmin ? (
                                  <>
                                    {/* Bouton Super Admin - visible uniquement pour Super Admin */}
                                    {isSuperAdmin && !isSuperAdminProtected && !isSuperAdminUser && (
                                      <button
                                        onClick={() => { setSelectedUserId(userItem.id); setShowSuperAdmin(true) }}
                                        className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                                        title="Nommer Super Admin"
                                      >
                                        <Shield className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {/* Bouton Retirer Super Admin - visible uniquement pour Super Admin */}
                                    {isSuperAdmin && isSuperAdminUser && !isSuperAdminProtected && !isCurrentUser && (
                                      <button
                                        onClick={() => handleRemoveSuperAdmin(userItem.id)}
                                        className="text-orange-400 hover:text-orange-300 transition-colors p-1"
                                        title="Retirer les privilèges Super Admin"
                                      >
                                        <Shield className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {/* Bouton Supprimer - règles strictes */}
                                    {!isSuperAdminProtected && (isSuperAdmin || (!isSuperAdminUser && !isCurrentUser)) && (
                                      <button
                                        onClick={() => handleDeleteUser(userItem.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                ) : isOrganisateur ? (
                                  <>
                                    {!isExpired && userItem.statut && (
                                      <button
                                        onClick={() => { setSelectedUserId(userItem.id); setSelectedPlan(userItem.plan_id || ''); setShowChangePlan(true) }}
                                        className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                                        title="Changer plan"
                                      >
                                        <Crown className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {!isExpired && userItem.statut && (
                                      <button
                                        onClick={() => { setSelectedUserId(userItem.id); setShowExtendPlan(true) }}
                                        className="text-white hover:text-yellow-400 transition-colors p-1"
                                        title="Prolonger"
                                      >
                                        <Clock className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {isExpired && (
                                      <button
                                        onClick={() => { 
                                          setSelectedUserId(userItem.id); 
                                          setSelectedPlan(userItem.plan_id || ''); 
                                          setShowReactivate(true) 
                                        }}
                                        className="text-green-400 hover:text-green-300 transition-colors p-1"
                                        title="Réactiver"
                                      >
                                        <Zap className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => handleDeleteUser(userItem.id)}
                                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Événements */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-800">
                <h2 className="text-white font-semibold">Événements</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-yellow-400 font-semibold text-sm mb-3">En cours ({activeEvents.length})</h3>
                  {activeEvents.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucun événement en cours</p>
                  ) : (
                    activeEvents.slice(0, 5).map(e => {
                      const org = users.find(u => u.id === e.organisateur_id)
                      return (
                        <div key={e.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                          <div className="flex-1 min-w-0">
                            <span className="text-white text-sm font-medium block truncate">{e.nom}</span>
                            <div className="flex flex-wrap gap-1 text-xs">
                              <span className="text-gray-400">{formatDate(e.date)}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 truncate">{e.lieu}</span>
                            </div>
                            {org && <span className="text-gray-500 text-xs block truncate">Organisateur: {org.structure || org.email}</span>}
                          </div>
                          <button
                            onClick={() => { setSelectedEvent(e); setShowEventDetails(true) }}
                            className="text-yellow-400 hover:text-yellow-300 text-xs flex-shrink-0 ml-2"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-red-400 font-semibold text-sm mb-3">Expirés ({expiredEvents.length})</h3>
                  {expiredEvents.length === 0 ? (
                    <p className="text-gray-400 text-sm">Aucun événement expiré</p>
                  ) : (
                    expiredEvents.slice(0, 5).map(e => {
                      const org = users.find(u => u.id === e.organisateur_id)
                      return (
                        <div key={e.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                          <div className="flex-1 min-w-0">
                            <span className="text-white text-sm font-medium block truncate">{e.nom}</span>
                            <div className="flex flex-wrap gap-1 text-xs">
                              <span className="text-gray-400">{formatDate(e.date)}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 truncate">{e.lieu}</span>
                            </div>
                            {org && <span className="text-gray-500 text-xs block truncate">Organisateur: {org.structure || org.email}</span>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <button
                              onClick={() => { setSelectedEvent(e); setShowEventDetails(true) }}
                              className="text-yellow-400 hover:text-yellow-300 text-xs"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Supprimer définitivement cet événement ?')) {
                                  supabase.from('evenements').delete().eq('id', e.id).then(() => loadAllData())
                                }
                              }}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'avis' && <AvisAdmin />}
        {activeTab === 'paiements' && <PaiementsAdmin />}
        {activeTab === 'gateway' && <ConfigGatewayAdmin />}
        {activeTab === 'formats' && <FormatIdAdmin />}
        {activeTab === 'plans' && <PlansAdmin />}
        {activeTab === 'textes' && <TextesLegauxAdmin />}
        {activeTab === 'messagerie' && <MessagerieAdmin />}
      </div>

      {/* ===== MODAL AJOUT UTILISATEUR ===== */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Créer un utilisateur</h2>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}
            {success && <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm p-3 rounded-lg mb-4">{success}</div>}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Rôle *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      setNewUser({ ...newUser, role: e.target.value })
                      if (e.target.value === 'admin') {
                        setNewUser(prev => ({
                          ...prev,
                          plan: '',
                          structure: '',
                          telephone: '',
                          phoneOm: '',
                          nomAssocie: '',
                          typeCompte: 'courant',
                          formatUssd: 'format_10',
                          codeMarchand: ''
                        }))
                      } else if (e.target.value === 'organisateur') {
                        setNewUser(prev => ({
                          ...prev,
                          nomComplet: '',
                          plan: plans.length > 0 ? plans[0].nom : ''
                        }))
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  >
                    <option value="organisateur">Organisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              {newUser.role === 'admin' && (
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Nom complet *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={newUser.nomComplet}
                      onChange={(e) => setNewUser({ ...newUser, nomComplet: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                      placeholder="Nom complet de l'administrateur"
                      required
                    />
                  </div>
                </div>
              )}

              {newUser.role === 'organisateur' && (
                <>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Plan *</label>
                    <div className="relative">
                      <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <select
                        value={newUser.plan}
                        onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        required
                      >
                        {plans.length === 0 ? (
                          <option value="">Chargement des plans...</option>
                        ) : (
                          plans.map((p) => (
                            <option key={p.nom} value={p.nom}>
                              {p.nom} - {p.prix.toLocaleString()} FCFA ({p.duree_jours} jours)
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nom de la structure *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={newUser.structure}
                        onChange={(e) => setNewUser({ ...newUser, structure: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="Nom de la structure"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Téléphone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        value={newUser.telephone}
                        onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="70123456"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-white font-semibold text-sm mb-3">Configuration Orange Money</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm block mb-1">Orange Money *</label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="tel"
                            value={newUser.phoneOm}
                            onChange={(e) => setNewUser({ ...newUser, phoneOm: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                            placeholder="70123456"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm block mb-1">Nom associé *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={newUser.nomAssocie}
                            onChange={(e) => setNewUser({ ...newUser, nomAssocie: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                            placeholder="Prénom NOM"
                            required
                          />
                        </div>
                        <p className="text-red-400 text-[10px] mt-1">⚠️ Inversez nom et prénom</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-gray-400 text-sm block mb-2">Type de compte *</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-gray-300 text-sm">
                          <input
                            type="radio"
                            name="typeCompte"
                            value="courant"
                            checked={newUser.typeCompte === 'courant'}
                            onChange={(e) => setNewUser({ ...newUser, typeCompte: e.target.value, formatUssd: 'format_2' })}
                            className="accent-yellow-400"
                          />
                          Compte courant
                        </label>
                        <label className="flex items-center gap-2 text-gray-300 text-sm">
                          <input
                            type="radio"
                            name="typeCompte"
                            value="commercial"
                            checked={newUser.typeCompte === 'commercial'}
                            onChange={(e) => setNewUser({ ...newUser, typeCompte: e.target.value })}
                            className="accent-yellow-400"
                          />
                          Compte commercial
                        </label>
                      </div>
                    </div>

                    {newUser.typeCompte === 'commercial' && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                        <label className="text-gray-400 text-sm block mb-2">Format de paiement *</label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-gray-300 text-sm">
                            <input
                              type="radio"
                              name="formatUssd"
                              value="format_3"
                              checked={newUser.formatUssd === 'format_3'}
                              onChange={(e) => setNewUser({ ...newUser, formatUssd: e.target.value })}
                              className="accent-yellow-400"
                            />
                            Format 3 (code marchand)
                          </label>
                          <label className="flex items-center gap-2 text-gray-300 text-sm">
                            <input
                              type="radio"
                              name="formatUssd"
                              value="format_10"
                              checked={newUser.formatUssd === 'format_10'}
                              onChange={(e) => setNewUser({ ...newUser, formatUssd: e.target.value })}
                              className="accent-yellow-400"
                            />
                            Format 10 (numéro)
                          </label>
                        </div>

                        {newUser.formatUssd === 'format_3' && (
                          <div className="mt-3">
                            <label className="text-gray-400 text-sm block mb-1">Code marchand *</label>
                            <input
                              type="text"
                              value={newUser.codeMarchand}
                              onChange={(e) => setNewUser({ ...newUser, codeMarchand: e.target.value })}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                              placeholder="12345678"
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {newUser.phoneOm && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs mb-1">Format généré :</p>
                        <code className="text-yellow-400 text-sm font-mono break-all">
                          {newUser.typeCompte === 'commercial' && newUser.formatUssd === 'format_3' && newUser.codeMarchand && (
                            `*144*3*${newUser.codeMarchand}*montant#`
                          )}
                          {newUser.typeCompte === 'commercial' && newUser.formatUssd === 'format_10' && (
                            `*144*10*${newUser.phoneOm}*montant#`
                          )}
                          {newUser.typeCompte === 'courant' && (
                            `*144*2*1*${newUser.phoneOm}*montant#`
                          )}
                        </code>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-semibold text-sm mb-3">Sécurité</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Mot de passe *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="8 caractères min"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Confirmer *</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={newUser.confirmPassword}
                        onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="Confirmer"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={submitting || plansLoading} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Créer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL ÉDITION UTILISATEUR ===== */}
      {showEditUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Modifier l'organisateur</h2>
              <button onClick={() => setShowEditUser(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}
            {success && <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm p-3 rounded-lg mb-4">{success}</div>}

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Email (non modifiable)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={newUser.email}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Plan</label>
                <div className="relative">
                  <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={newUser.plan}
                    onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                  >
                    {plans.map(p => (
                      <option key={p.nom} value={p.nom}>
                        {p.nom} - {p.prix.toLocaleString()} FCFA
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Nom de la structure *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={newUser.structure}
                    onChange={(e) => setNewUser({ ...newUser, structure: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="Nom de la structure"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    value={newUser.telephone}
                    onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="70123456"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-semibold text-sm mb-3">Configuration Orange Money</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Orange Money *</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        value={newUser.phoneOm}
                        onChange={(e) => setNewUser({ ...newUser, phoneOm: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="70123456"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nom associé *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={newUser.nomAssocie}
                        onChange={(e) => setNewUser({ ...newUser, nomAssocie: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="Prénom NOM"
                        required
                      />
                    </div>
                    <p className="text-red-400 text-[10px] mt-1">⚠️ Inversez nom et prénom</p>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-gray-400 text-sm block mb-2">Type de compte *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="radio"
                        name="typeCompte"
                        value="courant"
                        checked={newUser.typeCompte === 'courant'}
                        onChange={(e) => setNewUser({ ...newUser, typeCompte: e.target.value, formatUssd: 'format_2' })}
                        className="accent-yellow-400"
                      />
                      Compte courant
                    </label>
                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                      <input
                        type="radio"
                        name="typeCompte"
                        value="commercial"
                        checked={newUser.typeCompte === 'commercial'}
                        onChange={(e) => setNewUser({ ...newUser, typeCompte: e.target.value })}
                        className="accent-yellow-400"
                      />
                      Compte commercial
                    </label>
                  </div>
                </div>

                {newUser.typeCompte === 'commercial' && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                    <label className="text-gray-400 text-sm block mb-2">Format de paiement *</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-gray-300 text-sm">
                        <input
                          type="radio"
                          name="formatUssd"
                          value="format_3"
                          checked={newUser.formatUssd === 'format_3'}
                          onChange={(e) => setNewUser({ ...newUser, formatUssd: e.target.value })}
                          className="accent-yellow-400"
                        />
                        Format 3 (code marchand)
                      </label>
                      <label className="flex items-center gap-2 text-gray-300 text-sm">
                        <input
                          type="radio"
                          name="formatUssd"
                          value="format_10"
                          checked={newUser.formatUssd === 'format_10'}
                          onChange={(e) => setNewUser({ ...newUser, formatUssd: e.target.value })}
                          className="accent-yellow-400"
                        />
                        Format 10 (numéro)
                      </label>
                    </div>

                    {newUser.formatUssd === 'format_3' && (
                      <div className="mt-3">
                        <label className="text-gray-400 text-sm block mb-1">Code marchand *</label>
                        <input
                          type="text"
                          value={newUser.codeMarchand}
                          onChange={(e) => setNewUser({ ...newUser, codeMarchand: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                          placeholder="12345678"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {newUser.phoneOm && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs mb-1">Format généré :</p>
                    <code className="text-yellow-400 text-sm font-mono break-all">
                      {newUser.typeCompte === 'commercial' && newUser.formatUssd === 'format_3' && newUser.codeMarchand && (
                        `*144*3*${newUser.codeMarchand}*montant#`
                      )}
                      {newUser.typeCompte === 'commercial' && newUser.formatUssd === 'format_10' && (
                        `*144*10*${newUser.phoneOm}*montant#`
                      )}
                      {newUser.typeCompte === 'courant' && (
                        `*144*2*1*${newUser.phoneOm}*montant#`
                      )}
                    </code>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowEditUser(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Modifier</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DÉTAILS UTILISATEUR ===== */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Détails utilisateur</h2>
              <button onClick={() => setShowUserDetails(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-3">
              <div><p className="text-gray-400 text-xs">Email</p><p className="text-white break-all">{selectedUser.email}</p></div>
              <div><p className="text-gray-400 text-xs">Structure</p><p className="text-white">{selectedUser.structure || 'Non défini'}</p></div>
              <div><p className="text-gray-400 text-xs">Rôle</p><p className="text-white capitalize">{selectedUser.role}</p></div>
              <div><p className="text-gray-400 text-xs">Téléphone</p><p className="text-white">{selectedUser.telephone || 'Non défini'}</p></div>
              <div><p className="text-gray-400 text-xs">Orange Money</p><p className="text-white">{selectedUser.phone_om || 'Non défini'}</p></div>
              <div><p className="text-gray-400 text-xs">Nom associé</p><p className="text-white">{selectedUser.nom_associe || 'Non défini'}</p></div>
              <div><p className="text-gray-400 text-xs">Type compte</p><p className="text-white">{selectedUser.type_compte || 'Non défini'}</p></div>
              <div><p className="text-gray-400 text-xs">Format USSD</p><p className="text-white">{selectedUser.format_ussd || 'Non défini'}</p></div>
              {selectedUser.code_marchand && (
                <div><p className="text-gray-400 text-xs">Code marchand</p><p className="text-white">{selectedUser.code_marchand}</p></div>
              )}
              <div><p className="text-gray-400 text-xs">Format paiement</p><p className="text-white font-mono text-sm">{getUssdFormat(selectedUser)}</p></div>
              <div><p className="text-gray-400 text-xs">Plan</p><p className="text-white">{selectedUser.plan_id || 'Non défini'}</p></div>
              <div><p className="text-gray-400 text-xs">Expiration</p><p className="text-white">{formatDate(selectedUser.plan_expire)}</p></div>
              <div><p className="text-gray-400 text-xs">Statut</p><p className={selectedUser.statut ? 'text-yellow-400' : 'text-red-400'}>{selectedUser.statut ? 'Actif' : 'Inactif'}</p></div>
            </div>

            <div className="mt-6">
              <button onClick={() => setShowUserDetails(false)} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DÉTAILS ÉVÉNEMENT ===== */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Détails de l'événement</h2>
              <button onClick={() => setShowEventDetails(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-3">
              <div><p className="text-gray-400 text-xs">Nom</p><p className="text-white text-lg font-semibold">{selectedEvent.nom}</p></div>
              <div><p className="text-gray-400 text-xs">Description</p><p className="text-gray-300">{selectedEvent.description || 'Aucune description'}</p></div>
              <div><p className="text-gray-400 text-xs">Lieu</p><p className="text-white">{selectedEvent.lieu}</p></div>
              {selectedEvent.infos_lieu && (
                <div><p className="text-gray-400 text-xs">Infos supplémentaires</p><p className="text-gray-300">{selectedEvent.infos_lieu}</p></div>
              )}
              <div><p className="text-gray-400 text-xs">Date</p><p className="text-white">{formatDate(selectedEvent.date)}</p></div>
              <div><p className="text-gray-400 text-xs">Organisateur</p><p className="text-white">{users.find(u => u.id === selectedEvent.organisateur_id)?.structure || users.find(u => u.id === selectedEvent.organisateur_id)?.email || 'Non trouvé'}</p></div>
              <div><p className="text-gray-400 text-xs">Statut</p><p className={new Date(selectedEvent.date) > new Date() ? 'text-yellow-400' : 'text-red-400'}>{new Date(selectedEvent.date) > new Date() ? 'En cours' : 'Expiré'}</p></div>
              {selectedEvent.affiche_url && (
                <div><p className="text-gray-400 text-xs">Affiche</p><img src={selectedEvent.affiche_url} alt={selectedEvent.nom} className="max-h-48 object-cover rounded-lg" /></div>
              )}
            </div>

            <div className="mt-6">
              <button onClick={() => setShowEventDetails(false)} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CHANGER PLAN ===== */}
      {showChangePlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-white font-semibold text-lg mb-4">Changer le plan</h3>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Nouveau plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                >
                  {plans.map(p => (
                    <option key={p.nom} value={p.nom}>{p.nom} - {p.prix.toLocaleString()} FCFA</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowChangePlan(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Annuler</button>
                <button onClick={handleChangePlan} disabled={submitting} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50">
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Valider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PROLONGER PLAN ===== */}
      {showExtendPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-white font-semibold text-lg mb-4">Prolonger le plan</h3>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Jours à ajouter</label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                >
                  {extendOptions.map(d => (
                    <option key={d} value={d}>{d} jours</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowExtendPlan(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Annuler</button>
                <button onClick={handleExtendPlan} disabled={submitting} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50">
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Valider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL RÉACTIVER ===== */}
      {showReactivate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-white font-semibold text-lg mb-4">Réactiver le compte</h3>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                >
                  {plans.map(p => (
                    <option key={p.nom} value={p.nom}>{p.nom} - {p.prix.toLocaleString()} FCFA</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReactivate(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Annuler</button>
                <button onClick={handleReactivate} disabled={submitting} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50">
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Réactiver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SUPER ADMIN ===== */}
      {showSuperAdmin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-white font-semibold text-lg mb-4">Nommer Super Admin</h3>
            <p className="text-gray-400 text-sm mb-4">Confirmer que cet utilisateur devient Super Admin ?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSuperAdmin(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Annuler</button>
              <button onClick={handleAddSuperAdmin} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PROFIL ===== */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-white font-semibold text-lg mb-4">
              {profileStep === 'email' ? 'Vérifier votre email' : 'Changer le mot de passe'}
            </h3>
            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2 rounded-lg mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm p-2 rounded-lg mb-4 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{profileSuccess}</span>
              </div>
            )}
            <div className="space-y-4">
              {profileStep === 'email' ? (
                <>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                      placeholder="votre@email.com"
                    />
                    <p className="text-gray-500 text-xs mt-1">Entrez votre email pour vérifier vos droits administrateur</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowProfile(false); setProfileStep('email') }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">
                      Annuler
                    </button>
                    <button onClick={handleVerifyEmail} disabled={submitting} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Vérifier'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="8 caractères min"
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
                    <label className="text-gray-400 text-sm block mb-1">Confirmer</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
                        placeholder="Confirmer"
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
                  <div className="flex gap-3">
                    <button onClick={() => { setProfileStep('email'); setProfileData({ ...profileData, newPassword: '', confirmPassword: '' }) }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">
                      Retour
                    </button>
                    <button onClick={handleChangePassword} disabled={submitting} className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Changer'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardAdmin
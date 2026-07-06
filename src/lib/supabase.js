/**
 * Supabase Client - Sécurité Niveau NASA
 * Règles NASA 1-10
 * Version définitive - Protection maximale
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================
// RÈGLE NASA 7 : Validation stricte des entrées
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Validation des variables d'environnement
if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    throw new Error('[SECURITY] Configuration Supabase invalide: URL manquante')
}

if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
    throw new Error('[SECURITY] Configuration Supabase invalide: Clé manquante')
}

if (supabaseUrl.length < 10 || !supabaseUrl.includes('supabase.co')) {
    throw new Error('[SECURITY] URL Supabase invalide')
}

if (supabaseAnonKey.length < 50) {
    throw new Error('[SECURITY] Clé Supabase invalide')
}

// ============================================================
// RÈGLE NASA 6 : Portée minimale
// ============================================================

const supabaseOptions = {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.sessionStorage,
        storageKey: 'faso-ticket-auth',
        flowType: 'pkce'
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'X-Client-Info': `faso-ticket@1.0.0`,
            'X-Client-Environment': import.meta.env.PROD ? 'production' : 'development'
        }
    }
}

// ============================================================
// RÈGLE NASA 1 : Point d'entrée unique
// ============================================================

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// ============================================================
// CLIENT ADMIN AVEC SERVICE ROLE KEY (POUR SUPPRESSION)
// ============================================================

export const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      })
    : null

// ============================================================
// RÈGLE NASA 4 : Fonctions courtes (< 60 lignes)
// ============================================================

export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('[SECURITY] Échec de récupération utilisateur:', error.message)
        }
        return null
    }
}

export const getUserRole = async (userId) => {
    if (!userId || typeof userId !== 'string') {
        return null
    }
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role, statut, plan_id, plan_expire')
            .eq('id', userId)
            .single()
        
        if (error) throw error
        
        if (!data) return null
        
        return {
            role: data.role,
            statut: data.statut,
            plan_id: data.plan_id,
            plan_expire: data.plan_expire
        }
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('[SECURITY] Échec de récupération du rôle:', error.message)
        }
        return null
    }
}

export const isAdmin = async (userId) => {
    if (!userId || typeof userId !== 'string') {
        return false
    }
    const userData = await getUserRole(userId)
    return userData?.role === 'admin' && userData?.statut === true
}

export const isOrganisateur = async (userId) => {
    if (!userId || typeof userId !== 'string') {
        return false
    }
    const userData = await getUserRole(userId)
    return userData?.role === 'organisateur' && userData?.statut === true && userData?.plan_id !== null
}

export const logout = async () => {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        sessionStorage.removeItem('faso-ticket-auth')
        sessionStorage.removeItem('faso-ticket-session')
        sessionStorage.removeItem('supabase.auth.token')
        
        return { success: true }
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('[SECURITY] Erreur de déconnexion:', error.message)
        }
        return { success: false, error: error.message }
    }
}

export const validateSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) return false
        
        const expiresAt = new Date(session.expires_at || 0)
        const now = new Date()
        return expiresAt > now
    } catch {
        return false
    }
}

export const deleteUserFromAuth = async (userId) => {
    if (!supabaseAdmin) {
        throw new Error('Service Role Key non configurée')
    }
    
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return { success: true }
    } catch (error) {
        throw new Error(`Erreur lors de la suppression dans auth: ${error.message}`)
    }
}

export const verifyUserHasPlan = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('plan_id, plan_expire, statut')
            .eq('id', userId)
            .single()
        
        if (error) throw error
        
        if (!data) return { hasPlan: false, reason: 'Utilisateur non trouvé' }
        
        if (!data.statut) return { hasPlan: false, reason: 'Compte désactivé' }
        
        if (!data.plan_id) return { hasPlan: false, reason: 'Aucun plan souscrit' }
        
        if (data.plan_expire && new Date(data.plan_expire) < new Date()) {
            return { hasPlan: false, reason: 'Plan expiré' }
        }
        
        return { hasPlan: true }
    } catch (error) {
        return { hasPlan: false, reason: 'Erreur de vérification' }
    }
}

export default supabase
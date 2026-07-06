/**
 * Constantes - Règles NASA 1, 6, 9
 */

export const PLANS = {
  BASIQUE: {
    id: 'basique',
    nom: 'Basique',
    prix: 30000,
    dureeJours: 30,
    evenementsMax: 2,
    agentsMax: 2,
    codesMax: 5,
    typesTickets: ['Simple', 'VIP']
  },
  PREMIUM: {
    id: 'premium',
    nom: 'Premium',
    prix: 50000,
    dureeJours: 90,
    evenementsMax: 10,
    agentsMax: 5,
    codesMax: 15,
    typesTickets: ['Simple', 'VIP', 'VVIP', 'Stand', 'Salon', 'Personnalisé']
  }
}

export const ROLES = {
  ADMIN: 'admin',
  ORGANISATEUR: 'organisateur',
  AGENT: 'agent'
}

export const STATUS = {
  ACTIF: 'actif',
  INACTIF: 'inactif',
  EN_ATTENTE: 'en_attente',
  VALIDE: 'valide',
  EXPIRE: 'expire'
}
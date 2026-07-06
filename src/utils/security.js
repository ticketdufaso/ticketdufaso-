/**
 * Sécurité - Niveau NASA/Google/Windows
 * Règles NASA 1, 5, 6, 7, 9
 */

export const validateInput = (input, type = 'string') => {
  if (input === null || input === undefined) return false
  
  switch (type) {
    case 'string':
      return typeof input === 'string' && input.length > 0 && input.length < 10000
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
    case 'phone':
      return /^(\+226)?[0-9]{8}$/.test(input)
    case 'number':
      return typeof input === 'number' && !isNaN(input) && input >= 0
    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)
    default:
      return true
  }
}

export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return ''
  if (str.length > 10000) return str.substring(0, 10000)
  const dangerous = /<script|javascript:|on\w+=|data:text\/html/gi
  return str.replace(dangerous, '').trim()
}

export const generateSecureId = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
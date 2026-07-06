/**
 * Validateurs - Niveau NASA
 * Règles NASA 5, 7
 */

import { z } from 'zod'

export const emailSchema = z
  .string()
  .email('Email invalide')
  .min(5, 'Email trop court')
  .max(255, 'Email trop long')

export const phoneSchema = z
  .string()
  .regex(/^(\+226)?[0-9]{8}$/, 'Numéro de téléphone invalide')

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[a-z]/, 'Doit contenir une lettre minuscule')
  .regex(/[A-Z]/, 'Doit contenir une lettre majuscule')
  .regex(/[0-9]/, 'Doit contenir un chiffre')

export const validate = (schema, data) => {
  try {
    return { success: true, data: schema.parse(data) }
  } catch (error) {
    return { 
      success: false, 
      errors: error.errors?.map(e => e.message) || ['Validation échouée'] 
    }
  }
}

export const validateEmail = (email) => {
  const result = validate(emailSchema, email)
  return result.success
}

export const validatePhone = (phone) => {
  const result = validate(phoneSchema, phone)
  return result.success
}

export const validatePassword = (password) => {
  const result = validate(passwordSchema, password)
  return result.success
}
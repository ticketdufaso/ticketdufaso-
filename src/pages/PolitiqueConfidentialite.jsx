/**
 * Page Politique de Confidentialité
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader, AlertCircle } from 'lucide-react'

const PolitiqueConfidentialite = () => {
  const [contenu, setContenu] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('config_textes')
          .select('contenu, updated_at')
          .eq('type', 'politique_confidentialite')
          .single()

        if (error) throw error
        
        setContenu(data?.contenu || '')
        if (data?.updated_at) {
          setLastUpdate(new Date(data.updated_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }))
        }
      } catch (error) {
        setError('Impossible de charger la politique de confidentialité')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Politique de <span className="text-yellow-400">Confidentialité</span>
          </h1>
          {lastUpdate && (
            <p className="text-gray-500 text-sm mb-6">
              Dernière mise à jour : {lastUpdate}
            </p>
          )}
          <div className="prose prose-invert max-w-none">
            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {contenu}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PolitiqueConfidentialite
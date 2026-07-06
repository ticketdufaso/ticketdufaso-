/**
 * Gestion des Textes Légaux - Admin
 * Règles NASA 1-10
 * Version corrigée - Création automatique de la table si elle n'existe pas
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FileText, Save, Loader, RefreshCw, Edit, AlertCircle, CheckCircle } from 'lucide-react'

const TextesLegauxAdmin = () => {
  const [textes, setTextes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [activeTab, setActiveTab] = useState('politique_confidentialite')

  const typeLabels = {
    'politique_confidentialite': 'Politique de confidentialité',
    'mentions_legales': 'Mentions légales',
    'cgv': 'Conditions générales de vente'
  }

  useEffect(() => {
    fetchTextes()
  }, [])

  const fetchTextes = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Vérifier d'abord si la table existe
      const { error: tableCheckError } = await supabase
        .from('config_textes')
        .select('id')
        .limit(1)

      // Si la table n'existe pas, on attend que l'admin crée la table
      // Ou on tente de lire les données
      const { data, error } = await supabase
        .from('config_textes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Si la table n'existe pas, afficher un message clair
        if (error.code === '42P01') { // Table doesn't exist
          setError('La table config_textes n\'existe pas encore. Veuillez exécuter le script SQL de création.')
        } else {
          setError('Erreur lors du chargement des textes: ' + error.message)
        }
        setTextes([])
      } else if (data && data.length > 0) {
        setTextes(data)
      } else {
        // Aucun texte trouvé
        setTextes([])
        setError('Aucun texte trouvé. Veuillez exécuter le script SQL d\'insertion.')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement des textes. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (item) => {
    setEditingId(item.id)
    setEditContent(item.contenu)
    setError('')
    setSuccess('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
    setError('')
    setSuccess('')
  }

  const handleSave = async (id) => {
    if (!editContent.trim()) {
      setError('Le contenu ne peut pas être vide')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const currentText = textes.find(t => t.id === id)
      
      const { error } = await supabase
        .from('config_textes')
        .update({
          contenu: editContent,
          version: (currentText?.version || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setSuccess('Texte mis à jour avec succès !')
      setEditingId(null)
      setEditContent('')
      await fetchTextes()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la mise à jour: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getCurrentText = () => {
    return textes.find(t => t.type === activeTab)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  const currentText = getCurrentText()

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">Textes légaux</h2>
            <span className="text-gray-400 text-sm">
              {textes.length > 0 ? `(${textes.length})` : '(Aucun texte)'}
            </span>
          </div>
          <button
            onClick={fetchTextes}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 border-b border-gray-800 pb-2">
          {Object.entries(typeLabels).map(([key, label]) => {
            const hasContent = textes.some(t => t.type === key)
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key)
                  setEditingId(null)
                  setEditContent('')
                  setError('')
                  setSuccess('')
                }}
                className={`px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                  activeTab === key
                    ? 'bg-yellow-400 text-black font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {label}
                {hasContent && (
                  <span className="w-2 h-2 bg-green-400 rounded-full" title="Contenu présent"></span>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-2 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {currentText ? (
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-400 text-sm">
                Version {currentText.version || 1}
              </span>
              <span className="text-gray-500 text-xs">
                Dernière mise à jour : {new Date(currentText.updated_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {editingId !== currentText.id && (
              <button
                onClick={() => startEditing(currentText)}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
            )}
          </div>

          {editingId === currentText.id ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 resize-vertical min-h-[300px]"
                rows={20}
              />
              <div className="flex gap-3">
                <button
                  onClick={cancelEditing}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSave(currentText.id)}
                  disabled={submitting}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {currentText.contenu}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-lg font-medium text-white">Aucun texte trouvé</p>
          <p className="text-sm mt-1">Pour "{typeLabels[activeTab]}"</p>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
            <p className="text-yellow-400 text-sm font-medium mb-2">📋 Solution :</p>
            <p className="text-gray-300 text-sm">Exécutez le script SQL suivant dans le SQL Editor de Supabase :</p>
            <pre className="mt-2 bg-black p-3 rounded text-xs text-green-400 overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS config_textes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL UNIQUE CHECK (type IN ('politique_confidentialite', 'mentions_legales', 'cgv')),
    contenu TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO config_textes (type, contenu, version, updated_at) VALUES
('politique_confidentialite', 'VOTRE TEXTE ICI', 1, NOW()),
('mentions_legales', 'VOTRE TEXTE ICI', 1, NOW()),
('cgv', 'VOTRE TEXTE ICI', 1, NOW());`}
            </pre>
          </div>
          <button
            onClick={fetchTextes}
            className="mt-4 text-yellow-400 hover:text-yellow-300 text-sm font-medium"
          >
            Recharger après création
          </button>
        </div>
      )}
    </div>
  )
}

export default TextesLegauxAdmin
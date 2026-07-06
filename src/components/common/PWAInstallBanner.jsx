/**
 * Bannière d'installation PWA
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * Affiche une bannière pour installer l'application
 * Ne s'affiche que si l'application n'est pas déjà installée
 */

import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone, CheckCircle } from 'lucide-react'

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  // Clé pour le localStorage
  const DISMISS_KEY = 'faso-ticket-pwa-dismissed'

  // Vérifier si l'application est déjà installée (mode standalone)
  const checkIfInstalled = () => {
    // Vérifier si en mode standalone (PWA installée)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone === true
    
    setIsStandalone(isStandaloneMode)
    return isStandaloneMode
  }

  // Vérifier si c'est un appareil iOS
  const checkIfIOS = () => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)
    return isIOSDevice
  }

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé la bannière
    const dismissed = localStorage.getItem(DISMISS_KEY) === 'true'
    setIsDismissed(dismissed)

    // Vérifier si l'application est déjà installée
    const installed = checkIfInstalled()
    setIsInstalled(installed)

    // Vérifier si c'est un appareil iOS
    checkIfIOS()

    // Si déjà installée ou fermée, ne pas afficher la bannière
    if (installed || dismissed) {
      setShowBanner(false)
      return
    }

    // Écouter l'événement beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Afficher la bannière après un court délai
      setTimeout(() => {
        setShowBanner(true)
      }, 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Écouter l'événement appinstalled (installation réussie)
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
      localStorage.setItem(DISMISS_KEY, 'true')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    // Écouter les changements de mode d'affichage (si l'utilisateur passe en standalone)
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true)
        setShowBanner(false)
        localStorage.setItem(DISMISS_KEY, 'true')
      }
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    // Si l'application est déjà en standalone après le chargement
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      setShowBanner(false)
      localStorage.setItem(DISMISS_KEY, 'true')
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  // Fonction d'installation
  const handleInstall = async () => {
    if (isIOS) {
      // Sur iOS, on ne peut pas installer automatiquement
      // On guide l'utilisateur
      setShowBanner(false)
      // On affiche une instruction pour iOS
      alert('📱 Pour installer FasoTicket sur votre iPhone/iPad :\n\n1. Appuyez sur le bouton "Partager" (carré avec flèche vers le haut)\n2. Faites défiler vers le bas et appuyez sur "Sur l\'écran d\'accueil"\n3. Appuyez sur "Ajouter"')
      return
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const result = await deferredPrompt.userChoice
        if (result.outcome === 'accepted') {
          setShowBanner(false)
          localStorage.setItem(DISMISS_KEY, 'true')
          setIsInstalled(true)
        }
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Erreur installation:', error)
      }
    } else {
      // Fallback: guider l'utilisateur
      alert('📱 Pour installer FasoTicket :\n\nSur Android : Ouvrez le menu du navigateur (3 points) et appuyez sur "Ajouter à l\'écran d\'accueil"\n\nSur iOS : Appuyez sur "Partager" puis "Sur l\'écran d\'accueil"')
    }
  }

  // Fonction pour fermer la bannière (plus tard)
  const handleDismiss = () => {
    setShowBanner(false)
    setIsDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  // Ne pas afficher si déjà installé ou fermé
  if (isInstalled || isDismissed || !showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/95 border-t border-yellow-400/20 backdrop-blur-md animate-slide-up">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Icône */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-yellow-400/10 rounded-xl p-2">
              <Smartphone className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="sm:hidden">
              <p className="text-white font-semibold text-sm">FasoTicket</p>
              <p className="text-gray-400 text-xs">Installation rapide</p>
            </div>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base">
              Bienvenue sur <span className="text-yellow-400">FasoTicket</span>
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              La meilleure plateforme de billetterie. 
              <span className="hidden sm:inline"> Installez FasoTicket comme une application pour une expérience optimale.</span>
            </p>
            <p className="text-gray-500 text-xs sm:hidden mt-0.5">
              Installez FasoTicket comme une application pour une expérience optimale.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={handleInstall}
              className="flex-1 sm:flex-none bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 sm:flex-none bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallBanner
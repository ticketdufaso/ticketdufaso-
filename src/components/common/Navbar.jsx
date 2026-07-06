/**
 * Navbar - Sécurisée et responsive
 * Règles NASA 1, 4, 5, 6, 7
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Menu, X, Home, ShoppingBag, Calendar, User, 
  LogOut, Users, Crown, Settings, Sun, Moon
} from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, role, logout, isAuthenticated } = useAuthContext()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      setIsOpen(false)
    } catch (error) {
      console.error('Erreur de déconnexion')
    }
  }

  const navLinks = [
    { name: 'Accueil', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Boutique', path: '/boutique', icon: <ShoppingBag className="w-4 h-4" /> },
    { name: 'Réservation', path: '/reservation', icon: <Calendar className="w-4 h-4" /> },
  ]

  // Classes dynamiques selon le thème
  const bgClass = isScrolled 
    ? isDark ? 'bg-black/95 backdrop-blur-md border-b border-yellow-400/20' : 'bg-white/95 backdrop-blur-md border-b border-yellow-400/20 shadow-sm'
    : isDark ? 'bg-black border-b border-yellow-400/10' : 'bg-white border-b border-yellow-400/10'
  
  const textClass = isDark ? 'text-gray-300 hover:text-yellow-400' : 'text-gray-600 hover:text-yellow-600'
  const hoverBgClass = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const mobileBgClass = isDark ? 'border-gray-800' : 'border-gray-200'
  const mobileTextClass = isDark ? 'text-gray-300' : 'text-gray-700'

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl md:text-3xl font-bold tracking-tight">
              <span className={isDark ? 'text-white' : 'text-black'}>FASO</span>
              <span className="text-yellow-400">TICKET</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1 px-3 py-2 ${textClass} ${hoverBgClass} rounded-lg transition-all duration-200`}
              >
                {link.icon}
                <span className="text-sm font-medium">{link.name}</span>
              </Link>
            ))}

            {/* Bouton de thème */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${textClass} ${hoverBgClass}`}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated() ? (
              <div className={`flex items-center space-x-2 ml-4 border-l ${borderClass} pl-4`}>
                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center space-x-1 px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  >
                    <Crown className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin</span>
                  </Link>
                )}
                {role === 'organisateur' && (
                  <Link
                    to="/organisateur/dashboard"
                    className="flex items-center space-x-1 px-3 py-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Déconnexion</span>
                </button>
              </div>
            ) : (
              <Link
                to="/connexion"
                className="flex items-center space-x-1 px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105"
              >
                <User className="w-4 h-4" />
                <span>Connexion</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${textClass} ${hoverBgClass}`}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`transition-colors p-2 ${mobileTextClass}`}
              aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className={`md:hidden py-4 border-t ${mobileBgClass}`}>
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-4 py-3 ${textClass} ${hoverBgClass} rounded-lg transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ))}

              {isAuthenticated() ? (
                <>
                  {role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className={`flex items-center space-x-2 px-4 py-3 text-red-500 hover:text-red-400 ${hoverBgClass} rounded-lg transition-colors`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Crown className="w-4 h-4" />
                      <span>Dashboard Admin</span>
                    </Link>
                  )}
                  {role === 'organisateur' && (
                    <Link
                      to="/organisateur/dashboard"
                      className={`flex items-center space-x-2 px-4 py-3 text-yellow-400 hover:text-yellow-300 ${hoverBgClass} rounded-lg transition-colors`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Dashboard Organisateur</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className={`flex items-center space-x-2 px-4 py-3 text-red-500 hover:text-red-400 ${hoverBgClass} rounded-lg transition-colors w-full text-left`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/connexion"
                    className="flex items-center space-x-2 px-4 py-3 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Connexion</span>
                  </Link>
                  <Link
                    to="/devenir-organisateur"
                    className="flex items-center space-x-2 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Users className="w-4 h-4" />
                    <span>Devenir organisateur</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
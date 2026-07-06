/**
 * Layout principal
 * Règles NASA 1, 4, 5, 6
 */

import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import PWAInstallBanner from './PWAInstallBanner'
import { Toaster } from 'react-hot-toast'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
      
      {/* Bannière d'installation PWA */}
      <PWAInstallBanner />
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#FFD700',
              secondary: '#000000',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF0000',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  )
}

export default Layout
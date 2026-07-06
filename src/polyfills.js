// src/polyfills.js
// Polyfill pour html2canvas sur Netlify

if (typeof window !== 'undefined') {
  // S'assurer que window est défini
  if (!window.html2canvas) {
    window.html2canvas = {}
  }
}
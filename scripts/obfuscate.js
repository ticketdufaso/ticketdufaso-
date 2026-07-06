/**
 * Script d'obfuscation - Niveau NASA
 * Règles NASA 1, 4, 5, 6
 * CORRECTION : Exclure html2canvas et ses dépendances de l'obfuscation
 */

import JavaScriptObfuscator from 'javascript-obfuscator'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// CONFIGURATION
// ============================================================

const OBFUSCATION_CONFIG = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: true,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.5,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}

// ✅ EXCLURE html2canvas et ses dépendances de l'obfuscation
const EXCLUDED_PATTERNS = [
  'vendor',
  'polyfill',
  'chunk-vendors',
  'runtime',
  'html2canvas',
  'jspdf',
  'canvas'  // Le chunk canvas qu'on a créé dans vite.config.js
]

const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']

let stats = {
  success: 0,
  failed: 0,
  skipped: 0,
  files: []
}

// ============================================================
// FONCTIONS
// ============================================================

const obfuscateFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Ne pas obfusquer si le fichier est déjà obfusqué
    if (content.includes('selfDefending') || content.includes('_0x')) {
      stats.skipped++
      console.log(`⏭️  Déjà obfusqué: ${path.basename(filePath)}`)
      return
    }
    
    const result = JavaScriptObfuscator.obfuscate(content, OBFUSCATION_CONFIG)
    fs.writeFileSync(filePath, result.getObfuscatedCode(), 'utf8')
    
    stats.success++
    console.log(`✅ Obfusqué: ${path.basename(filePath)}`)
  } catch (error) {
    stats.failed++
    console.error(`❌ Erreur sur ${path.basename(filePath)}:`, error.message)
  }
}

const obfuscateDirectory = (directory) => {
  if (!fs.existsSync(directory)) {
    console.log(`⚠️ Dossier non trouvé: ${directory}`)
    return
  }

  const files = fs.readdirSync(directory)
  
  for (const file of files) {
    const fullPath = path.join(directory, file)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      obfuscateDirectory(fullPath)
    } else {
      const ext = path.extname(file)
      const isAllowed = ALLOWED_EXTENSIONS.includes(ext)
      const isExcluded = EXCLUDED_PATTERNS.some(p => file.includes(p))
      
      if (isAllowed && !isExcluded) {
        obfuscateFile(fullPath)
      } else if (isExcluded) {
        stats.skipped++
        console.log(`⏭️  Exclus: ${path.basename(file)}`)
      }
    }
  }
}

// ============================================================
// MAIN
// ============================================================

const main = () => {
  console.log('🚀 Démarrage de l\'obfuscation...')
  console.log('📋 Configuration:')
  console.log(`   - Extensions: ${ALLOWED_EXTENSIONS.join(', ')}`)
  console.log(`   - Exclus: ${EXCLUDED_PATTERNS.join(', ')}`)
  console.log('')
  
  const distDir = path.join(__dirname, '../dist/assets')
  
  if (!fs.existsSync(distDir)) {
    console.log('⚠️ Dossier dist/assets non trouvé. Exécutez d\'abord "npm run build"')
    process.exit(1)
  }
  
  obfuscateDirectory(distDir)
  
  console.log('')
  console.log('📊 RÉSUMÉ:')
  console.log(`   ✅ Succès: ${stats.success}`)
  console.log(`   ❌ Échecs: ${stats.failed}`)
  console.log(`   ⏭️  Ignorés: ${stats.skipped}`)
  console.log('')
  console.log('🎯 Obfuscation terminée !')
}

// Vérifier qu'on est en production
console.assert(
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'secure',
  'L\'obfuscation ne doit être utilisée qu\'en production'
)

main()
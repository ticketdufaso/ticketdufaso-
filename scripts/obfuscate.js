/**
 * Script d'obfuscation - Niveau NASA
 * Règles NASA 1, 4, 5, 6
 * CORRECTIONS :
 * - Sauvegarde des fichiers originaux (.bak)
 * - Support de .jsx, .ts, .tsx
 * - Journalisation des résultats
 * - Ignorer les fichiers déjà obfusqués
 * - Suppression des sourcemaps
 * - Compteurs de succès/échec
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
  controlFlowFlatteningThreshold: 1,
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

const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
const EXCLUDED_PATTERNS = ['vendor', 'polyfill', 'chunk-vendors', 'runtime']
const MIN_FILE_SIZE = 1024 // 1KB - ignorer les fichiers trop petits
const OBFUSCATION_LOG = path.join(__dirname, '../dist/obfuscation-log.json')

let stats = {
  startTime: new Date().toISOString(),
  success: 0,
  failed: 0,
  skipped: 0,
  files: []
}

// ============================================================
// FONCTIONS
// ============================================================

/**
 * Vérifier si un fichier est déjà obfusqué
 */
const isObfuscated = (content) => {
  // Détecter les marqueurs d'obfuscation
  const markers = [
    'selfDefending',
    'decodeURIComponent',
    'while (!![])',
    'var _0x',
    'function _0x'
  ]
  
  for (const marker of markers) {
    if (content.includes(marker)) {
      return true
    }
  }
  return false
}

/**
 * Obfusquer un fichier individuel
 */
const obfuscateFile = (filePath) => {
  try {
    console.assert(fs.existsSync(filePath), `Fichier non trouvé: ${filePath}`)
    
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Ignorer les fichiers déjà obfusqués
    if (isObfuscated(content)) {
      stats.skipped++
      stats.files.push({
        path: filePath,
        status: 'skipped',
        reason: 'already obfuscated'
      })
      console.log(`⏭️  Déjà obfusqué: ${path.basename(filePath)}`)
      return
    }
    
    // Sauvegarder l'original
    const backupPath = filePath + '.bak'
    fs.writeFileSync(backupPath, content, 'utf8')
    
    // Obfusquer
    const result = JavaScriptObfuscator.obfuscate(content, OBFUSCATION_CONFIG)
    fs.writeFileSync(filePath, result.getObfuscatedCode(), 'utf8')
    
    stats.success++
    stats.files.push({
      path: filePath,
      status: 'success',
      originalSize: content.length,
      obfuscatedSize: result.getObfuscatedCode().length
    })
    
    console.log(`✅ Obfusqué: ${path.basename(filePath)}`)
  } catch (error) {
    stats.failed++
    stats.files.push({
      path: filePath,
      status: 'failed',
      error: error.message
    })
    console.error(`❌ Erreur sur ${filePath}:`, error.message)
  }
}

/**
 * Supprimer les fichiers sourcemaps
 */
const removeSourceMaps = (directory) => {
  if (!fs.existsSync(directory)) return
  
  const files = fs.readdirSync(directory)
  let removed = 0
  
  for (const file of files) {
    if (file.endsWith('.map')) {
      const fullPath = path.join(directory, file)
      fs.unlinkSync(fullPath)
      removed++
      console.log(`🗑️  Sourcemap supprimée: ${file}`)
    }
  }
  
  return removed
}

/**
 * Parcourir un répertoire récursivement
 */
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
        // Vérifier la taille du fichier
        const fileSize = stat.size
        if (fileSize < MIN_FILE_SIZE) {
          stats.skipped++
          stats.files.push({
            path: fullPath,
            status: 'skipped',
            reason: 'file too small (< 1KB)'
          })
          console.log(`⏭️  Fichier trop petit: ${path.basename(file)}`)
          continue
        }
        obfuscateFile(fullPath)
      }
    }
  }
}

/**
 * Fonction principale
 */
const main = () => {
  console.log('🚀 Démarrage de l\'obfuscation...')
  console.log('📋 Configuration:')
  console.log(`   - Extensions: ${ALLOWED_EXTENSIONS.join(', ')}`)
  console.log(`   - Exclus: ${EXCLUDED_PATTERNS.join(', ')}`)
  console.log(`   - Taille min: ${MIN_FILE_SIZE / 1024} KB`)
  console.log('')
  
  const distDir = path.join(__dirname, '../dist/assets')
  
  if (!fs.existsSync(distDir)) {
    console.log('⚠️ Dossier dist/assets non trouvé. Exécutez d\'abord "npm run build"')
    process.exit(1)
  }
  
  // 1. Supprimer les sourcemaps
  console.log('🗑️  Suppression des sourcemaps...')
  const removed = removeSourceMaps(distDir)
  console.log(`   ${removed} sourcemaps supprimées`)
  console.log('')
  
  // 2. Obfusquer les fichiers
  console.log('🔒 Obfuscation...')
  obfuscateDirectory(distDir)
  
  // 3. Journaliser les résultats
  stats.endTime = new Date().toISOString()
  fs.writeFileSync(OBFUSCATION_LOG, JSON.stringify(stats, null, 2))
  
  // 4. Afficher le résumé
  console.log('')
  console.log('📊 RÉSUMÉ:')
  console.log(`   ✅ Succès: ${stats.success}`)
  console.log(`   ❌ Échecs: ${stats.failed}`)
  console.log(`   ⏭️  Ignorés: ${stats.skipped}`)
  console.log(`   📄 Log: ${OBFUSCATION_LOG}`)
  console.log('')
  console.log('🎯 Obfuscation terminée avec succès !')
}

// ============================================================
// EXÉCUTION
// ============================================================

// Vérifier qu'on est en production
console.assert(
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'secure',
  'L\'obfuscation ne doit être utilisée qu\'en production'
)

main()
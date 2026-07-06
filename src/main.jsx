/**
 * Script d'obfuscation - Niveau NASA
 * Règles NASA 1, 4, 5, 6
 */

import JavaScriptObfuscator from 'javascript-obfuscator'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

const obfuscateFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const result = JavaScriptObfuscator.obfuscate(content, OBFUSCATION_CONFIG)
    fs.writeFileSync(filePath, result.getObfuscatedCode(), 'utf8')
    console.log(`✅ Obfusqué: ${path.basename(filePath)}`)
  } catch (error) {
    console.error(`❌ Erreur sur ${filePath}:`, error.message)
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
      }
    }
  }
}

const main = () => {
  console.log('🚀 Démarrage de l\'obfuscation...')
  const distDir = path.join(__dirname, '../dist/assets')
  
  if (!fs.existsSync(distDir)) {
    console.log('⚠️ Dossier dist/assets non trouvé. Build d\'abord ?')
    process.exit(1)
  }
  
  obfuscateDirectory(distDir)
  console.log('🎯 Obfuscation terminée avec succès !')
}

console.assert(process.env.NODE_ENV === 'production', 'L\'obfuscation ne doit être utilisée qu\'en production')

main()
/**
 * Script d'installation Husky pour Windows/macOS/Linux
 * Règles NASA 1, 4, 5, 6
 * CORRECTIONS :
 * - Vérification de l'existence du hook
 * - Vérification de lint-staged dans package.json
 * - Utilisation de fs.chmod pour la portabilité
 * - Messages d'aide en cas d'erreur
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// FONCTIONS
// ============================================================

/**
 * Vérifier si lint-staged est configuré dans package.json
 */
const checkLintStaged = () => {
  const pkgPath = path.join(process.cwd(), 'package.json')
  
  if (!fs.existsSync(pkgPath)) {
    console.warn('⚠️ package.json non trouvé')
    return false
  }
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    
    if (!pkg['lint-staged']) {
      console.warn('⚠️ lint-staged non configuré dans package.json')
      console.warn('   Ajoutez cette configuration:')
      console.warn(`
  "lint-staged": {
    "*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
      `)
      return false
    }
    
    console.log('✅ lint-staged configuré')
    return true
  } catch (error) {
    console.warn('⚠️ Erreur lors de la lecture de package.json')
    return false
  }
}

/**
 * Vérifier la présence de Git
 */
const checkGit = () => {
  try {
    execSync('git --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Initialiser Git si nécessaire
 */
const initGit = () => {
  if (fs.existsSync('.git')) {
    return true
  }
  
  console.log('📦 Initialisation de Git...')
  try {
    execSync('git init', { stdio: 'inherit' })
    console.log('✅ Git initialisé')
    return true
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Git')
    return false
  }
}

/**
 * Créer le hook pre-commit
 */
const createPreCommitHook = () => {
  const preCommitPath = '.husky/pre-commit'
  
  // Vérifier si le hook existe déjà
  if (fs.existsSync(preCommitPath)) {
    const content = fs.readFileSync(preCommitPath, 'utf8')
    if (content.includes('lint-staged')) {
      console.log('✅ Hook pre-commit déjà configuré')
      return true
    }
    console.log('🔄 Mise à jour du hook pre-commit...')
  }
  
  // Créer le dossier .husky
  if (!fs.existsSync('.husky')) {
    fs.mkdirSync('.husky', { recursive: true })
  }
  
  // Écrire le hook
  const preCommitContent = `#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
`
  fs.writeFileSync(preCommitPath, preCommitContent, 'utf8')
  
  // Rendre exécutable
  try {
    fs.chmodSync(preCommitPath, 0o755)
  } catch {
    // Fallback pour Windows
    try {
      execSync(`icacls "${preCommitPath}" /grant Everyone:RX`, { stdio: 'ignore' })
    } catch {
      console.warn('⚠️ Impossible de rendre le hook exécutable')
    }
  }
  
  console.log('✅ Hook pre-commit créé')
  return true
}

/**
 * Fonction principale
 */
const ensureHusky = () => {
  console.log('🔧 Configuration de Husky...')
  console.log('')
  
  // 1. Vérifier Git
  console.log('📌 Vérification de Git...')
  if (!checkGit()) {
    console.error('❌ Git n\'est pas installé.')
    console.error('   Téléchargez-le depuis: https://git-scm.com/download/win')
    console.error('   Ou pour macOS: brew install git')
    console.error('   Ou pour Linux: sudo apt install git')
    process.exit(1)
  }
  console.log('✅ Git trouvé')
  console.log('')

  // 2. Vérifier lint-staged
  console.log('📌 Vérification de lint-staged...')
  checkLintStaged()
  console.log('')

  // 3. Initialiser Git
  console.log('📌 Initialisation de Git...')
  initGit()
  console.log('')

  // 4. Installer Husky
  console.log('📌 Installation de Husky...')
  try {
    execSync('npm install --save-dev husky@9.0.11 lint-staged@15.2.2', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('✅ Dépendances installées')
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation des dépendances')
    process.exit(1)
  }
  console.log('')

  // 5. Initialiser Husky
  console.log('📌 Initialisation de Husky...')
  try {
    execSync('npx husky install', { stdio: 'inherit' })
    console.log('✅ Husky initialisé')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Husky')
    process.exit(1)
  }
  console.log('')

  // 6. Créer le hook pre-commit
  console.log('📌 Création du hook pre-commit...')
  createPreCommitHook()
  console.log('')

  // 7. Vérification finale
  console.log('📌 Vérification finale...')
  console.log(`   ✅ Husky: ${fs.existsSync('.husky') ? 'OK' : '❌'}`)
  console.log(`   ✅ pre-commit: ${fs.existsSync('.husky/pre-commit') ? 'OK' : '❌'}`)
  console.log('')

  console.log('✅ Husky configuré avec succès !')
  console.log('')
  console.log('📋 Prochaines étapes:')
  console.log('   1. Vérifiez que vos scripts fonctionnent: npm run lint')
  console.log('   2. Testez le hook: git add . && git commit -m "test"')
  console.log('   3. Si le hook bloque, utilisez: git commit --no-verify')
}

// ============================================================
// EXÉCUTION
// ============================================================

// Vérifier qu'on est bien dans un projet npm
const isNpmProject = fs.existsSync('package.json')

if (!isNpmProject) {
  console.error('❌ Ce script doit être exécuté à la racine d\'un projet npm')
  process.exit(1)
}

console.assert(process.env.npm_config_user_agent, '⚠️ npm requis')

ensureHusky()
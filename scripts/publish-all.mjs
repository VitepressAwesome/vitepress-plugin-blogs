/**
 * Script: publish-all.mjs
 * Publishes all workspace packages to npm.
 * Skips packages whose exact version is already published.
 *
 * Usage:
 *   node scripts/publish-all.mjs           # publish all pending packages
 *   node scripts/publish-all.mjs --dry-run # list what would be published
 */

import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'tinyglobby'

const dryRun = process.argv.includes('--dry-run')
const root = resolve(fileURLToPath(import.meta.url), '../../packages')

if (dryRun) {
  console.log('🔍 Dry run mode — nothing will be published.\n')
}

function npmView(name, version) {
  try {
    execSync(`npm view ${name}@${version} version`, { stdio: 'pipe' })
    return true // version exists on npm
  } catch {
    return false // version not published yet
  }
}

function publishPackage(pkgDir) {
  const pkgJsonPath = join(pkgDir, 'package.json')
  if (!existsSync(pkgJsonPath)) return

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  if (pkg.private) {
    console.log(`⏭  Skipping private package: ${pkg.name}`)
    return
  }

  const distExists = existsSync(join(pkgDir, 'dist'))
  if (!distExists) {
    console.log(`⚠️  No dist for ${pkg.name} — run pnpm build first`)
    return
  }

  const exists = npmView(pkg.name, pkg.version)
  if (exists) {
    console.log(`⏭  Already published: ${pkg.name}@${pkg.version}`)
    return
  }

  if (dryRun) {
    console.log(`📦 Would publish: ${pkg.name}@${pkg.version}`)
    return
  }

  console.log(`📦 Publishing ${pkg.name}@${pkg.version}...`)
  try {
    execSync(`npm publish --access public --provenance`, { cwd: pkgDir, stdio: 'inherit' })
    console.log(`✅ Published ${pkg.name}@${pkg.version}`)
  } catch {
    // Try without provenance (local publish doesn't support --provenance)
    try {
      execSync(`npm publish --access public`, { cwd: pkgDir, stdio: 'inherit' })
      console.log(`✅ Published ${pkg.name}@${pkg.version}`)
    } catch (e2) {
      console.error(`❌ Failed to publish ${pkg.name}@${pkg.version}: ${e2.message}`)
      process.exitCode = 1
    }
  }
}

const pkgDirs = globSync(['*/package.json'], { cwd: root, absolute: false })
  .map(f => resolve(root, f.replace(/[/\\]package\.json$/, '')))
  .sort()

console.log(`Found ${pkgDirs.length} packages to check.\n`)

for (const dir of pkgDirs) {
  publishPackage(dir)
}

if (dryRun) {
  console.log('\n✨ Dry run complete. Run without --dry-run to publish.')
}

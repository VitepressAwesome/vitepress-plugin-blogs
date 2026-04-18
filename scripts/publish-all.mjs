/**
 * Script: publish-all.mjs
 * Publishes all workspace packages to npm.
 * Skips packages whose exact version is already published.
 */

import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'tinyglobby'

const root = resolve(fileURLToPath(import.meta.url), '../../packages')

function npmView(name, version) {
  try {
    execSync(`npm view ${name}@${version} version`, { stdio: 'pipe' })
    return true // version exists
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
    console.log(`⏭  Skipping ${pkg.name} (no dist folder)`)
    return
  }

  const exists = npmView(pkg.name, pkg.version)
  if (exists) {
    console.log(`⏭  Skipping ${pkg.name}@${pkg.version} (already published)`)
    return
  }

  console.log(`📦 Publishing ${pkg.name}@${pkg.version}...`)
  try {
    execSync(`npm publish --access public`, { cwd: pkgDir, stdio: 'inherit' })
    console.log(`✅ Published ${pkg.name}@${pkg.version}`)
  } catch (e) {
    console.error(`❌ Failed to publish ${pkg.name}@${pkg.version}: ${e.message}`)
    process.exitCode = 1
  }
}

const pkgDirs = globSync(['*/package.json'], { cwd: root, absolute: false })
  .map(f => resolve(root, f.replace(/[/\\]package\.json$/, '')))

for (const dir of pkgDirs) {
  publishPackage(dir)
}

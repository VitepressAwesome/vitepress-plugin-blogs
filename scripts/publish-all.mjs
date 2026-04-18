/**
 * Script: publish-all.mjs
 * Publishes all workspace packages to npm using NPM_TOKEN env var.
 * Skips packages whose exact version is already published.
 * Uses `pnpm publish` so workspace:* and catalog: are replaced with real versions.
 *
 * Usage:
 *   NPM_TOKEN=npm_xxx node scripts/publish-all.mjs           # publish all pending packages
 *   NPM_TOKEN=npm_xxx node scripts/publish-all.mjs --dry-run # list what would be published
 */

import { execSync, spawnSync } from 'node:child_process'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { globSync } from 'tinyglobby'

const dryRun = process.argv.includes('--dry-run')
const root = resolve(fileURLToPath(import.meta.url), '../../packages')
const repoRoot = resolve(fileURLToPath(import.meta.url), '../..')

// --- Auth: require NPM_TOKEN env var ---
const token = process.env.NPM_TOKEN
if (!token) {
  console.error('❌ NPM_TOKEN environment variable is not set.')
  console.error('')
  console.error('   请先设置 NPM_TOKEN 后再运行此脚本：')
  console.error('   Windows PowerShell:')
  console.error('     $env:NPM_TOKEN="npm_xxxxxxxx"; node scripts/publish-all.mjs')
  console.error('   Windows CMD:')
  console.error('     set NPM_TOKEN=npm_xxxxxxxx && node scripts/publish-all.mjs')
  console.error('   Linux / macOS:')
  console.error('     NPM_TOKEN=npm_xxxxxxxx node scripts/publish-all.mjs')
  console.error('')
  console.error('   Token 可在 https://www.npmjs.com/settings/tokens 创建（选 Automation 类型）')
  process.exit(1)
}

// Write a temporary .npmrc with the token (used by both npm and pnpm child processes)
const tmpNpmrc = join(tmpdir(), `.npmrc-publish-${Date.now()}`)
writeFileSync(tmpNpmrc, `//registry.npmjs.org/:_authToken=${token}\nregistry=https://registry.npmjs.org/\n`)

// Verify token works before attempting to publish
const whoami = spawnSync('npm', ['whoami', `--userconfig=${tmpNpmrc}`], { encoding: 'utf8' })
if (whoami.status !== 0) {
  console.error('❌ NPM_TOKEN 无效或已过期（npm whoami 返回错误）')
  console.error('   请到 https://www.npmjs.com/settings/tokens 生成新 token')
  process.exit(1)
}
console.log(`✔  已通过 npm 认证，当前用户: ${whoami.stdout.trim()}\n`)

if (dryRun) {
  console.log('🔍 Dry run mode — nothing will be published.\n')
}

function npmView(name, version) {
  try {
    execSync(`npm view ${name}@${version} version --userconfig=${tmpNpmrc}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
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
  // Use pnpm publish: it replaces workspace:* → real version, catalog: → real version
  const result = spawnSync(
    'pnpm',
    ['publish', '--access', 'public', '--no-git-checks'],
    {
      cwd: pkgDir,
      stdio: 'inherit',
      encoding: 'utf8',
      env: {
        ...process.env,
        NPM_TOKEN: token,
        npm_config_userconfig: tmpNpmrc,
      },
    }
  )
  if (result.status === 0) {
    console.log(`✅ Published ${pkg.name}@${pkg.version}\n`)
  } else {
    console.error(`❌ Failed to publish ${pkg.name}@${pkg.version}\n`)
    process.exitCode = 1
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
